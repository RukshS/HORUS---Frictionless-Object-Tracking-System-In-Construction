import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = 'http://localhost:8000/api/auth';

interface DecodedToken {
  sub: string;
  exp: number;
  user_id?: string;
  email?: string;
}

interface UserData {
  id: string;
  admin_name: string;
  company_name: string;
  email: string;
  contact_no: string;
  location?: string;
  emergency_contact?: string;
  created_at?: string;
}

const UserService = {
  getCurrentUser: async (): Promise<UserData | null> => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const decodedToken: DecodedToken = jwtDecode(token);
      
      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.removeItem('jwtToken'); // Remove expired token
        throw new Error('Token expired');
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('jwtToken'); // Remove invalid token
          throw new Error('Authentication failed');
        }
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  },

  updateUser: async (userData: Partial<UserData>): Promise<UserData> => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('jwtToken');
          throw new Error('Authentication failed');
        }
        const errorData = await response.json().catch(() => ({ detail: 'Update failed' }));
        throw new Error(errorData.detail || 'Failed to update user data');
      }

      const updatedUser = await response.json();
      return updatedUser;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }
};

export default UserService;
export type { UserData, DecodedToken };
