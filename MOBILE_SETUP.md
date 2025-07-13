# 📱 HORUS Mobile Attendance Setup

## Quick Setup Guide

### 1. Start HORUS Backend Server
```bash
cd HORUS_backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Find Your Laptop's IP Address
```bash
# Windows (PowerShell)
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -eq "Wi-Fi"}

# Windows (Command Prompt)
ipconfig | findstr IPv4

# Example output: 192.168.1.100
```

### 3. Serve Mobile Page
```bash
# In project root directory
python serve_mobile.py
```

### 4. Access from Phone
1. Open phone browser (Chrome recommended)
2. Go to: `http://192.168.1.100:3000/mobile_attendance.html`
3. Enter your laptop's IP address and organization email
4. Click Connect → Camera → Stream
5. Point camera at faces for automatic attendance marking

## Browser Compatibility
- ✅ Chrome Mobile (recommended)
- ✅ Firefox Mobile
- ✅ Safari Mobile (may require HTTPS in production)
- ✅ Edge Mobile

## Network Requirements
- Phone and laptop must be on same WiFi network
- Windows Firewall should allow ports 8000 and 3000
- For production: Use HTTPS for better browser compatibility

## Features
- 📱 **Wireless Streaming**: No cables needed
- 🎭 **Real-time Face Recognition**: Instant detection
- ✅ **Automatic Attendance**: Marks attendance when face recognized
- 📲 **Mobile Optimized**: Touch controls, haptic feedback
- 🔄 **Camera Controls**: Front/back camera switching
- 📊 **Live Results**: Real-time feedback on phone
- 🌐 **Network Streaming**: Works on any WiFi network
- 🔋 **Battery Efficient**: Optimized frame rates and wake lock

## Troubleshooting

### Camera Permission Issues
- **Android Chrome**: Address bar → 🔒 → Permissions → Camera → Allow
- **iPhone Safari**: Settings → Safari → Camera → Allow
- **iPhone Chrome**: Settings → Chrome → Camera → Allow

### Connection Issues
- **Cannot connect**: Verify IP address and ensure both devices are on same WiFi
- **Server not found**: Check if backend server is running on port 8000
- **Firewall blocking**: Allow Python through Windows Firewall

### Performance Issues
- **Slow recognition**: Frame processing is optimized to every 30th frame
- **Battery drain**: Wake lock prevents screen sleep during streaming
- **Network lag**: Reduce video quality if needed (currently optimized at 0.7 JPEG quality)

## Security Notes
- This setup is for development/internal use
- For production, implement HTTPS and proper authentication
- WebSocket connections are not encrypted in this demo version

## How It Works
1. **Mobile HTML page** captures camera stream
2. **JavaScript** converts video frames to base64 images
3. **WebSocket** sends frames to backend every 150ms
4. **FastAPI backend** processes frames with face recognition
5. **Automatic attendance** marking for recognized faces
6. **Real-time feedback** sent back to mobile device

Perfect for wireless face recognition attendance without any dashboard integration! 🎯
