import { useState } from 'react';
import './App.css';
import Landing from './components/Landing/Landing'; // Import the LandingPage
import UserDashboard from './components/Dashboard/UserDashboard'; // Import the UserDashboard
import ChatBot from './components/Chatbot/ChatBot'; // Import the ChatBot
import AuthService from './services/AuthService2'; // Import AuthService

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
    <>
      {/* Show Dashboard if user is authenticated */}
      {isAuthenticated ? (
        <UserDashboard onLogout={handleLogout} />
      ) : (
        <Landing 
          isAuthenticated={isAuthenticated}
          onAuthStateChange={handleAuthStateChange}
        />
      )}
      
      {/* ChatBot component that hovers on top of everything */}
      <ChatBot />
    </>
  );
}

export default App;
