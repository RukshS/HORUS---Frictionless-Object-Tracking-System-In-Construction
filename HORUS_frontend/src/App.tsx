import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import './App.css';

import Landing from './components/Landing/Landing';
import UserDashboard from './components/Dashboard/UserDashboard';
import LiveDetectionPage from './components/LiveDetectionPage/LiveDetectionPage';
import AuthService from './services/AuthService2';
import ChatBot from './components/Chatbot/ChatBot';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());

  const handleAuthStateChange = (authState: boolean) => {
    setIsAuthenticated(authState);
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    console.log('User logged out successfully');
  };

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Landing
                isAuthenticated={isAuthenticated}
                onAuthStateChange={handleAuthStateChange}
              />
            )
          }
        />

        {/* Dashboard (protected) */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <UserDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Live detection page (unprotected) */}
        <Route
         path="/live-detection" 
         element={<LiveDetectionPage />} />

         
      </Routes>
    </Router>
      )}
      
      {/* ChatBot component that hovers on top of everything */}
      <ChatBot />
    </>
  );
}

export default App;
