import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { updateUser } from '../lib/db';
import { stepsForRole, CURRENT_WALKTHROUGH_VERSION } from '../lib/walkthroughSteps';

const WalkthroughContext = createContext(null);

export function WalkthroughProvider({ children }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const autoCheckedFor = useRef(null);

  const steps = useMemo(() => (role ? stepsForRole(role) : []), [role]);
  const active = role != null;
  const currentStep = active ? steps[stepIndex] : null;

  // Auto-start once per session, based on the signed-in user's saved
  // completion flags. Skipping counts as "completed" for this purpose (see
  // completeWalkthrough), so this only fires for genuinely first-time users
  // or after a walkthrough_version bump.
  useEffect(() => {
    if (!currentUser) return;
    if (autoCheckedFor.current === currentUser.id) return;
    autoCheckedFor.current = currentUser.id;

    const isAdmin = currentUser.role === 'admin';
    const completedKey = isAdmin ? 'has_completed_admin_walkthrough' : 'has_completed_affiliate_walkthrough';
    const seenCurrentVersion = (currentUser.walkthrough_version || 0) >= CURRENT_WALKTHROUGH_VERSION;
    const alreadyDone = currentUser[completedKey] === true && seenCurrentVersion;

    if (!alreadyDone) {
      const t = setTimeout(() => {
        setRole(isAdmin ? 'admin' : 'affiliate');
        setStepIndex(0);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistCompletion = async (finishedRole) => {
    if (!currentUser) return;
    const key = finishedRole === 'admin' ? 'has_completed_admin_walkthrough' : 'has_completed_affiliate_walkthrough';
    try {
      await updateUser(currentUser.id, {
        [key]: true,
        last_walkthrough_seen_at: new Date().toISOString(),
        walkthrough_version: CURRENT_WALKTHROUGH_VERSION,
      });
    } catch (e) {
      /* best effort — don't block the UI on this */
    }
  };

  const start = (forRole) => {
    setRole(forRole || currentUser?.role || 'affiliate');
    setStepIndex(0);
  };

  const close = () => {
    setRole(null);
    setStepIndex(0);
  };

  const next = () => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const back = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const skip = async () => {
    const finishedRole = role;
    close();
    await persistCompletion(finishedRole);
  };

  const finish = async () => {
    const finishedRole = role;
    close();
    await persistCompletion(finishedRole);
  };

  const value = {
    active,
    role,
    steps,
    stepIndex,
    totalSteps: steps.length,
    currentStep,
    start,
    next,
    back,
    skip,
    finish,
    navigate,
    location,
  };

  return <WalkthroughContext.Provider value={value}>{children}</WalkthroughContext.Provider>;
}

export function useWalkthrough() {
  return useContext(WalkthroughContext);
}
