#!/usr/bin/env python3
"""
HORUS Mobile Server
Serves the mobile attendance HTML page for wireless camera streaming
"""
import http.server
import socketserver
import socket
import webbrowser
import sys
from pathlib import Path

def get_local_ip():
    """Get the local IP address"""
    try:
        # Connect to a remote address to get the local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"

def main():
    PORT = 3000  # Changed from 3000 to avoid conflicts
    local_ip = get_local_ip()
    
    # Change to the directory containing mobile_attendance.html
    current_dir = Path(__file__).parent
    mobile_file = current_dir / "mobile_attendance.html"
    
    if not mobile_file.exists():
        print(f"Error: mobile_attendance.html not found in {current_dir}")
        print("Please ensure the mobile_attendance.html file exists in the same directory.")
        sys.exit(1)
    
    class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', '*')
            super().end_headers()
        
        def log_message(self, format, *args):
            """Log requests"""
            print(f"{self.address_string()} - {format % args}")
    
    try:
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            print("🚀 HORUS Mobile Server Started!")
            print("=" * 50)
            print(f"Mobile Page URL: http://{local_ip}:{PORT}/mobile_attendance.html")
            print(f"Local URL: http://localhost:{PORT}/mobile_attendance.html")
            print("=" * 50)
            print("Instructions:")
            print("1. Ensure HORUS backend is running on port 8000")
            print("2. Open the mobile URL on your phone's browser")
            print(f"3. Enter server IP: {local_ip}")
            print("4. Connect and start streaming!")
            print("=" * 50)
            print("Press Ctrl+C to stop the server")
            print()
            
            # Auto-open browser for testing
            try:
                webbrowser.open(f"http://localhost:{PORT}/mobile_attendance.html")
                print("Opened browser for testing")
            except:
                pass
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\nServer stopped!")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"Port {PORT} is already in use. Try stopping other servers or use a different port.")
        else:
            print(f"Error starting server: {e}")

if __name__ == "__main__":
    main()
