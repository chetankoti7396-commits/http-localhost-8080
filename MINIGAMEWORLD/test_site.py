import subprocess
import time
import json
import urllib.request
import socket
import struct
import base64
import os
import sys

class SimpleWebSocketClient:
    def __init__(self, ws_url):
        # ws://127.0.0.1:9222/devtools/page/...
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
        frame = bytearray([0x81]) # FIN + text frame
        # Masked client frame
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

    def recv_json(self, timeout=2.0):
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

def run_diagnostics():
    cmd = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "http://localhost:8080"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)

    console_messages = []
    js_exceptions = []

    try:
        with urllib.request.urlopen("http://localhost:9222/json") as res:
            targets = json.loads(res.read().decode())
        
        main_page = None
        for t in targets:
            if "localhost:8080" in t.get("url", ""):
                main_page = t
                break
        
        if not main_page:
            print("ERROR: localhost:8080 target not found")
            return

        ws = SimpleWebSocketClient(main_page["webSocketDebuggerUrl"])
        print("Connected via CDP WebSocket to target:", main_page["id"])

        # Enable Console and Runtime
        ws.send_json({"id": 1, "method": "Console.enable"})
        ws.send_json({"id": 2, "method": "Runtime.enable"})

        # Check document title & evaluate test script
        ws.send_json({
            "id": 3,
            "method": "Runtime.evaluate",
            "params": {"expression": "document.title"}
        })

        # Test whether all 4 game objects exist
        ws.send_json({
            "id": 4,
            "method": "Runtime.evaluate",
            "params": {
                "expression": "({ hasStorage: !!window.storage, hasSounds: !!window.sounds, hasSnake: !!window.SnakeGame, hasTTT: !!window.TicTacToeGame, hasMemory: !!window.MemoryGame, hasRacer: !!window.RacerGame })",
                "returnByValue": True
            }
        })

        # Test clicking play buttons for all 4 games
        ws.send_json({
            "id": 5,
            "method": "Runtime.evaluate",
            "params": {
                "expression": """
                (function() {
                    const results = {};
                    ['snake', 'tictactoe', 'memory', 'racer'].forEach(g => {
                        const btn = document.querySelector(`[data-open-game="${g}"]`);
                        if (btn) {
                            btn.click();
                            const modal = document.getElementById(`modal-${g}`);
                            results[g] = modal && !modal.classList.contains('hidden');
                            // close
                            const closeBtn = modal ? modal.querySelector('.modal-close-btn') : null;
                            if (closeBtn) closeBtn.click();
                        } else {
                            results[g] = 'Button not found';
                        }
                    });
                    return results;
                })()
                """,
                "returnByValue": True
            }
        })

        # Collect responses
        start = time.time()
        while time.time() - start < 4:
            msg = ws.recv_json(timeout=0.5)
            if not msg:
                continue
            if msg.get("method") == "Console.messageAdded":
                console_messages.append(msg["params"]["message"])
            elif msg.get("method") == "Runtime.exceptionThrown":
                js_exceptions.append(msg["params"]["exceptionDetails"])
            elif "id" in msg:
                print(f"CDP Response [{msg['id']}]:", json.dumps(msg.get("result", {}), indent=2))

        print("\n--- DIAGNOSTICS SUMMARY ---")
        print("Console Messages:", len(console_messages))
        for m in console_messages:
            print("Console:", m.get("level"), m.get("text"))
        print("JS Exceptions:", len(js_exceptions))
        for exc in js_exceptions:
            print("Exception:", exc.get("text"), exc.get("exception", {}).get("description"))

    finally:
        proc.terminate()

if __name__ == "__main__":
    run_diagnostics()
