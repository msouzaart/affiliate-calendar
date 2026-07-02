import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
} from 'firebase/auth';
import { auth } from '../lib/firebaseClient';
import { getUser, createProfile, touchUserActive, listUsers, updateUser } from '../lib/db';

const AuthContext = createContext(null);

function friendlyAuthError(error) {
  const code = error?.code || '';
  if (code.includes('email-already-in-use')) return 'That email is already registered.';
  if (code.includes('invalid-email')) return 'That email address looks invalid.';
  if (code.includes('weak-password')) return 'Choose a password with at least 6 characters.';
  if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'Incorrect email or password.';
  }
  return error?.message || 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = not resolved yet
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser || null);
      if (fbUser) {
        const profile = await getUser(fbUser.uid);
        setCurrentUser(profile);
        if (profile) touchUserActive(fbUser.uid);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const logout = () => signOut(auth);

  const signUpAffiliateUser = async ({ name, email, username, password }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const profile = await createProfile(cred.user.uid, { name, email, role: 'affiliate' });
      if (username) await updateUser(cred.user.uid, { username });
      setCurrentUser({ ...profile, username });
      return { user: profile };
    } catch (error) {
      return { error: friendlyAuthError(error) };
    }
  };

  const signInAffiliateUser = async ({ identifier, password }) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, identifier, password);
      const profile = await getUser(cred.user.uid);
      if (!profile || profile.role !== 'affiliate') {
        await signOut(auth);
        return { error: 'No affiliate account found with that email.' };
      }
      setCurrentUser(profile);
      return { user: profile };
    } catch (error) {
      return { error: friendlyAuthError(error) };
    }
  };

  const adminNeedsSetup = async () => {
    const admins = await listUsers({ role: 'admin' });
    return admins.length === 0;
  };

  const signInAdminUser = async ({ email, password }) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUser(cred.user.uid);
      if (!profile || profile.role !== 'admin') {
        await signOut(auth);
        return { error: 'That account does not have admin access.' };
      }
      setCurrentUser(profile);
      return { user: profile };
    } catch (error) {
      return { error: friendlyAuthError(error) };
    }
  };

  const createFirstAdmin = async ({ name, email, password }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const profile = await createProfile(cred.user.uid, { name: name || 'Program Admin', email, role: 'admin' });
      setCurrentUser(profile);
      return { user: profile };
    } catch (error) {
      return { error: friendlyAuthError(error) };
    }
  };

  const changeOwnPassword = async ({ currentPassword, newPassword }) => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) return { error: 'You must be signed in.' };
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      return { ok: true };
    } catch (error) {
      return { error: friendlyAuthError(error) };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authLoading: loading,
        logout,
        signUpAffiliateUser,
        signInAffiliateUser,
        signInAdminUser,
        adminNeedsSetup,
        createFirstAdmin,
        changeOwnPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
