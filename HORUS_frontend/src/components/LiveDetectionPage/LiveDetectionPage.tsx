import { useState, useEffect } from "react";
import "./LiveDetectionPage.css";

interface Violation {
  id: string;
  timestamp: string;
  camera_id: number | string;
  person_name: string;
  violation_type: string;
  class_name: string;
}

const LiveDetectionPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch violations on component mount and then every 10 seconds
  useEffect(() => {
    fetchViolations();
    const violationInterval = setInterval(fetchViolations, 10000); // Refresh every 10 seconds
    return () => clearInterval(violationInterval);
  }, []);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/violations/recent?limit=20');
      const data = await response.json();
      
      if (data.violations) {
        setViolations(data.violations);
      }
    } catch (error) {
      console.error('Error fetching violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formattedTime = currentTime.toLocaleString();

  const openCameraModal = (cameraId: number) => {
    setSelectedCamera(cameraId);
  };

  const closeCameraModal = () => {
    setSelectedCamera(null);
  };

  const getCameraFeedUrl = (cameraId: number) => {
    return `http://localhost:8000/api/video_feed${cameraId}`;
  };

  return (
    <div className="live-main">
      <h1 className="live-title">
        <span className="blue-text">Work Force</span> Tracking
      </h1>

      <div className="video-wrapper">
        <div className="video-box" onClick={() => openCameraModal(1)}>
          <img src="http://localhost:8000/api/video_feed1" alt="Camera 1" />
          <p>Camera 1 — {formattedTime}</p>
        </div>
        <div className="video-box" onClick={() => openCameraModal(2)}>
          <img src="http://localhost:8000/api/video_feed2" alt="Camera 2" />
          <p>Camera 2 — {formattedTime}</p>
        </div>
        <div className="video-box" onClick={() => openCameraModal(3)}>
          <img src="http://localhost:8000/api/video_feed3" alt="Camera 3" />
          <p>Camera 3 — {formattedTime}</p>
        </div>
      </div>
      
      <div className="log-box">
        <div className="log-header">
          <h2>
            Violation Logs 
            <span className="violation-count">({violations.length})</span>
            {loading && <span className="loading-spinner"></span>}
          </h2>
          <button 
            className="refresh-button" 
            onClick={fetchViolations}
            disabled={loading}
          >
            🔄
          </button>
        </div>
        {violations.length === 0 ? (
          <div className="log-entry">
            <span style={{color: '#6b7280'}}>No recent violations detected</span>
          </div>
        ) : (
          violations.map((violation) => (
            <div key={violation.id} className="log-entry">
              <strong className={`violation-type-${violation.class_name.includes('helmet') ? 'helmet' : 'vest'}`}>
                {violation.violation_type}:
              </strong> <span className="person-name">{violation.person_name}</span><br />
              <span className="timestamp">
                {new Date(violation.timestamp).toLocaleString()} | Camera {violation.camera_id}
              </span>
            </div>
          ))
        )}
      </div> <br></br>

      <div className="report-button">
        <button>Generate Report</button>
      </div>

      {/* Camera Modal */}
      {selectedCamera && (
        <div className="modal-overlay" onClick={closeCameraModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Camera {selectedCamera} - Live Detection</h2>
              <button className="close-button" onClick={closeCameraModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <img 
                src={getCameraFeedUrl(selectedCamera)} 
                alt={`Camera ${selectedCamera}`}
                className="modal-video"
              />
              <div className="modal-info">
                <p><strong>Camera ID:</strong> {selectedCamera}</p>
                <p><strong>Status:</strong> Active</p>
                <p><strong>Last Update:</strong> {formattedTime}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDetectionPage;
