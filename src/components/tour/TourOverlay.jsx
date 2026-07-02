import { useEffect, useRef, useState } from 'react';
import { useWalkthrough } from '../../context/WalkthroughContext';

const MOBILE_BREAKPOINT = 640;
const MAX_FIND_ATTEMPTS = 30;
const FIND_RETRY_MS = 200;

function findVisibleTarget(selector) {
  if (!selector) return null;
  const candidates = document.querySelectorAll(selector);
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return el;
  }
  return null;
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;
}

export default function TourOverlay() {
  const { active, currentStep, stepIndex, totalSteps, next, back, skip, finish, navigate, location } = useWalkthrough();

  const [rect, setRect] = useState(null);
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(isMobileViewport());
  const attemptsRef = useRef(0);
  const cancelledRef = useRef(false);

  // Navigate to the step's route (if any) and fire its beforeShow action.
  useEffect(() => {
    if (!active || !currentStep) return;
    if (currentStep.route && location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
    if (currentStep.beforeShow) {
      window.dispatchEvent(new CustomEvent('chalky:tour-action', { detail: currentStep.beforeShow }));
    }
  }, [active, currentStep?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Locate the target element, retrying while the page/data finishes
  // loading. Falls back to a centered tooltip if it truly never appears;
  // silently advances past optional steps instead.
  useEffect(() => {
    if (!active || !currentStep) return;
    cancelledRef.current = false;
    attemptsRef.current = 0;
    setReady(false);
    setRect(null);

    function tryFind() {
      if (cancelledRef.current) return;
      const el = findVisibleTarget(currentStep.selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        setTimeout(() => {
          if (cancelledRef.current) return;
          setRect(el.getBoundingClientRect());
          setReady(true);
        }, 220);
        return;
      }
      if (attemptsRef.current < MAX_FIND_ATTEMPTS) {
        attemptsRef.current += 1;
        setTimeout(tryFind, FIND_RETRY_MS);
      } else if (currentStep.optional) {
        next();
      } else {
        setRect(null);
        setReady(true);
      }
    }
    tryFind();
    return () => { cancelledRef.current = true; };
  }, [active, currentStep?.id, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the highlight glued to the target on resize/scroll.
  useEffect(() => {
    if (!ready || !currentStep?.selector) return;
    function reposition() {
      const el = findVisibleTarget(currentStep.selector);
      if (el) setRect(el.getBoundingClientRect());
      setMobile(isMobileViewport());
    }
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [ready, currentStep?.selector]);

  if (!active || !currentStep || !ready) return null;

  const isFirst = stepIndex === 0;
  const isLast = !!currentStep.isFinish || stepIndex === totalSteps - 1;

  const spotlightStyle = rect
    ? {
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
      }
    : null;

  let tooltipStyle = {};
  let tooltipClass = 'tour-tooltip';

  if (mobile) {
    tooltipClass += ' tour-tooltip-sheet';
  } else if (rect) {
    const margin = 16;
    const tooltipWidth = 340;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - rect.bottom;
    const placeAbove = spaceBelow < 220 && rect.top > 220;

    tooltipStyle.left = Math.min(Math.max(rect.left, margin), Math.max(margin, vw - tooltipWidth - margin));
    if (placeAbove) {
      tooltipStyle.top = Math.max(margin, rect.top - 12);
      tooltipStyle.transform = 'translateY(-100%)';
    } else {
      tooltipStyle.top = Math.min(rect.bottom + 12, vh - 120);
    }
  } else {
    tooltipClass += ' tour-tooltip-center';
  }

  return (
    <>
      <div className="tour-click-blocker" />
      {spotlightStyle && <div className="tour-spotlight" style={spotlightStyle} />}
      <div className={tooltipClass} style={tooltipStyle}>
        <button className="tour-close-btn" aria-label="Close tour" onClick={skip}>✕</button>
        <div className="tour-progress">Step {stepIndex + 1} of {totalSteps}</div>
        <div className="tour-title">{currentStep.title}</div>
        <div className="tour-text">{currentStep.text}</div>
        <div className="tour-actions">
          <button className="btn btn-ghost btn-sm" onClick={skip}>Skip tour</button>
          <div className="tour-actions-right">
            {!isFirst && (
              <button className="btn btn-secondary btn-sm" onClick={back}>Back</button>
            )}
            {isLast ? (
              <button className="btn btn-primary btn-sm" onClick={finish}>Finish</button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={next}>Next</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
