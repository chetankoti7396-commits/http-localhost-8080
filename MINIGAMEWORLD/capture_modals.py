import subprocess
import time
import json
import urllib.request
import socket
import struct
import base64
import os

class SimpleWebSocketClient:
    def __init__(self, ws_url):
        url_clean = ws_url.replace("ws://", "")
        parts = url_clean.split("/", 1)
        host_port = parts[0].split(":")
        self.host = host_port[0]
        self.port = int(host_port[1])
        self.path = "/" + parts[1]
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((self.host, self.port))
        self._handshake()

    def _handshake(self):
        sec_key = base64.b64encode(os.urandom(16)).decode()
        req = (
            f"GET {self.path} HTTP/1.1\r\n"
            f"Host: {self.host}:{self.port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {sec_key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode())
        res = self.sock.recv(4096).decode(errors="ignore")
        if "101 " not in res:
            raise Exception("WebSocket handshake failed: " + res)

    def send_json(self, data):
        payload = json.dumps(data).encode("utf-8")
        length = len(payload)
        frame = bytearray([0x81])
        mask = os.urandom(4)
        if length <= 125:
            frame.append(0x80 | length)
        elif length <= 65535:
            frame.append(0x80 | 126)
            frame.extend(struct.pack("!H", length))
        else:
            frame.append(0x80 | 127)
            frame.extend(struct.pack("!Q", length))
        frame.extend(mask)
        masked_payload = bytearray(payload[i] ^ mask[i % 4] for i in range(length))
        frame.extend(masked_payload)
        self.sock.sendall(frame)

    def recv_json(self, timeout=3.0):
        self.sock.settimeout(timeout)
        try:
            head = self.sock.recv(2)
            if not head:
                return None
            length = head[1] & 0x7F
            if length == 126:
                ext = self.sock.recv(2)
                length = struct.unpack("!H", ext)[0]
            elif length == 127:
                ext = self.sock.recv(8)
                length = struct.unpack("!Q", ext)[0]
            payload = b""
            while len(payload) < length:
                chunk = self.sock.recv(length - len(payload))
                if not chunk:
                    break
                payload += chunk
            return json.loads(payload.decode("utf-8", errors="ignore"))
        except socket.timeout:
            return None

def capture_screenshot_cmd(ws, msg_id, file_path):
    ws.send_json({
        "id": msg_id,
        "method": "Page.captureScreenshot",
        "params": {"format": "png"}
    })
    start = time.time()
    while time.time() - start < 5:
        msg = ws.recv_json(timeout=1.0)
        if msg and msg.get("id") == msg_id:
            data = msg["result"]["data"]
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved:", file_path)
            return True
    return False

def run():
    artifact_dir = r"C:\Users\cheta\.gemini\antigravity\brain\31a8ef63-10ec-473b-9213-6c713cc26906"
    cmd = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--window-size=1200,850",
        "http://localhost:8080"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)

    try:
        with urllib.request.urlopen("http://localhost:9222/json") as res:
            targets = json.loads(res.read().decode())
        
        main_page = next((t for t in targets if "localhost:8080" in t.get("url", "")), None)
        if not main_page:
            return

        ws = SimpleWebSocketClient(main_page["webSocketDebuggerUrl"])
        ws.send_json({"id": 1, "method": "Page.enable"})
        time.sleep(0.5)

        games = ['snake', 'tictactoe', 'memory', 'racer']
        for i, g in enumerate(games):
            # Open game modal
            ws.send_json({
                "id": 100 + i,
                "method": "Runtime.evaluate",
                "params": {"expression": f"document.querySelector('[data-open-game=\"{g}\"]').click();"}
            })
            time.sleep(0.6)
            capture_screenshot_cmd(ws, 200 + i, os.path.join(artifact_dir, f"modal_{g}.png"))
            # Close modal
            ws.send_json({
                "id": 300 + i,
                "method": "Runtime.evaluate",
                "params": {"expression": "document.querySelector('.modal-close-btn').click();"}
            })
            time.sleep(0.4)

    finally:
        proc.terminate()

if __name__ == "__main__":
    run()
