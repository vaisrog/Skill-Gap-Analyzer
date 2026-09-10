import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Set base URL for API calls so frontend always reaches Flask backend reliably
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Configure authorization header globally whenever token changes
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('/api/auth/me');
        setUser(response.data.user);
      } catch (err) {
        console.error('Session verification failed:', err);
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      setUser(loggedUser);
      showToast(`Welcome back, ${loggedUser.full_name}!`, 'success');
      return { success: true, user: loggedUser };
    } catch (err) {
      console.error('Login error details:', err);
      let msg = 'Login failed.';
      if (err.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        msg = 'Cannot connect to backend server. Please ensure Python backend is running on http://127.0.0.1:5000.';
      } else {
        msg = err.message || 'Login failed. Please check credentials.';
      }
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', formData);
      const { access_token, user: newUser } = res.data;
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      setUser(newUser);
      showToast('Registration successful! Account saved to database.', 'success');
      return { success: true, user: newUser };
    } catch (err) {
      console.error('Registration error details:', err);
      let msg = 'Registration failed.';
      if (err.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        msg = 'Cannot connect to backend server. Please ensure Python backend is running on http://127.0.0.1:5000.';
      } else {
        msg = err.message || 'Registration failed.';
      }
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully.', 'info');
  };

  const updateUserProfile = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role: user?.role || null,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student',
        login,
        register,
        logout,
        updateUserProfile,
        toastMessage,
        showToast
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
