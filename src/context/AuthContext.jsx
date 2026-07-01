import { createContext, useContext, useEffect, useState } from 'react';
import {
  getUser, touchUserActive, signInAffiliate, signUpAffiliate,
  signInAdmin, adminNeedsSetup, setAdminPassword,
} from '../lib/db';
import { useDataVersion } from './DataContext';

const CURRENT_USER_KEY = 'affiliate_calendar_current_user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  useDataVersion(); // re-evaluate when db changes
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

  const logout = () => setCurrentUserId(null);

  const signUpAffiliateUser = (data) => {
    const result = signUpAffiliate(data);
    if (result.user) setCurrentUserId(result.user.id);
    return result;
  };

  const signInAffiliateUser = (data) => {
    const result = signInAffiliate(data);
    if (result.user) setCurrentUserId(result.user.id);
    return result;
  };

  const signInAdminUser = (data) => {
    const result = signInAdmin(data);
    if (result.user) setCurrentUserId(result.user.id);
    return result;
  };

  const completeAdminSetup = (password) => {
    const admin = setAdminPassword(password);
    if (admin) setCurrentUserId(admin.id);
    return admin;
  };

  // If the stored user id no longer exists (data reset), clear it.
  useEffect(() => {
    if (currentUserId && !getUser(currentUserId)) {
      setCurrentUserId(null);
    }
  }, [currentUserId]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        logout,
        signUpAffiliateUser,
        signInAffiliateUser,
        signInAdminUser,
        adminNeedsSetup,
        completeAdminSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
