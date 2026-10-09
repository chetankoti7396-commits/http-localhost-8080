import subprocess
import time
import json
import urllib.request
import test_snake_deep

def main():
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
        ws = test_snake_deep.SimpleWebSocketClient(main_page["webSocketDebuggerUrl"])
        ws.send_json({"id": 1, "method": "Page.enable"})
        
        # Open Snake modal and let it advance
        ws.send_json({
            "id": 2,
            "method": "Runtime.evaluate",
            "params": {"expression": "document.querySelector('[data-open-game=\"snake\"]').click();"}
        })
        time.sleep(1.2)
        
        test_snake_deep.capture_screenshot_cmd(
            ws,
            10,
            r"C:\Users\cheta\.gemini\antigravity\brain\31a8ef63-10ec-473b-9213-6c713cc26906\snake_gameplay.png"
        )
    finally:
        proc.terminate()

if __name__ == "__main__":
    main()
