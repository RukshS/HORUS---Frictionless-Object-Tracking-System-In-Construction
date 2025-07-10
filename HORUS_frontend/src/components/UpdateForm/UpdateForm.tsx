import React, { useState, useEffect } from 'react';
import './UpdateForm.css';
import AuthService from '../../services/AuthService';

interface UserProfile {
  email: string;
  admin_name: string;
  company_name: string;
  contact_no: string;
  location?: string;
}

interface UpdateFormProps {
  onClose: () => void;
  onUpdateSuccess: (updatedProfile: UserProfile) => void;
  currentProfile: UserProfile;
}

interface ValidationErrors {
  admin_name?: string;
  company_name?: string;
  email?: string;
  contact_no?: string;
  location?: string;
  general?: string;
}

const UpdateForm: React.FC<UpdateFormProps> = ({ onClose, onUpdateSuccess, currentProfile }) => {
  const [adminName, setAdminName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [location, setLocation] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  // Initialize form with current profile data
  useEffect(() => {
    if (currentProfile) {
      setAdminName(currentProfile.admin_name);
      setCompanyName(currentProfile.company_name);
      setEmail(currentProfile.email);
      setContactNo(currentProfile.contact_no);
      setLocation(currentProfile.location || '');
    }
  }, [currentProfile]);

  const validateContactNo = (contactNo: string) => {
    // Remove all non-digit characters
    const cleanedNumber = contactNo.replace(/\D/g, '');
    
    // Check if the number has exactly 10 digits for xxx xxxx xxx format
    if (cleanedNumber.length !== 10) {
      return false;
    }
    
    return true;
  };

  // Function to format phone number as user types
  const formatPhoneNumber = (input: string) => {
    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, '');
    
    // Limit to 10 digits for the xxx xxxx xxx format
    const truncated = digitsOnly.substring(0, 10);
    
    let formatted = '';
    
    if (truncated.length <= 3) {
      // First 3 digits: xxx
      formatted = truncated;
    } else if (truncated.length <= 7) {
      // First 3 digits + space + next 4 digits: xxx xxxx
      formatted = truncated.substring(0, 3) + ' ' + truncated.substring(3);
    } else {
      // Full format: xxx xxxx xxx
      formatted = truncated.substring(0, 3) + ' ' + 
                  truncated.substring(3, 7) + ' ' + 
                  truncated.substring(7);
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
      case 'admin_name':
        if (!adminName.trim()) {
          errorMessage = 'Admin name is required';
          isValid = false;
        } else if (adminName.trim().length < 2) {
          errorMessage = 'Admin name must be at least 2 characters';
          isValid = false;
        }
        break;

      case 'company_name':
        if (!companyName.trim()) {
          errorMessage = 'Company name is required';
          isValid = false;
        } else if (companyName.trim().length < 2) {
          errorMessage = 'Company name must be at least 2 characters';
          isValid = false;
        }
        break;

      case 'email':
        // Email cannot be updated - field is disabled but show message if user somehow tries
        if (email !== currentProfile.email) {
          errorMessage = "Can't update user email";
          isValid = false;
        }
        break;

      case 'contact_no':
        if (!contactNo.trim()) {
          errorMessage = 'Contact number is required';
          isValid = false;
        } else if (!validateContactNo(contactNo)) {
          const cleanedNumber = contactNo.replace(/\D/g, '');
          if (cleanedNumber.length < 10) {
            errorMessage = `Phone number too short (${cleanedNumber.length}/10 digits required)`;
          } else if (cleanedNumber.length > 10) {
            errorMessage = 'Phone number too long (10 digits only)';
          } else {
            errorMessage = 'Please enter a valid 10-digit phone number (e.g., 123 4567 890)';
          }
          isValid = false;
        }
        break;

      case 'location':
        // Location is optional, so no validation needed
        break;
    }

    setErrors(prev => ({ ...prev, [field]: errorMessage }));
    return isValid;
  };

  const validateForm = (): boolean => {
    const fields: (keyof ValidationErrors)[] = [
      'admin_name', 'company_name', 'email', 'contact_no'
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
      const updatedProfile = await AuthService.updateProfile({
        admin_name: adminName,
        company_name: companyName,
        contact_no: contactNo,
        location: location
      });
      
      onUpdateSuccess(updatedProfile);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ general: err.message || 'Update failed. Please try again.' });
      } else {
        setErrors({ general: 'An unknown error occurred during update.' });
      }
      console.error('Update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="update-overlay">
      <div className="update-form-container">
        <button className="close-button" onClick={onClose} disabled={isLoading}>×</button>
        <h2>Company Details</h2>
        <form onSubmit={handleSubmit}>
          {errors.general && <p className="error-message">{errors.general}</p>}
          
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                id="adminName"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                onBlur={() => handleBlur('admin_name')}
                required
                placeholder=" " 
                disabled={isLoading}
                className={errors.admin_name ? 'has-error' : ''}
              />
              <label htmlFor="adminName">Admin Name</label>
              {errors.admin_name && <div className="field-error">{errors.admin_name}</div>}
            </div>
            <div className="form-group">
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={() => handleBlur('company_name')}
                required
                placeholder=" " 
                disabled={isLoading}
                className={errors.company_name ? 'has-error' : ''}
              />
              <label htmlFor="companyName">Company Name</label>
              {errors.company_name && <div className="field-error">{errors.company_name}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                required
                placeholder=" " 
                disabled={true}
                className={errors.email ? 'has-error' : ''}
                title="Email cannot be updated"
              />
              <label htmlFor="email">Email</label>
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <input
                type="tel"
                id="contactNo"
                value={contactNo}
                onChange={(e) => {
                  const formattedNumber = formatPhoneNumber(e.target.value);
                  setContactNo(formattedNumber);
                }}
                onBlur={() => handleBlur('contact_no')}
                required
                placeholder=" " 
                disabled={isLoading}
                className={errors.contact_no ? 'has-error' : ''}
              />
              <label htmlFor="contactNo">Contact No</label>
              {errors.contact_no && <div className="field-error">{errors.contact_no}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={() => handleBlur('location')}
                placeholder=" " 
                disabled={isLoading}
                className={errors.location ? 'has-error' : ''}
              />
              <label htmlFor="location">Location</label>
              {errors.location && <div className="field-error">{errors.location}</div>}
            </div>
            <div className="form-group">
              {/* Empty div to maintain grid layout */}
            </div>
          </div>
          
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateForm;
