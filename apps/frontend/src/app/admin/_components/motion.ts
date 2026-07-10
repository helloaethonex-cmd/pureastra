import type { Transition, Variants } from "framer-motion";

/** §2.8 easing tokens, mirrored from admin-tokens.css for use in Framer Motion transitions. */
export const easeOutPremium = [0.16, 1, 0.3, 1] as const;
export const easeInOutPremium = [0.4, 0, 0.2, 1] as const;

export const springPremium: Transition = { type: "spring", duration: 0.35, bounce: 0 };

/** Route/section enter — opacity + translateY + blur, per §2.8 "Page/section enter". */
export function pageEnterVariants(reduceMotion: boolean): Variants {
  if (reduceMotion) {
    return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } };
  }
  return {
    hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.28, ease: easeOutPremium },
    },
  };
}

/** Modal/drawer enter+exit — scale + opacity, spring bounce:0, per §2.8 "Modal / drawer". */
export function modalVariants(reduceMotion: boolean): Variants {
  if (reduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } },
      exit: { opacity: 0, transition: { duration: 0.01 } },
    };
  }
  return {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: springPremium },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: easeInOutPremium } },
  };
}

export function backdropVariants(reduceMotion: boolean): Variants {
  const duration = reduceMotion ? 0.01 : 0.2;
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration } },
    exit: { opacity: 0, transition: { duration } },
  };
}

/** KPI tile stagger — Dashboard first paint only, per §2.8. Runs once per mount. */
export function staggerContainerVariants(reduceMotion: boolean): Variants {
  return {
    hidden: {},
    visible: {
      transition: reduceMotion ? {} : { staggerChildren: 0.035 },
    },
  };
}

export function staggerItemVariants(reduceMotion: boolean): Variants {
  if (reduceMotion) {
    return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } };
  }
  return {
    hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.3, ease: easeOutPremium },
    },
  };
}

/** Icon state swap (save→saved, copy→copied) — crossfade, mode="wait" semantics, per §2.8. */
export function iconSwapVariants(reduceMotion: boolean): Variants {
  const duration = reduceMotion ? 0.01 : 0.15;
  return {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: "blur(2px)" },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration },
    },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: "blur(2px)", transition: { duration } },
  };
}
