import { createContext, useContext, useEffect, useState } from 'react';
import { getUser, createUser, touchUserActive } from '../lib/db';
import { useDataVersion } from './DataContext';

const CURRENT_USER_KEY = 'affiliate_calendar_current_user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  useDataVersion(); // re-evaluate when db changes (e.g. user list updates)
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem(CURRENT_USER_KEY));

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(CURRENT_USER_KEY, currentUserId);
      touchUserActive(currentUserId);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [currentUserId]);

  const currentUser = currentUserId ? getUser(currentUserId) : null;

  const login = (userId) => setCurrentUserId(userId);
  const logout = () => setCurrentUserId(null);
  const signUp = ({ name, email, role = 'affiliate' }) => {
    const user = createUser({ name, email, role });
    setCurrentUserId(user.id);
    return user;
  };

  // If the stored user id no longer exists (data reset), clear it.
  useEffect(() => {
    if (currentUserId && !getUser(currentUserId)) {
      setCurrentUserId(null);
    }
  }, [currentUserId]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
