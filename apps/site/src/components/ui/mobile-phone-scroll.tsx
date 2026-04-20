"use client";
import {
  type MotionValue,
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import type React from "react";
import { useRef } from "react";
import { useReducedMotion } from "~/hooks/use-animation";

export function MobilePhoneScroll({
  children,
}: {
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(
    scrollYProgress,
    [0, 0.4],
    reduced ? [0.8, 0.8] : [0.8, 1],
  );
  const rotateX = useTransform(
    scrollYProgress,
    [0.1, 0.15, 0.4],
    reduced ? [-20, -20, -20] : [-20, -20, 0],
  );
  const translate = useTransform(
    scrollYProgress,
    [0, 0.7],
    reduced ? [0, 0] : [0, 100],
  );

  return (
    <div
      ref={ref}
      className="pointer-events-none relative flex min-h-[15rem] shrink-0 flex-col items-center justify-start pt-10 [perspective:800px] md:hidden"
    >
      <PhoneFrame scale={scale} rotateX={rotateX} translate={translate}>
        {children}
      </PhoneFrame>
    </div>
  );
}

function PhoneFrame({
  scale,
  rotateX,
  translate,
  children,
}: {
  scale: MotionValue<number>;
  rotateX: MotionValue<number>;
  translate: MotionValue<number>;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        scale,
        rotateX,
        translateY: translate,
        transformStyle: "preserve-3d",
        transformOrigin: "top",
      }}
      className="relative aspect-[9/19.5] w-56 overflow-hidden rounded-[2.5rem] border-[4px] border-neutral-800 bg-black shadow-2xl sm:w-64"
    >
      {/* Dynamic Island */}
      <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-3">
        <div className="h-[1.6rem] w-[6rem] rounded-full bg-black" />
      </div>

      {/* Screen content */}
      <div className="relative size-full overflow-hidden">{children}</div>

      {/* Home indicator */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-2">
        <div className="h-1 w-[35%] rounded-full bg-white/30" />
      </div>
    </motion.div>
  );
}
