# 🔍 HORUS - Frictionless Object Tracking System

[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

HORUS is a comprehensive frictionless tracking system designed to enhance productivity and safety at construction sites. It combines computer vision (CV) for PPE compliance detection and ESP32-based IoT tracking for asset movement monitoring. The system provides features such as real-time room-based item location, named person tracking, and AI-based summary reporting.

## 🌟 Key Features

### 🎯 Computer Vision Module
- **PPE Compliance Detection**: Real-time detection of safety violations (missing helmets, vests)
- **Named Person Tracking**: Personalized monitoring instead of anonymous tracking
- **Multi-Camera Support**: Parallel processing across multiple camera feeds
- **YOLO + ReID Integration**: Advanced object detection with person re-identification

### 📡 IoT Asset Tracking Module
- **Room-based Location**: Precise indoor positioning system
- **Movement History**: Complete audit trail of asset movements
- **Live Dashboard**: Real-time visualization of asset locations

### 👤 Face Recognition System
- **Multi-Organization Support**: Complete data isolation per organization
- **Automatic Attendance**: Face recognition with automatic attendance marking
- **Mobile Compatibility**: Wireless camera streaming from mobile devices
- **Comprehensive Reporting**: Daily and historical attendance reports

### 🤖 AI Chat Agent
- **RAG-powered Support**: Retrieval-Augmented Generation for intelligent responses
- **Knowledge Base Integration**: Access to system documentation and FAQs
- **Multi-Model Support**: OpenAI GPT and local models (FLAN-T5, distilGPT-2)
- **Vector Search**: FAISS-powered semantic search capabilities

### 📊 Analytics & Reporting
- **Real-time Dashboards**: Live monitoring of all system components
- **Trend Analysis**: Historical data analysis and insights
- **Safety Reports**: PPE compliance reporting and violation tracking
- **Asset Utilization**: Movement patterns and usage analytics

## 🏗️ Architecture

```
HORUS System
├── Frontend (React + TypeScript)
│   ├── Landing Page
│   ├── User Dashboard
│   ├── Face Recognition Interface
│   ├── Asset Tracking Dashboard
│   └── Chat Agent Interface
├── Backend (FastAPI + Python)
│   ├── Authentication & User Management
│   ├── Computer Vision Processing
│   ├── Face Recognition Service
│   ├── Asset Tracking API
│   ├── AI Chat Agent
│   └── Reporting Engine
├── Database (MongoDB Atlas)
│   ├── User Data
│   ├── Detection Logs
│   ├── Movement History
│   └── Attendance Records
└── IoT Infrastructure
    ├── ESP32 Devices
    ├── Wi-Fi Access Points
    └── RSSI Monitoring
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (3.8 or higher)
- **MongoDB Atlas** account
- **OpenAI API Key** (for AI features)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/HORUS-Frictionless-Object-Tracking-System.git
cd HORUS-Frictionless-Object-Tracking-System
```

### 2. Backend Setup
```bash
cd HORUS_backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string and OpenAI API key
```

### 3. Frontend Setup
```bash
cd HORUS_frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Start All Services
Use the provided initialization script:
```bash
# From project root
python initiation.py
```

This will start:
- **Frontend**: http://localhost:5173
- **Main API**: http://localhost:8000
- **Tracking API**: http://localhost:8001
- **Asset Tracker**: http://localhost:8002

## 📱 Mobile Setup

For wireless face recognition attendance:

1. **Start Backend**:
   ```bash
   cd HORUS_backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Serve Mobile Page**:
   ```bash
   python serve_mobile.py
   ```

3. **Access from Phone**:
   - Connect phone to same WiFi network
   - Open browser: `http://YOUR_LAPTOP_IP:3000/mobile_attendance.html`
   - Enter laptop IP and organization email
   - Start camera streaming for attendance

## 🔧 Configuration

### Environment Variables
Create `.env` file in `HORUS_backend/`:
```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
OPENAI_API_KEY=your_openai_api_key_here
YOLO_MODEL_PATH=path/to/yolo/model.pt
REID_MODEL_PATH=path/to/reid/model.pth.tar
REFERENCE_IMAGES_PATH=path/to/reference/images
```

### Model Files
Required model files (not included in repository):
- **YOLO Model**: `workforcetracker/trackingmodel/yolo/Model1/weights/best.pt`
- **ReID Model**: `workforcetracker/trackingmodel/reid/Model1/model.pth.tar-60`
- **Reference Images**: `workforcetracker/reference_images/`

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/user` - Get current user

### Face Recognition
- `POST /api/face-recognition/register-face` - Register new face
- `POST /api/face-recognition/recognize-face` - Recognize face
- `POST /api/face-recognition/mark-attendance` - Mark attendance

### Asset Tracking
- `GET /api/movement-history` - Get movement history
- `POST /api/movement-history` - Log movement data
- `WebSocket /ws/movements` - Real-time movement updates

### Computer Vision
- `POST /api/detection/detect` - Process detection frame
- `WebSocket /ws/video` - Live video stream processing

### AI Chat Agent
- `POST /chatagent/chat` - Chat with AI agent
- `GET /chatagent/health` - Service health check

## 🛠️ Development

### Project Structure
```
HORUS_backend/
├── app/
│   ├── api/          # API routes and controllers
│   ├── assettracker/ # Asset tracking module
│   ├── chatagent/    # AI chat agent
│   ├── database/     # Database configurations
│   ├── facerecognizer/ # Face recognition service
│   ├── models/       # Data models
│   └── workforcetracker/ # Computer vision module
├── requirements.txt
└── main.py

HORUS_frontend/
├── src/
│   ├── components/   # React components
│   ├── services/     # API services
│   └── assets/       # Static assets
├── package.json
└── vite.config.ts
```

### Adding New Features
1. Create feature branch: `git checkout -b feature/new-feature`
2. Add backend API endpoints in `app/api/routes/`
3. Add frontend components in `src/components/`
4. Update documentation
5. Submit pull request

## 🧪 Testing

```bash
# Backend tests
cd HORUS_backend
pytest

# Frontend tests
cd HORUS_frontend
npm test
```

## 📊 System Requirements

### Hardware
- **Minimum**: 8GB RAM, Intel i5 or equivalent
- **Recommended**: 16GB RAM, Intel i7 or equivalent, NVIDIA GPU (for CV processing)
- **Storage**: 10GB free space
- **Network**: Stable internet connection for MongoDB Atlas

### Software
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Python**: 3.8-3.11
- **Node.js**: 16.0+

## 🙏 Acknowledgments

- OpenAI for GPT models
- Ultralytics for YOLO implementation
- FastAPI team for the excellent framework
- React team for the frontend framework
- MongoDB for database services

---

<p align="center">
  Made with ❤️ by the Team Epochs4
</p>
