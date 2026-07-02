import { useEffect, useState } from 'react';
import { useWalkthrough } from '../../context/WalkthroughContext';

const MOBILE_BREAKPOINT = 640;
const MAX_FIND_ATTEMPTS = 30; // ~6s — generous, covers page nav + Firestore data loads
const MAX_FIND_ATTEMPTS_OPTIONAL = 6; // ~1.2s — optional steps' targets are either already
// on-screen (same page as the previous step) or genuinely don't exist for this account, so
// there's no reason to make the user wait 6 seconds to find that out.
const FIND_RETRY_MS = 200;
const RENAVIGATE_EVERY = 4; // re-issue navigate() every N failed attempts, in case the first call didn't stick
const TOOLTIP_WIDTH = 340;
const TOOLTIP_EST_HEIGHT = 200; // rough estimate, used only to keep the box fully on-screen

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
  const { active, currentStep, stepIndex, totalSteps, next, back, skip, finish, navigate } = useWalkthrough();

  const [rect, setRect] = useState(null);
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(isMobileViewport());

  // Drives one self-contained poll loop per step: reads the *live* URL
  // (window.location, not a possibly-stale React value) on every tick, so it
  // keeps retrying navigation if the first attempt didn't stick, then keeps
  // retrying the element lookup until the page has actually rendered it.
  useEffect(() => {
    if (!active || !currentStep) return;
    let cancelled = false;
    let attempts = 0;
    let beforeShowFired = false;
    const maxAttempts = currentStep.optional ? MAX_FIND_ATTEMPTS_OPTIONAL : MAX_FIND_ATTEMPTS;
    setReady(false);
    setRect(null);

    function giveUp() {
      if (currentStep.optional) {
        next();
      } else {
        setRect(null);
        setReady(true);
      }
    }

    function tick() {
      if (cancelled) return;

      const onRightPage = !currentStep.route || window.location.pathname === currentStep.route;

      if (!onRightPage) {
        if (attempts % RENAVIGATE_EVERY === 0) {
          navigate(currentStep.route);
        }
        attempts += 1;
        if (attempts < maxAttempts) {
          setTimeout(tick, FIND_RETRY_MS);
        } else {
          giveUp();
        }
        return;
      }

      if (currentStep.beforeShow && !beforeShowFired) {
        beforeShowFired = true;
        window.dispatchEvent(new CustomEvent('chalky:tour-action', { detail: currentStep.beforeShow }));
      }

      const el = findVisibleTarget(currentStep.selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        setTimeout(() => {
          if (cancelled) return;
          setRect(el.getBoundingClientRect());
          setReady(true);
        }, 220);
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(tick, FIND_RETRY_MS);
      } else {
        giveUp();
      }
    }

    tick();
    return () => { cancelled = true; };
  }, [active, currentStep?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!active || !currentStep) return null;

  if (!ready) {
    // Still navigating to the right page / waiting for the target element
    // to render. Always show *something* — a bare overlay with no way out
    // reads as "frozen", even though it's just loading.
    return (
      <>
        <div className="tour-click-blocker" />
        <div className="tour-tooltip tour-tooltip-center">
          <button className="tour-close-btn" aria-label="Close tour" onClick={skip}>✕</button>
          <div className="tour-progress">Step {stepIndex + 1} of {totalSteps}</div>
          <div className="tour-title">{currentStep.title}</div>
          <div className="tour-text">Loading this part of the app…</div>
          <div className="tour-actions">
            <button className="btn btn-ghost btn-sm" onClick={skip}>Skip tour</button>
          </div>
        </div>
      </>
    );
  }

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
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    tooltipStyle.left = Math.min(Math.max(rect.left, margin), Math.max(margin, vw - TOOLTIP_WIDTH - margin));

    // Prefer directly below the element, then directly above it, then — for
    // elements that are themselves taller than the viewport (a long form, a
    // big table) where neither truly fits — just clamp the box fully inside
    // the viewport instead of letting it hang off the bottom edge.
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    let top;
    if (spaceBelow >= TOOLTIP_EST_HEIGHT + margin) {
      top = rect.bottom + 12;
    } else if (spaceAbove >= TOOLTIP_EST_HEIGHT + margin) {
      top = rect.top - TOOLTIP_EST_HEIGHT - 12;
    } else {
      top = vh / 2 - TOOLTIP_EST_HEIGHT / 2;
    }
    tooltipStyle.top = Math.min(Math.max(top, margin), Math.max(margin, vh - TOOLTIP_EST_HEIGHT - margin));
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
