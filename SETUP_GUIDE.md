# HORUS Fullstack Setup Guide

This guide will help you install all required dependencies and run both the frontend and backend servers for the HORUS system.

---

## 1. Prerequisites
- **Node.js** (v16 or higher recommended)
- **npm** (comes with Node.js)
- **Python** (3.8 or higher recommended)
- **pip** (Python package manager)

---

## 2. Install Node Libraries (Frontend)

1. Open a terminal and navigate to the frontend directory:
   ```bash
   cd HORUS_frontend
   ```
2. Install all required Node.js packages:
   ```bash
   npm install
   ```

---

## 3. Install Python Libraries (Backend)

1. Open a new terminal and navigate to the backend directory:
   ```bash
   cd HORUS_backend
   ```
2. (Optional but recommended) Create and activate a virtual environment:
   ```bash
   python -m venv horus_env
   # On Windows:
   horus_env\Scripts\activate
   # On macOS/Linux:
   source horus_env/bin/activate
   ```
3. Install all required Python packages:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

---

## 4. Running the Backend Server

1. From the `HORUS_backend` directory, start the backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   uvicorn app.tracking_main:app --reload --port 8001
   uvicorn app.assettracker.main:app --relod --port 8002
   uvicorn app.main:app --relod --host 0.0.0.0 --port 8000
   ```
   - Different processes run on these different ports. So ensure to run all otf them.

---

## 5. Running the Frontend Server

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd HORUS_frontend
   ```
2. Start the frontend development server:
   ```bash
   npm run dev
   ```
   - The frontend will be available at `http://localhost:5173` (or as indicated in the terminal)

---

## 6. Additional Notes
- Make sure both servers are running for full functionality.
- If you encounter installation issues, refer to the troubleshooting sections in the respective `README.md` files or documentation.
- For face recognition features, ensure all system dependencies (like CMake, dlib, OpenCV) are installed as described in the backend setup instructions.

---

Happy building with HORUS!
