# HORUS Multi-Organization Face Recognition System

## System Overview

The HORUS Face Recognition System is a modern, scalable solution that supports multiple organizations with completely isolated data storage. Built with MVC architecture and featuring independent camera state management for optimal user experience.

### Key Features
- **Multi-Organization Support**: Complete data isolation per organization
- **MVC Architecture**: Clean separation of concerns with controller pattern
- **Independent Camera States**: Separate camera management for Register/Recognize tabs
- **Real-time Recognition**: Advanced face detection and recognition
- **Attendance Automation**: Automatic attendance marking with recognition
- **Comprehensive Reporting**: Daily and historical attendance reports

## Installation Steps

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd HORUS_backend
   ```

2. **System Dependencies Installation** (Required before Python packages):
   
   **For Windows:**
   ```bash
   # Install Visual Studio Build Tools (Visual Studio Installer)
   # Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   
   # Install CMake
   # Download from: https://cmake.org/download/
   # Or via chocolatey: choco install cmake
   
   # Install dlib dependencies
   pip install cmake
   pip install dlib
   ```

   **For Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install build-essential cmake
   sudo apt install libopenblas-dev liblapack-dev
   sudo apt install libx11-dev libgtk-3-dev
   sudo apt install python3-dev
   sudo apt install libboost-all-dev
   ```

   **For macOS:**
   ```bash
   # Install Xcode command line tools
   xcode-select --install
   
   # Install cmake and other dependencies
   brew install cmake
   brew install boost
   brew install boost-python3
   ```

3. Install Python dependencies:
   ```bash
   # Upgrade pip first
   pip install --upgrade pip
   
   # Install requirements
   pip install -r requirements.txt
   ```

   **Note**: If you encounter issues with face-recognition installation:
   ```bash
   # Alternative installation approach
   pip install cmake
   pip install dlib
   pip install face-recognition
   pip install opencv-python
   ```

4. **Verify Installation**:
   ```bash
   python -c "import face_recognition; import cv2; print('Face recognition dependencies installed successfully!')"
   ```

5. Start the backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd HORUS_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## System Features

### Multi-Organization Architecture
- **Data Isolation**: Each organization maintains separate face encodings and attendance records
- **Scalable Design**: Support for unlimited organizations
- **Security**: No cross-organization data access
- **Organization Setup**: Simple email-based organization identification

### Advanced Face Recognition
- **High Accuracy**: State-of-the-art face detection and recognition algorithms
- **Multiple Encodings**: Support for multiple face encodings per user for improved accuracy
- **Configurable Tolerance**: Adjustable recognition sensitivity
- **Real-time Processing**: Fast face detection and recognition

### Camera Management
- **Independent States**: Separate camera streams for Register and Recognize tabs
- **Automatic Cleanup**: Proper camera resource management when switching tabs
- **Cross-browser Support**: Compatible with modern web browsers
- **Error Handling**: Robust camera access error management

### Attendance System
- **Automatic Marking**: Mark attendance automatically upon face recognition
- **Duplicate Prevention**: Prevents multiple attendance entries per day
- **Historical Tracking**: Comprehensive attendance history
- **CSV Export**: Attendance data in standard CSV format

### User Management
- **Easy Registration**: Simple face registration process
- **User Profiles**: Store user details with face encodings
- **Bulk Operations**: Manage multiple users efficiently
- **Secure Deletion**: Safe user removal with data cleanup

## API Endpoints

All endpoints require an `org_email` query parameter for organization isolation.

### Face Management
- `POST /api/face-recognition/register-face` - Register a new face with organization context
- `POST /api/face-recognition/recognize-face` - Recognize faces in an image for specific organization
- `DELETE /api/face-recognition/user/{user_id}` - Delete a registered user from organization

### Attendance Operations
- `POST /api/face-recognition/mark-attendance` - Mark attendance for a user in organization
- `POST /api/face-recognition/recognize-and-mark-attendance` - Combined recognition and attendance marking
- `GET /api/face-recognition/attendance/{date}` - Get attendance for specific date and organization
- `GET /api/face-recognition/attendance` - Get today's attendance for organization

### User Operations
- `GET /api/face-recognition/registered-users` - Get all registered users for organization

## System Usage

