import React, { useState, useEffect } from 'react';
import AuthService from '../../services/AuthService';
import UpdateForm from '../UpdateForm/UpdateForm';
import FaceRecognitionDashboard from '../FaceRecognition/FaceRecognitionDashboard';
import './UserDashboard.css';

interface UserProfile {
  email: string;
  admin_name: string;
  company_name: string;
  contact_no: string;
  location?: string;
}

interface UserDashboardProps {
  onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onLogout }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'face-recognition' | 'workforce-tracking' | 'asset-tracking'>('dashboard');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await AuthService.getUserProfile();
        setUserProfile(profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    onLogout();
  };

  // Handle opening update form
  const handleOpenUpdateForm = () => {
    setShowUpdateForm(true);
  };

  // Handle closing update form
  const handleCloseUpdateForm = () => {
    setShowUpdateForm(false);
  };

  // Handle successful update
  const handleUpdateSuccess = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    setShowUpdateForm(false);
  };

  // Toggle mobile sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when clicking outside on mobile
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <h2>Error Loading Profile</h2>
          <p>{error}</p>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <h2>No Profile Data</h2>
          <p>Unable to load your profile information.</p>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="logo-section">
          <div className="logo">
            <span className="logo-text">H</span>
            <span className="logo-icon">🦅</span>
            <span className="logo-text">rus</span>
          </div>
        </div>
        
        <nav className="nav-menu">
          <div 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </div>
          <div 
            className={`nav-item ${currentView === 'asset-tracking' ? 'active' : ''}`}
            onClick={() => setCurrentView('asset-tracking')}
          >
            <span className="nav-icon">📍</span>
            <span className="nav-text">Asset Tracking</span>
          </div>
          <div 
            className={`nav-item ${currentView === 'workforce-tracking' ? 'active' : ''}`}
            onClick={() => setCurrentView('workforce-tracking')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Work Force Safety</span>
          </div>
          <div 
            className={`nav-item ${currentView === 'face-recognition' ? 'active' : ''}`}
            onClick={() => setCurrentView('face-recognition')}
          >
            <span className="nav-icon">🎭</span>
            <span className="nav-text">Face Recognition</span>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={toggleSidebar} aria-label="Toggle menu">
            <span className={`hamburger ${isSidebarOpen ? 'hamburger-open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="content-wrapper">
          {currentView === 'dashboard' && (
            <div className="company-details-section">
              <div className="company-header">
                <h2><span className="company-text">Company</span> Details</h2>
              </div>

              <div className="company-content">
                <div className="profile-box company-info">
                  <div className="info-group">
                    <div className="info-item">
                      <label>Company name:</label>
                      <span>{userProfile.company_name}</span>
                    </div>
                    <div className="info-item">
                      <label>Admin:</label>
                      <span>{userProfile.admin_name}</span>
                    </div>
                    <div className="info-item">
                      <label>Location:</label>
                      <span>{userProfile.location || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Email:</label>
                      <span>{userProfile.email}</span>
                    </div>
                  </div>
                </div>

                <div className="company-avatar">
                  <div className="avatar-circle">
                    <span className="avatar-initials">
                      {userProfile.company_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="profile-box emergency-contact">
                  <h3>Emergency Contact Details :</h3>
                  <div className="contact-info">
                    <span>{userProfile.contact_no}</span>
                  </div>
                </div>
              </div>

              <div className="update-section">
                <button onClick={handleOpenUpdateForm} className="update-btn">Update</button>
              </div>
            </div>
          )}

          {currentView === 'face-recognition' && (
            <FaceRecognitionDashboard />
          )}

          {currentView === 'asset-tracking' && (
            <div className="coming-soon">
              <h2>Asset Tracking</h2>
              <p>This feature is coming soon!</p>
            </div>
          )}

          {currentView === 'workforce-tracking' && (
            <div className="coming-soon">
              <h2>Workforce Safety Tracking</h2>
              <p>This feature is coming soon!</p>
            </div>
          )}
        </div>

        {showUpdateForm && userProfile && (
          <UpdateForm
            onClose={handleCloseUpdateForm}
            onUpdateSuccess={handleUpdateSuccess}
            currentProfile={userProfile}
          />
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
