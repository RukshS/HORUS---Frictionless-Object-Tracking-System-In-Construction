import React, { useState } from 'react';
import './SigninForm.css';
import AuthService from '../../services/AuthService2'; // Import AuthService

interface SigninFormProps {
  onClose: () => void;
  onSigninSuccess: () => void; // Callback for successful signin
}

interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

const SigninForm: React.FC<SigninFormProps> = ({ onClose, onSigninSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Validate a specific field and update the errors state
  const validateField = (field: keyof ValidationErrors, value: string) => {
    let errorMessage: string | undefined;
    
    switch (field) {
      case 'email':
        if (!value.trim()) {
          errorMessage = 'Email is required';
        } else if (!validateEmail(value)) {
          errorMessage = 'Please enter a valid email address';
        }
        break;
        
      case 'password':
        if (!value) {
          errorMessage = 'Password is required';
        } else if (value.length < 8) {
          errorMessage = 'Password must be at least 8 characters';
        }
        break;
    }
    
    setErrors(prev => ({ 
      ...prev, 
      [field]: errorMessage 
    }));
    
    return !errorMessage; // Return true if valid
  };

  const validateForm = (): boolean => {
    const isEmailValid = validateField('email', email);
    const isPasswordValid = validateField('password', password);
    
    return isEmailValid && isPasswordValid;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // AuthService.signin handles token storage in localStorage as 'jwtToken'
      const response = await AuthService.signin(email, password); 

      // Check if the response and token exist
      if (response && response.token) {
        onSigninSuccess();
        onClose();
      } else {
        // This case handles a successful call to AuthService.signin that doesn't return a token
        // or returns an unexpected response structure.
        console.warn('Signin successful, but no token was received or response format was unexpected.', response);
        setErrors({ general: 'Signin processed, but no token was received.' });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ 
          general: err.message || 'Signin failed. Please check your credentials.' 
        });
      } else {
        setErrors({ general: 'An unknown error occurred during signin.' });
      }
      console.error('Signin error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-overlay">
      <div className="signin-form-container">
        <button className="close-button" onClick={onClose} disabled={isLoading}>X</button>
        <h2>Sign In</h2>
        <form onSubmit={handleSubmit}>
          {errors.general && <p className="error-message">{errors.general}</p>}
          <div className="form-row">
            <div className="form-group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateField('email', email)}
                required
                placeholder=" " 
                disabled={isLoading}
                className={errors.email ? 'has-error' : ''}
              />
              <label htmlFor="email">Email</label>
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => validateField('password', password)}
                required
                placeholder=" " 
                disabled={isLoading}
                className={errors.password ? 'has-error' : ''}
              />
              <label htmlFor="password">Password</label>
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>
          </div>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SigninForm;