### Organization Setup
1. **Initial Setup**: Enter your organization email address when first accessing the system
2. **Data Isolation**: Your organization's data will be completely separate from others
3. **Email Format**: Use your official organization email (e.g., `construction@company.com`)

### Face Registration Process
1. **Access Registration**: Navigate to the "Register Face" tab
2. **Camera Setup**: Start the dedicated registration camera
3. **Capture Image**: Take a clear photo with good lighting
4. **User Details**: Enter employee name and type
5. **Confirmation**: Verify successful registration

### Face Recognition Workflow
1. **Recognition Tab**: Switch to the "Recognize Faces" tab
2. **Independent Camera**: Start the separate recognition camera
3. **Real-time Detection**: System identifies faces in real-time
4. **Attendance Marking**: Automatic attendance marking for recognized users
5. **Results Display**: View recognition results and confidence scores

### Dashboard Features
1. **User Management**: View all registered users for your organization
2. **Attendance Reports**: Monitor daily and historical attendance
3. **Real-time Updates**: Instant feedback for all operations
4. **Export Data**: Download attendance reports in CSV format

### Camera State Management
- **Independent Streams**: Register and Recognize tabs use separate camera instances
- **Automatic Switching**: Seamless transition between camera modes
- **Resource Cleanup**: Proper camera resource management
- **Error Recovery**: Automatic recovery from camera access issues

## Data Storage Architecture

### Organization-Based Structure
```
HORUS_backend/app/facerecognizer/organizations/
├── organization1_at_company1_dot_com/
│   ├── encodings/face_encodings.pkl
│   └── attendance/
│       ├── attendance_2025-07-12.csv
│       └── attendance_2025-07-13.csv
├── organization2_at_company2_dot_com/
│   ├── encodings/face_encodings.pkl
│   └── attendance/
│       └── attendance_2025-07-12.csv
└── ...
```

### Email Sanitization
- Organization emails are sanitized for filesystem compatibility
- `@` becomes `_at_`, `.` becomes `_dot_`
- Example: `construction@company.com` → `construction_at_company_dot_com`

### Data Security
- **Isolated Storage**: Each organization's data is completely separate
- **Secure Encoding**: Face data stored as encrypted pickle files
- **Attendance Logs**: CSV format for easy analysis and backup
- **Access Control**: Organization-based access restrictions

### Legacy Migration
- Existing single-organization data can be migrated
- Legacy files remain in original location during transition
- Smooth migration path to multi-organization structure

## Troubleshooting Guide

### Camera Access Issues
- **Permission Denied**: Ensure browser has camera permissions enabled
- **Camera Not Found**: Check if camera is connected and not used by other applications
- **Tab Switching**: If camera doesn't start, try refreshing the page
- **Browser Compatibility**: Use modern browsers (Chrome, Firefox, Safari, Edge)

### Face Recognition Problems
- **Poor Detection**: Ensure good lighting and clear face visibility
- **Low Confidence**: Try different angles or distances from camera
- **Multiple Faces**: System works best with single face in frame
- **Encoding Issues**: Re-register user if consistent recognition failures occur

### System Performance
- **Slow Recognition**: Check internet connection and server load
- **Memory Issues**: Restart browser if performance degrades
- **Large Databases**: Consider archiving old attendance data
- **API Timeouts**: Increase timeout settings for large image files

### Organization Setup
- **Email Format**: Use proper email format (user@domain.com)
- **Data Not Found**: Verify organization email is entered correctly
- **Access Issues**: Ensure organization has been properly initialized

### Installation Troubleshooting

#### Common Installation Issues

**1. dlib Installation Fails on Windows:**
```bash
# Solution 1: Install pre-compiled wheel
pip install https://github.com/ageitgey/face_recognition/releases/download/v1.3.0/dlib-19.24.4-cp39-cp39-win_amd64.whl

# Solution 2: Use conda instead of pip
conda install -c conda-forge dlib
conda install -c conda-forge face_recognition
```

**2. CMAKE Errors:**
```bash
# Ensure CMake is in PATH
cmake --version

# If not found, add CMake to system PATH or reinstall
```

