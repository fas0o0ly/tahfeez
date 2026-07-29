// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { setToken, clearToken } from '../api/axiosInstance';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // true on mount — we check session before rendering anything
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return { user: action.payload, isAuthenticated: true, isLoading: false };
    case 'AUTH_LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false };
    case 'AUTH_LOADING_DONE':
      return { ...state, isLoading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount — always attempt /auth/me. If the access token is missing or
  // expired the axios interceptor will transparently refresh it via the
  // httpOnly cookie and retry the request, so a page refresh never logs out
  // a user who still has a valid refresh token.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await authApi.getMe();
        dispatch({ type: 'AUTH_SUCCESS', payload: data.data.profile });
      } catch {
        clearToken();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    restoreSession();

    // Listen for token refresh failures from axios interceptor
    const handleForceLogout = () => {
      dispatch({ type: 'AUTH_LOGOUT' });
    };

    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    setToken(data.data.accessToken);
    dispatch({ type: 'AUTH_SUCCESS', payload: data.data.user });
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the server call fails, clear local state
    } finally {
      clearToken();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    dispatch({ type: 'AUTH_SUCCESS', payload: updatedUser });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};