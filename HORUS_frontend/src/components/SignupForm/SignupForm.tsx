import React, { useState } from 'react';
import './SignupForm.css';
import AuthService from '../../services/AuthService2'; // Import AuthService

interface SignupFormProps {
  onClose: () => void;
  onSignupSuccess: () => void; // Callback for successful signup
}

interface ValidationErrors {
  adminName?: string;
  companyName?: string;
  email?: string;
  contactNo?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  general?: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ onClose, onSignupSuccess }) => {
  const [adminName, setAdminName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return passwordRegex.test(password);
  };
  const validateContactNo = (contactNo: string) => {
    // First, remove all non-digit characters except + at the beginning
    const cleanedNumber = contactNo.replace(/(?!^\+)\D/g, '');
    
    // Check if the number has at least 10 digits (international standard)
    if (cleanedNumber.length < 10) {
      return false;
    }
    
    // Check for valid format - allow + at beginning, followed by digits
    // This regex matches formats like: +1234567890, 1234567890, +91 98765 43210 (spaces removed in cleaning)
    const phoneRegex = /^(\+\d{1,3})?(\d{10,15})$/;
    return phoneRegex.test(cleanedNumber);
  };
    // Function to format phone number as user types
  const formatPhoneNumber = (input: string) => {
    // Allow only digits, +, spaces, and hyphens
    const cleaned = input.replace(/[^\d\s\-+]/g, '');
    
    // Don't allow multiple + symbols
    const plusCount = (cleaned.match(/\+/g) || []).length;
    if (plusCount > 1) {
      return contactNo; // Return previous value if multiple + detected
    }
    
    // Ensure + is only at the beginning if present
    if (cleaned.indexOf('+') > 0) {
      return contactNo; // Return previous value if + is not at beginning
    }
    
    // Remove all spaces for processing
    const digitsOnly = cleaned.replace(/\s/g, '');
    
    // Format the phone number with proper spacing for better readability
    let formatted = '';
    
    if (digitsOnly.startsWith('+')) {
      // International format: +XX XXX XXXX...
      formatted = '+';
      
      // Add country code (after the +)
      if (digitsOnly.length > 1) {
        const countryCodeLen = Math.min(3, digitsOnly.length - 1);
        formatted += digitsOnly.substring(1, 1 + countryCodeLen);
        
        // Add space after country code
        if (digitsOnly.length > 1 + countryCodeLen) {
          formatted += ' ';
          
          // Get remaining digits after country code
          const remaining = digitsOnly.substring(1 + countryCodeLen);
          
          // Group remaining digits in chunks of 4
          for (let i = 0; i < remaining.length; i += 4) {
            formatted += remaining.substring(i, i + 4);
            if (i + 4 < remaining.length) {
              formatted += ' ';
            }
          }
        }
      }
    } else {
      // Local format without country code: XXXX XXXX XXXX
      for (let i = 0; i < digitsOnly.length; i += 4) {
        if (i > 0) {
          formatted += ' ';
        }
        formatted += digitsOnly.substring(i, i + 4);
      }
    }
    
    return formatted;
  };

  // Mark a field as touched when user interacts with it
  const handleBlur = (field: keyof ValidationErrors) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
  };

  // Validate a specific field and update errors state
  const validateField = (field: keyof ValidationErrors) => {
    let isValid = true;
    let errorMessage: string | undefined;

    switch (field) {
      case 'adminName':
        if (!adminName.trim()) {
          errorMessage = 'Admin name is required';
          isValid = false;
        } else if (adminName.trim().length < 2) {
          errorMessage = 'Admin name must be at least 2 characters';
          isValid = false;
        }
        break;

      case 'companyName':
        if (!companyName.trim()) {
          errorMessage = 'Company name is required';
          isValid = false;
        } else if (companyName.trim().length < 2) {
          errorMessage = 'Company name must be at least 2 characters';
          isValid = false;
        }
        break;

      case 'email':
        if (!email.trim()) {
          errorMessage = 'Email is required';
          isValid = false;
        } else if (!validateEmail(email)) {
          errorMessage = 'Please enter a valid email address';
          isValid = false;
        }
        break;

      case 'contactNo':
        if (!contactNo.trim()) {
          errorMessage = 'Contact number is required';
          isValid = false;
        } else if (!validateContactNo(contactNo)) {
          const cleanedNumber = contactNo.replace(/(?!^\+)\D/g, '');
          if (cleanedNumber.length < 10) {
            errorMessage = `Phone number too short (${cleanedNumber.length}/10 digits minimum)`;
          } else if (cleanedNumber.length > 15) {
            errorMessage = 'Phone number too long (max 15 digits)';
          } else {
            errorMessage = 'Please enter a valid phone number (e.g., +XX XXXX XXXX)';
          }
          isValid = false;
        }
        break;

      case 'password':
        if (!password) {
          errorMessage = 'Password is required';
          isValid = false;
        } else if (!validatePassword(password)) {
          errorMessage = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number';
          isValid = false;
        }

        // Also validate confirmPassword if it's been touched
        if (touched.confirmPassword && confirmPassword) {
          validateField('confirmPassword');
        }
        break;

      case 'confirmPassword':
        if (!confirmPassword) {
          errorMessage = 'Please confirm your password';
          isValid = false;
        } else if (password !== confirmPassword) {
          errorMessage = 'Passwords do not match';
          isValid = false;
        }
        break;

      case 'agreeToTerms':
        if (!agreeToTerms) {
          errorMessage = 'You must agree to the terms and conditions';
          isValid = false;
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: errorMessage }));
    return isValid;
  };

  const validateForm = (): boolean => {
    const fields: (keyof ValidationErrors)[] = [
      'adminName', 'companyName', 'email', 'contactNo', 
      'password', 'confirmPassword', 'agreeToTerms'
    ];

    const validationResults = fields.map(field => validateField(field));
    return validationResults.every(isValid => isValid);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.signup(adminName, companyName, email, contactNo, password);
      onSignupSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ general: err.message || 'Signup failed. Please try again.' });
      } else {
        setErrors({ general: 'An unknown error occurred during signup.' });
      }
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-overlay">
      <div className="signup-form-container">
        <button className="close-button" onClick={onClose} disabled={isLoading}>X</button>
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          {errors.general && <p className="error-message">{errors.general}</p>}
          <div className="form-row">
            <div className="form-group">              <input
                type="text"
                id="adminName"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                onBlur={() => handleBlur('adminName')}
                required
                placeholder=" " 
                disabled={isLoading}
                className={errors.adminName ? 'has-error' : ''}
              />
              <label htmlFor="adminName">Admin Name</label>
              {errors.adminName && <div className="field-error">{errors.adminName}</div>}
            </div>
            <div className="form-group">              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={() => handleBlur('companyName')}
                required
                placeholder=" " 
                disabled={isLoading}
                className={errors.companyName ? 'has-error' : ''}
              />
              <label htmlFor="companyName">Company Name</label>
              {errors.companyName && <div className="field-error">{errors.companyName}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                required
                placeholder=" " 
                disabled={isLoading}
                className={errors.email ? 'has-error' : ''}
              />
              <label htmlFor="email">Email</label>
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <div className="form-group">              <input
                type="tel"
                id="contactNo"
                value={contactNo}
                onChange={(e) => {
                  const formattedNumber = formatPhoneNumber(e.target.value);
                  setContactNo(formattedNumber);
                }}
                onBlur={() => handleBlur('contactNo')}
                required
                placeholder=" " 
                disabled={isLoading}
                className={errors.contactNo ? 'has-error' : ''}
              />
              <label htmlFor="contactNo">Contact No</label>
              {errors.contactNo && <div className="field-error">{errors.contactNo}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                required
                placeholder=" " 
                disabled={isLoading}
                className={errors.password ? 'has-error' : ''}
              />
              <label htmlFor="password">Password</label>
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>
            <div className="form-group">              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                required
                placeholder=" "
                disabled={isLoading}
                className={errors.confirmPassword ? 'has-error' : ''}
              />
              <label htmlFor="confirmPassword">Re-Enter Password</label>
              {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
            </div>
          </div>          <div className="form-group-checkbox">
            <div className="checkbox-wrapper">              <input
                type="checkbox"
                id="agreeToTerms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                onBlur={() => handleBlur('agreeToTerms')}
                required
                disabled={isLoading}
              />
              <label htmlFor="agreeToTerms">Agree with the terms and conditions</label>
            </div>
            {errors.agreeToTerms && <div className="field-error">{errors.agreeToTerms}</div>}
          </div>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