**3. Face Recognition Import Errors:**
```bash
# Check if all dependencies are installed
python -c "import dlib; print('dlib version:', dlib.DLIB_VERSION)"
python -c "import cv2; print('OpenCV version:', cv2.__version__)"
python -c "import face_recognition; print('Face recognition installed successfully')"
```

**4. Memory Issues During Installation:**
```bash
# Increase pip timeout and use no-cache
pip install --no-cache-dir --timeout 1000 face-recognition
```

**5. Permission Errors:**
```bash
# Use user installation
pip install --user -r requirements.txt

# Or use virtual environment (recommended)
python -m venv face_recognition_env
source face_recognition_env/bin/activate  # On Windows: face_recognition_env\Scripts\activate
pip install -r requirements.txt
```

#### Virtual Environment Setup (Recommended)

```bash
# Create virtual environment
python -m venv horus_env

# Activate virtual environment
# Windows:
horus_env\Scripts\activate
# macOS/Linux:
source horus_env/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Verify installation
python -c "import face_recognition, cv2; print('All dependencies installed successfully!')"
```

#### Docker Alternative (Advanced)

If you continue to have installation issues, consider using Docker:

```dockerfile
# Dockerfile for HORUS Backend
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run with Docker:
```bash
docker build -t horus-backend .
docker run -p 8000:8000 horus-backend
```

## Technical Architecture

### Backend Structure
- **Controller Pattern**: `FaceRecognitionController` handles all business logic
- **Route Handlers**: Clean API endpoints that delegate to controller
- **Service Layer**: Utility functions for image processing and file operations
- **Data Access**: Organization-specific database operations

### Frontend Components
- **Independent Camera States**: Separate video references for each tab
- **Service Integration**: Centralized API communication
- **Error Handling**: Comprehensive error management and user feedback
- **Responsive Design**: Adaptive UI for different screen sizes

### Security Implementation
- **Data Isolation**: Organization-based access control
- **Input Validation**: Comprehensive validation of all inputs
- **Error Sanitization**: Secure error messages without sensitive data
- **File Security**: Safe file handling and storage practices

## Security & Production Considerations

### Data Protection
- **Encryption**: Face encodings stored in secure pickle format
- **Access Control**: Organization-based data isolation
- **Backup Strategy**: Regular backup of organization-specific data
- **Data Retention**: Implement policies for data lifecycle management

### Production Deployment
- **Database Migration**: Consider moving from pickle files to secure database
- **Load Balancing**: Implement for high-traffic scenarios
- **Monitoring**: Set up system monitoring and alerting
- **SSL/TLS**: Ensure encrypted communication in production

### Compliance Considerations
- **Privacy Laws**: Ensure compliance with local privacy regulations
- **Data Consent**: Implement proper consent mechanisms
- **Audit Trails**: Log all access and modifications
- **Right to Deletion**: Provide mechanisms for data removal

### Performance Optimization
- **Image Compression**: Optimize image sizes for faster processing
- **Caching**: Implement caching for frequently accessed data
- **Database Indexing**: Optimize database queries for large datasets
- **Background Processing**: Consider async processing for heavy operations

## Integration with HORUS Dashboard

### Seamless Experience
- **Unified Navigation**: Integrated sidebar navigation system
- **Consistent Design**: Follows HORUS design language and patterns
- **Real-time Updates**: Live feedback across all operations
- **Mobile Responsiveness**: Full functionality on mobile devices

### Module Integration
- **Authentication**: Integrated with HORUS user authentication system
- **Permissions**: Role-based access control integration
- **Notifications**: System-wide notification integration
- **Reporting**: Unified reporting dashboard integration

### Development Guidelines
- **Code Standards**: Follow established HORUS coding conventions
- **Testing**: Comprehensive unit and integration testing
- **Documentation**: Maintain up-to-date technical documentation
- **Version Control**: Proper git workflow and branch management

## Future Enhancements

### Planned Features
- **Advanced Analytics**: AI-powered attendance insights
- **Mobile App**: Dedicated mobile application
- **API Improvements**: Enhanced REST API with GraphQL support
- **Cloud Integration**: Cloud storage and processing options

### Scalability Roadmap
- **Microservices**: Transition to microservices architecture
- **Container Deployment**: Docker and Kubernetes support
- **Global CDN**: Content delivery network for images
- **Real-time Sync**: Multi-location data synchronization
