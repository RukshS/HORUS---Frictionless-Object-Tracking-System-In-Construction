import { jwtDecode } from 'jwt-decode'; // Import jwt-decode

// Define the base URL for your FastAPI backend
const API_BASE_URL = 'http://localhost:8000/api/auth'; // Adjust if your backend runs elsewhere

interface DecodedToken {
  sub: string; // Subject (usually email or user ID)
  exp: number; // Expiration time (timestamp in seconds)
  // Add any other claims your backend includes in the token
}

const AuthService = {
  signup: async (
    adminName: string,
    companyName: string,
    email: string,
    contactNo: string,
    password: string
  ): Promise<{ token: string }> => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Adjust field names to match what backend expects from user.py
      body: JSON.stringify({ 
        admin_name: adminName, 
        company_name: companyName, 
        email, 
        contact_no: contactNo, 
        password 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Signup failed. Please try again.' }));
      throw new Error(errorData.detail || 'Signup failed. Please try again.');
    }

    const data = await response.json(); // Expects { token: "...", token_type: "bearer" }
    // The backend returns "token", so data.token should work.
    if (data.token) {
      localStorage.setItem('jwtToken', data.token);
      return { token: data.token };
    } else {
      throw new Error('Signup successful, but no token received.');
    }
  },


  signin: async (email: string, password: string): Promise<{ token: string }> => {
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2PasswordRequestForm expects 'username'
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Changed Content-Type
      },
      body: formData.toString(), // Send as URL-encoded form data
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Invalid credentials' }));
      throw new Error(errorData.detail || 'Invalid credentials');
    }
    
    const data = await response.json(); // Expects { token: "...", token_type: "bearer" }
    if (data.token) {
      localStorage.setItem('jwtToken', data.token);
      return { token: data.token };
    } else {
      throw new Error('Signin successful, but no token received.');
    }
  },

  // Add login function to maintain compatibility with App.tsx
  login: async (email: string, password: string): Promise<{ token: string }> => {
    // Reuse signin function to keep things consistent
    return AuthService.signin(email, password);
  },

  logout: (): void => {
    localStorage.removeItem('jwtToken');
    console.log('[AuthService]: User logged out, token removed.');
  },

  getToken: (): string | null => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);
        // Check if the token is expired
        if (decodedToken.exp * 1000 < Date.now()) {
          console.log('[AuthService]: Token expired, logging out.');
          AuthService.logout(); // Call logout to clear the token
          return null;
        }
        return token;
      } catch (error) {
        console.error('[AuthService]: Invalid token:', error);
        AuthService.logout(); // If token is invalid, log out
        return null;
      }
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    const token = AuthService.getToken(); // getToken now handles expiration check
    return !!token;
  },

  getUserProfile: async (): Promise<{
    email: string;
    admin_name: string;
    company_name: string;
    contact_no: string;
  }> => {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('No token found. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch user profile' }));
      throw new Error(errorData.detail || 'Failed to fetch user profile');
    }

    return await response.json();
  },

   updateProfile: async (profileData: {
    admin_name: string;
    company_name: string;
    email: string;
    contact_no: string;
  }): Promise<{
    email: string;
    admin_name: string;
    company_name: string;
    contact_no: string;
  }> => {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('No token found. Please login first.');
    }

    const response = await fetch(`${API_BASE_URL}/update-profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to update profile' }));
      throw new Error(errorData.detail || 'Failed to update profile');
    }

    return await response.json();
  },
};

export default AuthService;
