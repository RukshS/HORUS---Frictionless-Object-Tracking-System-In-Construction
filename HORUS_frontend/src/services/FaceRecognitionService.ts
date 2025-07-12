// Face Recognition Service for connecting to the backend API
import AuthService from './AuthService';

const API_BASE_URL = 'http://localhost:8000/api/face-recognition';

// JWT token utility functions
interface JWTPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

const decodeJWTPayload = (token: string): JWTPayload => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return {};
  }
};

const getCurrentUserEmail = (): string => {
  const token = AuthService.getToken();
  if (!token) {
    throw new Error('No authentication token found. Please login first.');
  }

  const payload = decodeJWTPayload(token);
  if (!payload || !payload.sub) {
    throw new Error('Invalid authentication token. Please login again.');
  }

  return payload.sub; // The email is stored in the 'sub' field
};

export interface RecognizedFace {
  user_id: string | null;
  name: string;
  type: string | null;
  confidence: number;
  location: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface RecognitionResult {
  faces_detected: number;
  recognized_faces: RecognizedFace[];
  organization: string;
  timestamp: string;
}

export interface RegisteredUser {
  user_id: string;
  name: string;
  type: string;
  encodings_count: number;
}

export interface AttendanceRecord {
  name: string;
  type: string;
  timestamp: string;
}

export interface RegistrationResponse {
  message: string;
  user_id: string;
  name: string;
  type: string;
  organization: string;
}

export interface AttendanceResponse {
  message: string;
  user_id: string;
  name?: string;
  type?: string;
  organization: string;
  timestamp?: string;
  already_marked?: boolean;
}

export interface DeleteResponse {
  message: string;
  user_id: string;
  organization: string;
}

export interface AttendanceData {
  date: string;
  total_attendance: number;
  records: AttendanceRecord[];
  organization: string;
}

const FaceRecognitionService = {
  // Register a new face
  registerFace: async (name: string, employeeType: string, imageFile: File): Promise<RegistrationResponse> => {
    const org_email = getCurrentUserEmail();

    const formData = new FormData();
    formData.append('file', imageFile);

    const params = new URLSearchParams({
      org_email,
      name: name,
      employee_type: employeeType
    });

    const response = await fetch(`${API_BASE_URL}/register-face?${params}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(errorData.detail || 'Registration failed');
    }

    return response.json();
  },

  // Recognize faces in an image
  recognizeFace: async (imageFile: File): Promise<RecognitionResult> => {
    const org_email = getCurrentUserEmail();

    const formData = new FormData();
    formData.append('file', imageFile);

    const params = new URLSearchParams({
      org_email
    });

    const response = await fetch(`${API_BASE_URL}/recognize-face?${params}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Recognition failed' }));
      throw new Error(errorData.detail || 'Recognition failed');
    }

    return response.json();
  },

  // Mark attendance for a user
  markAttendance: async (userId: string): Promise<AttendanceResponse> => {
    const org_email = getCurrentUserEmail();

    const params = new URLSearchParams({
      org_email,
      user_id: userId
    });

    const response = await fetch(`${API_BASE_URL}/mark-attendance?${params}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to mark attendance' }));
      throw new Error(errorData.detail || 'Failed to mark attendance');
    }

    return response.json();
  },

  // Get all registered users
  getRegisteredUsers: async (): Promise<{ total_users: number; users: RegisteredUser[]; organization: string }> => {
    const org_email = getCurrentUserEmail();

    const params = new URLSearchParams({
      org_email
    });

    const response = await fetch(`${API_BASE_URL}/registered-users?${params}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch users' }));
      throw new Error(errorData.detail || 'Failed to fetch users');
    }

    return response.json();
  },

  // Get attendance for a specific date
  getAttendance: async (date?: string): Promise<AttendanceData> => {
    const org_email = getCurrentUserEmail();

    const params = new URLSearchParams({
      org_email
    });

    const url = date 
      ? `${API_BASE_URL}/attendance/${date}?${params}` 
      : `${API_BASE_URL}/attendance?${params}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch attendance' }));
      throw new Error(errorData.detail || 'Failed to fetch attendance');
    }

    return response.json();
  },

  // Delete a registered user
  deleteUser: async (userId: string): Promise<DeleteResponse> => {
    const org_email = getCurrentUserEmail();

    const params = new URLSearchParams({
      org_email
    });

    const response = await fetch(`${API_BASE_URL}/user/${userId}?${params}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to delete user' }));
      throw new Error(errorData.detail || 'Failed to delete user');
    }

    return response.json();
  },

  // Helper function to capture image from webcam
  captureImageFromVideo: (videoElement: HTMLVideoElement): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      }
    });
  },

  // Helper function to get webcam stream
  getWebcamStream: async (): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: false 
      });
    } catch {
      throw new Error('Failed to access webcam. Please ensure you have given camera permissions.');
    }
  },

  // Stop webcam stream
  stopWebcamStream: (stream: MediaStream): void => {
    stream.getTracks().forEach(track => track.stop());
  }
};

// Export utility function
export const getOrganizationEmail = getCurrentUserEmail;

export default FaceRecognitionService;
