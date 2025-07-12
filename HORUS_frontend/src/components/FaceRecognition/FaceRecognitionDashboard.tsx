import React, { useState, useRef, useEffect } from 'react';
import { Camera, Users, Eye, UserPlus, Calendar, Trash2, CheckCircle } from 'lucide-react';
import FaceRecognitionService, { 
  type RecognitionResult, 
  type RegisteredUser, 
  type AttendanceData,
  getOrganizationEmail
} from '../../services/FaceRecognitionService';

interface FaceRecognitionDashboardProps {
  onClose?: () => void;
}

const FaceRecognitionDashboard: React.FC<FaceRecognitionDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'recognize' | 'users' | 'attendance'>('recognize');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Registration state
  const [registerName, setRegisterName] = useState('');
  const [registerType, setRegisterType] = useState('employee');
  const [registerFile, setRegisterFile] = useState<File | null>(null);
  
  // Recognition state
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  
  // Separate webcam states for each tab
  const [isRegisterCameraActive, setIsRegisterCameraActive] = useState(false);
  const [isRecognizeCameraActive, setIsRecognizeCameraActive] = useState(false);
  const [registerStream, setRegisterStream] = useState<MediaStream | null>(null);
  const [recognizeStream, setRecognizeStream] = useState<MediaStream | null>(null);
  const registerVideoRef = useRef<HTMLVideoElement>(null);
  const recognizeVideoRef = useRef<HTMLVideoElement>(null);
  
  // Simple capture state for recognize tab
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
  
  // Users and attendance state
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Check authentication on component mount
  useEffect(() => {
    try {
      getOrganizationEmail(); // This will throw an error if not authenticated
    } catch {
      setMessage({ type: 'error', text: 'Please login to access face recognition features.' });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (registerStream) {
        FaceRecognitionService.stopWebcamStream(registerStream);
      }
      if (recognizeStream) {
        FaceRecognitionService.stopWebcamStream(recognizeStream);
      }
    };
  }, [registerStream, recognizeStream]);

  // Auto-clear messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
  };

  // Start webcam for register tab
  const startRegisterCamera = async () => {
    try {
      const mediaStream = await FaceRecognitionService.getWebcamStream();
      setRegisterStream(mediaStream);
      if (registerVideoRef.current) {
        registerVideoRef.current.srcObject = mediaStream;
        setIsRegisterCameraActive(true);
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to start camera');
    }
  };

  // Start webcam for recognize tab
  const startRecognizeCamera = async () => {
    try {
      // Clear attendance status when starting new recognition
      setAttendanceStatus(null);
      
      const mediaStream = await FaceRecognitionService.getWebcamStream();
      setRecognizeStream(mediaStream);
      if (recognizeVideoRef.current) {
        recognizeVideoRef.current.srcObject = mediaStream;
        setIsRecognizeCameraActive(true);
        
        // Automatically perform capture after video loads
        recognizeVideoRef.current.onloadedmetadata = () => {
          performAutomaticCapture();
        };
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to start camera');
    }
  };

  // Stop register camera
  const stopRegisterCamera = React.useCallback(() => {
    if (registerStream) {
      registerStream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      FaceRecognitionService.stopWebcamStream(registerStream);
      setRegisterStream(null);
    }
    
    if (registerVideoRef.current) {
      registerVideoRef.current.srcObject = null;
    }
    
    setIsRegisterCameraActive(false);
  }, [registerStream]);

  // Stop recognize camera
  const stopRecognizeCamera = React.useCallback(() => {
    setIsStopping(true);
    
    if (recognizeStream) {
      recognizeStream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      FaceRecognitionService.stopWebcamStream(recognizeStream);
      setRecognizeStream(null);
    }
    
    if (recognizeVideoRef.current) {
      recognizeVideoRef.current.srcObject = null;
    }
    
    setIsRecognizeCameraActive(false);
    setIsProcessing(false);
    setIsStopping(false);
  }, [recognizeStream]);

  // Capture image from webcam
  const captureImage = async () => {
    const videoElement = activeTab === 'register' ? registerVideoRef.current : recognizeVideoRef.current;
    if (!videoElement) return;
    
    try {
      const file = await FaceRecognitionService.captureImageFromVideo(videoElement);
      if (activeTab === 'register') {
        setRegisterFile(file);
        showMessage('success', 'Image captured for registration');
      } else if (activeTab === 'recognize') {
        // Immediately perform recognition on captured image
        setIsLoading(true);
        try {
          const result = await FaceRecognitionService.recognizeFace(file);
          setRecognitionResult(result);
          
          // Auto-mark attendance for recognized faces
          if (result.faces_detected > 0 && result.recognized_faces.length > 0) {
            const recognizedFace = result.recognized_faces[0];
            if (recognizedFace.name !== 'Unknown' && recognizedFace.user_id) {
              try {
                const attendanceResult = await FaceRecognitionService.markAttendance(recognizedFace.user_id);
                
                if (attendanceResult.already_marked) {
                  setAttendanceStatus(`Welcome back ${recognizedFace.name}! Your attendance was already marked for today.`);
                } else {
                  setAttendanceStatus(`Welcome ${recognizedFace.name}! Attendance marked successfully.`);
                }
              } catch (error) {
                setAttendanceStatus(`Recognition successful but failed to mark attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            } else {
              setAttendanceStatus(`Found ${result.faces_detected} face(s) - Face detected but not recognized.`);
            }
          } else {
            setAttendanceStatus(`Found ${result.faces_detected} face(s) - No faces detected.`);
          }
        } catch (error) {
          showMessage('error', error instanceof Error ? error.message : 'Recognition failed');
        } finally {
          setIsLoading(false);
        }
      }
    } catch {
      showMessage('error', 'Failed to capture image');
    }
  };

  // Register face
  const handleRegisterFace = async () => {
    if (!registerName.trim() || !registerFile) {
      showMessage('error', 'Please provide name and capture an image using the camera');
      return;
    }

    setIsLoading(true);
    try {
      const result = await FaceRecognitionService.registerFace(registerName, registerType, registerFile);
      showMessage('success', result.message);
      setRegisterName('');
      setRegisterFile(null);
      if (activeTab === 'users') {
        fetchRegisteredUsers();
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch registered users
  const fetchRegisteredUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await FaceRecognitionService.getRegisteredUsers();
      setRegisteredUsers(result.users);
    } catch {
      showMessage('error', 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch attendance
  const fetchAttendance = React.useCallback(async (date?: string) => {
    setIsLoading(true);
    try {
      const result = await FaceRecognitionService.getAttendance(date);
      setAttendanceData(result);
    } catch {
      showMessage('error', 'Failed to fetch attendance');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setIsLoading(true);
    try {
      const result = await FaceRecognitionService.deleteUser(userId);
      showMessage('success', result.message);
      fetchRegisteredUsers();
    } catch {
      showMessage('error', 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    // Clear attendance status when switching away from recognize tab
    if (activeTab !== 'recognize') {
      setAttendanceStatus(null);
    }
    
    // Stop cameras when switching tabs to prevent conflicts
    if (activeTab !== 'register' && isRegisterCameraActive) {
      stopRegisterCamera();
    }
    if (activeTab !== 'recognize' && isRecognizeCameraActive) {
      stopRecognizeCamera();
    }
    
    if (activeTab === 'users') {
      fetchRegisteredUsers();
    } else if (activeTab === 'attendance') {
      fetchAttendance(selectedDate);
    }
  }, [activeTab, selectedDate, fetchRegisteredUsers, fetchAttendance, isRegisterCameraActive, isRecognizeCameraActive, stopRegisterCamera, stopRecognizeCamera]);

  // Simple automatic capture for recognize tab
  const performAutomaticCapture = async () => {
    if (!recognizeVideoRef.current || activeTab !== 'recognize') return;
    
    setIsProcessing(true);
    setAttendanceStatus('Capturing image and recognizing faces...');
    
    try {
      // Wait a moment for video to stabilize
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const file = await FaceRecognitionService.captureImageFromVideo(recognizeVideoRef.current);
      
      // Perform recognition
      const result = await FaceRecognitionService.recognizeFace(file);
      setRecognitionResult(result);
      
      // Auto-mark attendance for recognized faces
      if (result.faces_detected > 0 && result.recognized_faces.length > 0) {
        const recognizedFace = result.recognized_faces[0];
        if (recognizedFace.name !== 'Unknown' && recognizedFace.user_id) {
          try {
            const attendanceResult = await FaceRecognitionService.markAttendance(recognizedFace.user_id);
            
            if (attendanceResult.already_marked) {
              setAttendanceStatus(`Welcome back ${recognizedFace.name}! Your attendance was already marked for today.`);
            } else {
              setAttendanceStatus(`Welcome ${recognizedFace.name}! Attendance marked successfully.`);
            }              } catch (error) {
                setAttendanceStatus(`Recognition successful but failed to mark attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
        } else {
          setAttendanceStatus('Face detected but not recognized. Please register this person first.');
        }
      } else {
        setAttendanceStatus('No faces detected in the image.');
      }
      
    } catch (error) {
      setAttendanceStatus(`Failed to capture and recognize: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      // Always stop camera after processing - regardless of success or failure
      console.log('Auto-stopping camera in 2 seconds...');
      setIsStopping(true);
      setTimeout(() => {
        console.log('Stopping camera now...');
        stopRecognizeCamera();
      }, 2000); // Give user 2 seconds to see the result
    }
  };

  // Load data when component mounts
  useEffect(() => {
    if (activeTab === 'users') {
      fetchRegisteredUsers();
    } else if (activeTab === 'attendance') {
      fetchAttendance(selectedDate);
    }
  }, [fetchRegisteredUsers, fetchAttendance, activeTab, selectedDate]);

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-800">Face Recognition System</h1>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' :
              message.type === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Attendance Status for Recognize Tab */}
          {activeTab === 'recognize' && attendanceStatus && (
            <div className={`p-4 rounded-lg mb-6 ${
              attendanceStatus.includes('Attendance marked successfully') ? 'bg-green-100 text-green-800' :
              attendanceStatus.includes('already marked for today') ? 'bg-yellow-100 text-yellow-800' :
              attendanceStatus.includes('not recognized') || attendanceStatus.includes('No faces detected') ? 'bg-orange-100 text-orange-800' :
              attendanceStatus.includes('failed to mark attendance') ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {attendanceStatus}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex border-b overflow-x-auto">
            {[
              { id: 'recognize', label: 'Recognize Faces', icon: Eye },
              { id: 'register', label: 'Register Face', icon: UserPlus },
              { id: 'users', label: 'Registered Users', icon: Users },
              { id: 'attendance', label: 'Attendance', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'register' | 'recognize' | 'users' | 'attendance')}
                className={`flex items-center px-6 py-4 font-medium ${
                  activeTab === id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="mr-2" size={20} />
                {label}
              </button>
            ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md p-6 flex-1 overflow-y-auto">
            {/* Webcam Section */}
            {(activeTab === 'recognize' || activeTab === 'register') && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Camera</h3>
                <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {/* Register Tab Camera */}
                  {activeTab === 'register' && (
                    <>
                      <video
                        ref={registerVideoRef}
                        autoPlay
                        playsInline
                        className="w-96 h-72 bg-gray-200 rounded-lg"
                        style={{ display: isRegisterCameraActive ? 'block' : 'none' }}
                      />
                      {!isRegisterCameraActive && (
                        <div className="w-96 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Camera size={48} className="text-gray-400" />
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Recognize Tab Camera */}
                  {activeTab === 'recognize' && (
                    <>
                      <video
                        ref={recognizeVideoRef}
                        autoPlay
                        playsInline
                        className="w-96 h-72 bg-gray-200 rounded-lg"
                        style={{ display: (isRecognizeCameraActive && !isStopping) ? 'block' : 'none' }}
                      />
                      {(!isRecognizeCameraActive || isStopping) && (
                        <div className="w-96 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Camera size={48} className="text-gray-400" />
                        </div>
                      )}
                      {/* Processing status indicator for recognize tab */}
                      {isRecognizeCameraActive && (
                        <div className="absolute top-2 right-2 z-10">
                          {isProcessing ? (
                            <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center">
                              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                              Processing...
                            </div>
                          ) : isStopping ? (
                            <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs flex items-center">
                              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                              Stopping...
                            </div>
                          ) : (
                            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                              Camera Active
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex space-x-4">
                  {/* Register Tab Controls */}
                  {activeTab === 'register' && (
                    <>
                      {!isRegisterCameraActive ? (
                        <button
                          onClick={startRegisterCamera}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          Start Camera
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={captureImage}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            Capture
                          </button>
                          <button
                            onClick={stopRegisterCamera}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            Stop Camera
                          </button>
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Recognize Tab Controls */}
                  {activeTab === 'recognize' && (
                    <>
                      {!isRecognizeCameraActive ? (
                        <button
                          onClick={startRecognizeCamera}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                        >
                          Start Recognition
                        </button>
                      ) : (
                        <button
                          onClick={stopRecognizeCamera}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400"
                        >
                          Stop Camera
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Register Tab */}
          {activeTab === 'register' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Register New Face</h2>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Use the camera above to capture a photo for face registration. Make sure the person's face is clearly visible and well-lit.
                </p>
                {!isRegisterCameraActive && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 text-sm">
                      📹 Start the camera above to capture a photo for registration. Position the face clearly in the camera view and click "Capture".
                    </p>
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={registerType}
                      onChange={(e) => setRegisterType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="contractor">Contractor</option>
                      <option value="visitor">Visitor</option>
                    </select>
                  </div>
                  <button
                    onClick={handleRegisterFace}
                    disabled={isLoading || !registerName.trim() || !registerFile}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {isLoading ? 'Registering...' : 'Register Face'}
                  </button>
                  {!registerFile && (
                    <p className="text-sm text-gray-500 mt-2">
                      📷 Capture a photo using the camera above first
                    </p>
                  )}
                </div>
                <div>
                  {registerFile && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                      <img
                        src={URL.createObjectURL(registerFile)}
                        alt="Preview"
                        className="w-full max-w-sm rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recognize Tab */}
          {activeTab === 'recognize' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Face Recognition</h2>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Click "Start Recognition" to automatically capture an image, recognize faces, mark attendance, and stop the camera. One-click operation for quick and easy attendance marking.
                </p>
                {!isRecognizeCameraActive && !isProcessing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 text-sm">
                      � Click "Start Recognition" for automatic operation: Camera starts → Image captured → Face recognized → Attendance marked → Camera stops
                    </p>
                  </div>
                )}
                {isProcessing && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-700 text-sm">
                      ⏳ Processing: Capturing image and recognizing faces... Please wait while attendance is being marked.
                    </p>
                  </div>
                )}
              </div>

              {/* Recognition Results */}
              {recognitionResult && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Recognition Results</h3>
                  <div className="space-y-4">
                    {recognitionResult.recognized_faces.map((face, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Name: {face.name}</p>
                            <p className="text-sm text-gray-600">Type: {face.type || 'Unknown'}</p>
                            <p className="text-sm text-gray-600">
                              Confidence: {(face.confidence * 100).toFixed(1)}%
                            </p>
                            {face.user_id && face.name !== 'Unknown' && (
                              <p className="text-sm text-green-600 font-medium mt-1">
                                ✓ Attendance marked automatically
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="h-full flex flex-col">
              <h2 className="text-2xl font-bold mb-6">Registered Users ({registeredUsers.length})</h2>
              <div className="grid gap-4 overflow-y-auto flex-1 max-h-96">
                {registeredUsers.map((user) => (
                  <div key={user.user_id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">Type: {user.type}</p>
                      <p className="text-sm text-gray-600">ID: {user.user_id}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(user.user_id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {registeredUsers.length === 0 && !isLoading && (
                  <p className="text-gray-500 text-center py-8">No registered users found</p>
                )}
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="h-full flex flex-col">
              <h2 className="text-2xl font-bold mb-6">Attendance Records</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {attendanceData && (
                <div className="flex-1 overflow-y-auto max-h-96">
                  <div className="mb-4">
                    <p className="text-lg font-medium">
                      Total Attendance: {attendanceData.total_attendance}
                    </p>
                    <p className="text-sm text-gray-600">Date: {attendanceData.date}</p>
                  </div>
                  
                  <div className="space-y-2">
                    {attendanceData.records.map((record, index) => (
                      <div key={index} className="border rounded-lg p-3 flex items-center">
                        <CheckCircle className="text-green-500 mr-3" size={20} />
                        <div>
                          <p className="font-medium">{record.name}</p>
                          <p className="text-sm text-gray-600">
                            {record.type} • {record.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                    {attendanceData.records.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No attendance records for this date</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRecognitionDashboard;
