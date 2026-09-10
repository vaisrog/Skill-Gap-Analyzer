import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Set base URL for API calls (defaults to relative root so it works seamlessly on current port)
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Setup global Axios interceptors for Authorization and graceful 401 handling
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const currentToken = localStorage.getItem('access_token');
      if (currentToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // If an authenticated endpoint returns 401, clear stale token gracefully
        if (error.response?.status === 401) {
          const url = error.config?.url || '';
          const isAuthAction = url.includes('/api/auth/login') || url.includes('/api/auth/register');
          if (!isAuthAction) {
            localStorage.removeItem('access_token');
            setToken(null);
            setUser(null);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentUser = async () => {
      const currentToken = localStorage.getItem('access_token');
      if (!currentToken) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const response = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });
        if (isMounted) {
          if (response.data?.user) {
            setUser(response.data.user);
            setToken(currentToken);
          } else {
            localStorage.removeItem('access_token');
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        // Stale or expired token: silently reset local session
        localStorage.removeItem('access_token');
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

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
      console.warn('Login attempt unsuccessful:', err.response?.data?.error || err.message);
      let msg = 'Login failed.';
      if (err.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        msg = 'Cannot connect to backend server. Please verify connection.';
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
      showToast('Registration successful! Account saved.', 'success');
      return { success: true, user: newUser };
    } catch (err) {
      console.warn('Registration attempt unsuccessful:', err.response?.data?.error || err.message);
      let msg = 'Registration failed.';
      if (err.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        msg = 'Cannot connect to backend server. Please verify connection.';
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
