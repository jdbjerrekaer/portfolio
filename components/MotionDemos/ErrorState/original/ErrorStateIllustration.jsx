"use client";
import React, { useRef } from "react";
import { Illustrations } from "@adtraction/ui-illustrations";
import styles from "./ErrorState.module.scss";

export const TUGS_TO_SHAKE_LOOSE = 3;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";

// render: a tangled yarn that wobbles and finally spins loose.
// load: a puzzle piece that jiggles as if trying to snap into place.
const MOTION = {
  render: {
    tug: [
      { transform: "rotate(0) scale(1)" },
      { transform: "rotate(-12deg) scale(0.92)" },
      { transform: "rotate(9deg) scale(1.04)" },
      { transform: "rotate(-4deg) scale(1)" },
      { transform: "rotate(0) scale(1)" }
    ],
    loose: [
      { transform: "rotate(0) scale(1)", filter: "blur(0)" },
      { transform: "rotate(200deg) scale(0.86)", filter: "blur(1.5px)", offset: 0.55 },
      { transform: "rotate(360deg) scale(1)", filter: "blur(0)" }
    ]
  },
  load: {
    tug: [
      { transform: "translateX(0) rotate(0)" },
      { transform: "translateX(-7px) rotate(-5deg)" },
      { transform: "translateX(6px) rotate(4deg)" },
      { transform: "translateX(-3px) rotate(-1deg)" },
      { transform: "translateX(0) rotate(0)" }
    ],
    loose: [
      { transform: "translate(0, 0) scale(1)" },
      { transform: "translate(0, -10px) scale(1.06)", offset: 0.3 },
      { transform: "translate(-8px, 0) scale(0.97)", offset: 0.5 },
      { transform: "translate(8px, 0) scale(0.97)", offset: 0.7 },
      { transform: "translate(0, 0) scale(1)" }
    ]
  }
};

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// The illustration is a lazy chunk; if it fails while the network is down, drop it
// rather than throw inside the error screen and cascade up every boundary.
class IllustrationGuard extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The error illustration as a small toy: tilts toward the cursor, and every click
 * is a "tug". The third tug calls onShakeLoose. Decorative and hidden from assistive
 * tech, since the real buttons already cover every action.
 */
const ErrorStateIllustration = ({ kind, retrying = false, onShakeLoose = () => {} }) => {
  const motionRef = useRef(null);
  const tugs = useRef(0);
  const Illustration = kind === "load" ? Illustrations.Plugin : Illustrations.Trassel2;

  const tilt = (event) => {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    const { style } = event.currentTarget;
    style.setProperty("--tilt-x", `${(0.5 - y) * 18}deg`);
    style.setProperty("--tilt-y", `${(x - 0.5) * 18}deg`);
    style.setProperty("--shine-x", `${x * 100}%`);
    style.setProperty("--shine-y", `${y * 100}%`);
  };

  const untilt = (event) => {
    event.currentTarget.style.removeProperty("--tilt-x");
    event.currentTarget.style.removeProperty("--tilt-y");
  };

  const tug = () => {
    if (retrying) return;
    tugs.current += 1;
    const loose = tugs.current >= TUGS_TO_SHAKE_LOOSE;
    if (loose) tugs.current = 0;

    const el = motionRef.current;
    if (prefersReducedMotion() || !el?.animate) {
      if (loose) onShakeLoose();
      return;
    }
    el.getAnimations().forEach((animation) => animation.cancel());
    const animation = el.animate(MOTION[kind][loose ? "loose" : "tug"], {
      duration: loose ? 720 : 460,
      easing: loose ? EASE_IN_OUT : EASE_OUT
    });
    if (loose) animation.finished.then(onShakeLoose, () => {});
  };

  return (
    <div
      className={styles.toy}
      aria-hidden="true"
      data-kind={kind}
      onClick={tug}
      onPointerMove={tilt}
      onPointerLeave={untilt}>
      <span ref={motionRef} className={styles.toyMotion}>
        <IllustrationGuard>
          <Illustration
            className={styles.illustration}
            width="var(--error-state-illustration-size)"
            height="var(--error-state-illustration-size)"
            alt=""
            draggable={false}
          />
        </IllustrationGuard>
        <span className={styles.shine} />
      </span>
    </div>
  );
};

export default ErrorStateIllustration;
