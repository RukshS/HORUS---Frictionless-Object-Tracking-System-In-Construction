# Multi-Organization Face Recognition System

## Overview
The HORUS Face Recognition System supports multiple organizations with completely isolated data storage. Each organization is identified by their unique email address and has their own separate face encodings and attendance records. The system uses a modern MVC architecture with dedicated controllers for business logic separation.

## System Architecture

### MVC Pattern Implementation
- **Routes** (`app/api/routes/face_recognition.py`): Handle HTTP requests and responses
- **Controller** (`app/api/controllers/face_recognition_controller.py`): Contains all business logic
- **Models** (`app/models/`): Data structures and database interactions
- **Services**: Utility functions for image processing and file operations

### Organization Structure

#### Directory Layout
```
HORUS_backend/app/facerecognizer/organizations/
├── organization1_at_company1_dot_com/
│   ├── encodings/
│   │   └── face_encodings.pkl
│   └── attendance/
│       ├── attendance_2025-07-12.csv
│       ├── attendance_2025-07-13.csv
│       └── ...
├── organization2_at_company2_dot_com/
│   ├── encodings/
│   │   └── face_encodings.pkl
│   └── attendance/
│       ├── attendance_2025-07-12.csv
│       └── ...
└── ...
```

#### Email Sanitization
Organization email addresses are sanitized for filesystem use:
- `@` becomes `_at_`
- `.` becomes `_dot_`
- `/` and `\` become `_`

Example: `construction@company.com` → `construction_at_company_dot_com`

## API Endpoints

All endpoints require an `org_email` query parameter to specify the organization.

### Face Registration
```
POST /api/face-recognition/register-face
Query Parameters:
  - org_email: Organization email address
  - name: Full name of the person
  - employee_type: Employee type (e.g., Manager, Employee)
Body: Image file (multipart/form-data)
```

### Face Recognition
```
POST /api/face-recognition/recognize-face
Query Parameters:
  - org_email: Organization email address
Body: Image file (multipart/form-data)
```

### Attendance Management
```
POST /api/face-recognition/mark-attendance
Query Parameters:
  - org_email: Organization email address
  - user_id: User ID to mark attendance for

POST /api/face-recognition/recognize-and-mark-attendance
Query Parameters:
  - org_email: Organization email address
Body: Image file (multipart/form-data)
```

### User Management
```
GET /api/face-recognition/registered-users
Query Parameters:
  - org_email: Organization email address

DELETE /api/face-recognition/user/{user_id}
Query Parameters:
  - org_email: Organization email address
```

### Attendance Reports
```
GET /api/face-recognition/attendance/{date}
Query Parameters:
  - org_email: Organization email address
Path Parameters:
  - date: Date in YYYY-MM-DD format

GET /api/face-recognition/attendance
Query Parameters:
  - org_email: Organization email address
Returns: Today's attendance records
```

## Frontend Integration

### Camera State Management
The frontend now supports independent camera states for Register and Recognize tabs:
- **Register Tab**: Uses `registerVideoRef` with dedicated camera stream
- **Recognize Tab**: Uses `recognizeVideoRef` with separate camera stream
- **Independent Controls**: Each tab has its own start/stop camera functions
- **Automatic Cleanup**: Camera streams are properly managed when switching tabs

### Organization Email Setup
Before using any face recognition features, users must set their organization email through the dashboard interface.

### Service Integration
```typescript
import { FaceRecognitionService } from './services/FaceRecognitionService';

// All service methods automatically include the organization email
const service = new FaceRecognitionService();

// Register a face
await service.registerFace(formData, orgEmail, name, employeeType);

// Recognize faces
await service.recognizeFace(formData, orgEmail);

// Mark attendance
await service.markAttendance(orgEmail, userId);
```

## Benefits

1. **Data Isolation**: Each organization's data is completely separate
2. **Scalability**: Support unlimited organizations with independent scaling
3. **Security**: Organizations cannot access each other's data
4. **Easy Management**: Clear directory structure for each organization
5. **Backup/Migration**: Easy to backup or migrate specific organization data
6. **MVC Architecture**: Clean separation of concerns with controller pattern
7. **Independent Camera States**: Better user experience with separate camera management

## Technical Implementation

### Controller Pattern
- **FaceRecognitionController**: Handles all business logic
- **Route Handlers**: Simple delegation to controller methods
- **Consistent Architecture**: Follows the same pattern as authentication system

### Security Features
- Organization-based data isolation
- Sanitized file paths prevent directory traversal
- Independent user databases per organization
- Attendance records are organization-specific

### Performance Considerations
- Optimized face encoding storage with multiple encodings per user
- Efficient face matching algorithms with configurable tolerance
- Lazy loading of organization databases
- Proper error handling and validation

## Migration from Legacy System

### Legacy Data Location
Existing face encodings and attendance data from the single-organization format remain in:
- `HORUS_backend/app/facerecognizer/encodings/face_encodings.pkl`
- `HORUS_backend/app/facerecognizer/attendance_*.csv`

### Migration Process
To migrate existing data to the new organizational structure:
1. Choose an organization email for the legacy data
2. Create the organization directory structure using the controller
3. Copy the existing files to the new organization's directories
4. Update the encoding format if needed (legacy single encoding → multiple encodings)

### Example Migration
```bash
# Legacy data location
HORUS_backend/app/facerecognizer/
├── encodings/face_encodings.pkl
└── attendance_*.csv

# After migration to organization: legacy@company.com
HORUS_backend/app/facerecognizer/organizations/legacy_at_company_dot_com/
├── encodings/face_encodings.pkl
└── attendance/attendance_*.csv
```

## Example Workflow

1. **Organization Setup**: User enters email `construction@mycompany.com`
2. **Directory Creation**: System creates:
   ```
   organizations/construction_at_mycompany_dot_com/
   ├── encodings/
   └── attendance/
   ```
3. **Data Isolation**: All face registrations and attendance data stored in organization-specific directories
4. **Independent Operations**: Other organizations using different emails maintain completely separate data

## Development Guidelines

### Adding New Features
- All business logic should be added to `FaceRecognitionController`
- Route handlers should only handle HTTP concerns
- Maintain organization-based data isolation
- Follow existing error handling patterns

### Testing
- Test with multiple organizations
- Verify data isolation between organizations
- Test camera state management independently
- Validate file path sanitization

### Deployment Considerations
- Ensure proper directory permissions for organization folders
- Monitor disk space usage per organization
- Implement backup strategies for organization-specific data
- Consider data retention policies per organization
