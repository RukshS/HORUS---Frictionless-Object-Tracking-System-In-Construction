import React from 'react';
import About from './About.tsx';
import Header from './Header.tsx';
import Footer from './Footer.tsx';
import Contact from './Contact.tsx';
import HowThisWorks from './HowThisWorks.tsx';
import Functionality from './Functionality.tsx';
import ChatBot from '../Chatbot/ChatBot.tsx';

interface LandingProps {
  isAuthenticated: boolean;
  onAuthStateChange: (isAuthenticated: boolean) => void;
}

const Landing: React.FC<LandingProps> = ({
  isAuthenticated,
  onAuthStateChange,
}) => {
  return (
    <div className="w-full min-h-screen">
      <Header 
        isAuthenticated={isAuthenticated}
        onAuthStateChange={onAuthStateChange}
      />
      <main className="w-full">
        <About />
        <HowThisWorks />
        <Functionality />
        <Contact />
      </main>
      <Footer />
      {/* ChatBot that hovers on top of everything */}
      <ChatBot />
    </div>
  );
};

export default Landing;
