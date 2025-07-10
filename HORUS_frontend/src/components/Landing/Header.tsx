import React, { useState } from 'react';
import SignupForm from '../SignupForm/SignupForm';
import SigninForm from '../SigninForm/SigninForm';
import AuthService from '../../services/AuthService2';
import logo from '../../assets/logo.png';


interface HeaderProps {
  isAuthenticated: boolean;
  onAuthStateChange: (isAuthenticated: boolean) => void;
}

const menus = ["About", "HowThisWorks", "Functionality", "ContactUs"];

const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  onAuthStateChange,
}) => {
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [showSigninForm, setShowSigninForm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOpenSignup = () => {
    setShowSigninForm(false); // Close signin form if open
    setShowSignupForm(true);
  };

  const handleCloseSignup = () => {
    setShowSignupForm(false);
  };

  const handleSignupSuccess = () => {
    setShowSignupForm(false);
    onAuthStateChange(AuthService.isAuthenticated());
    console.log("Signup was successful, user can now sign in.");
  };

  const handleOpenSignin = () => {
    setShowSignupForm(false); // Close signup form if open
    setShowSigninForm(true);
  };

  const handleCloseSignin = () => {
    setShowSigninForm(false);
  };

  const handleSigninSuccess = () => {
    setShowSigninForm(false);
    onAuthStateChange(AuthService.isAuthenticated());
    console.log("Signin was successful!");
  };

  const handleLogout = () => {
    AuthService.logout();
    onAuthStateChange(false);
    console.log('User logged out successfully');
  };

  return (
    <>
      <header className="w-full flex items-center justify-between px-4 lg:px-8 py-4 relative">
        <div className="flex-center">
          <img
            src={logo}
            alt="horus logo"
            className="w-48 h-auto sm:w-60 md:w-72 lg:w-80 object-contain"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex justify-center items-center xs:gap-2 sm:gap-2 gap-8 xl:gap-12">
          {menus.map((menu: string, i: number) => {
            return (
              <a
                key={i}
                href={`#${menu}`}
                className="uppercase text-sm xl:text-base text-black text-center px-3 py-1 rounded-2xl transition-all ease-linear hover:bg-blue-600 hover:shadow hover:text-white"
              >
                {menu}
              </a>
            );
          })}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex gap-3">
          {!isAuthenticated ? (
            <>
              <button
                onClick={handleOpenSignup}
                className="bg-gray-500 text-white px-3 py-2 text-sm xl:px-4 xl:py-3 xl:text-base rounded-md hover:bg-gray-700 transition"
              >
                SIGN UP
              </button>
              <button
                onClick={handleOpenSignin}
                className="bg-blue-600 text-white px-3 py-2 text-sm xl:px-4 xl:py-3 xl:text-baserounded-md hover:bg-blue-800 transition"
              >
                SIGN IN
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-2 text-sm xl:px-4 xl:py-3 xl:text-base sm:text-xs rounded-md hover:bg-red-800 transition"
            >
              LOGOUT
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden flex flex-col gap-1 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className={`w-6 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t z-50">
            <nav className="flex flex-col p-4">
              {menus.map((menu: string, i: number) => {
                return (
                  <a
                    key={i}
                    href={`#${menu}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="uppercase text-base text-black text-center py-3 border-b border-gray-200 last:border-b-0 hover:bg-blue-50 transition-colors"
                  >
                    {menu}
                  </a>
                );
              })}
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-200">
                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        handleOpenSignup();
                        setIsMobileMenuOpen(false);
                      }}
                      className="bg-gray-500 text-white py-3 rounded-md hover:bg-gray-700 transition"
                    >
                      SIGN UP
                    </button>
                    <button
                      onClick={() => {
                        handleOpenSignin();
                        setIsMobileMenuOpen(false);
                      }}
                      className="bg-blue-600 text-white py-3 rounded-md hover:bg-blue-800 transition"
                    >
                      SIGN IN
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-red-600 text-white py-3 rounded-md hover:bg-red-800 transition"
                  >
                    LOGOUT
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Conditionally render the SignupForm as an overlay */}
      {showSignupForm && (
        <SignupForm 
          onClose={handleCloseSignup} 
          onSignupSuccess={handleSignupSuccess} 
        />
      )}

      {/* Conditionally render the SigninForm as an overlay */}
      {showSigninForm && (
        <SigninForm 
          onClose={handleCloseSignin} 
          onSigninSuccess={handleSigninSuccess} 
        />
      )}
    </>
  );
};

export default Header;
