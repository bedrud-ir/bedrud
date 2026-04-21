import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/* ------------------------------------------------------------------ */
/*  iPhone mockup                                                      */
/* ------------------------------------------------------------------ */

export function IPhoneMockup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.5rem] border-[3px] border-neutral-800 bg-black shadow-xl",
        className,
      )}
    >
      {/* Dynamic Island */}
      <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-3">
        <div className="h-[1.4rem] w-[5.5rem] rounded-full bg-black" />
      </div>

      {/* Screen content */}
      <div className="relative size-full overflow-hidden">{children}</div>

      {/* Home indicator */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-2">
        <div className="h-1 w-[35%] rounded-full bg-white/30" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Android mockup                                                     */
/* ------------------------------------------------------------------ */

export function AndroidMockup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[9/19.5] w-full overflow-hidden rounded-[1.5rem] border-[3px] border-neutral-700 bg-black shadow-xl",
        className,
      )}
    >
      {/* Punch-hole camera */}
      <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-2.5">
        <div className="size-2.5 rounded-full bg-neutral-900 ring-1 ring-neutral-700" />
      </div>

      {/* Screen content */}
      <div className="relative size-full overflow-hidden">{children}</div>

      {/* Navigation bar hint */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-1.5">
        <div className="h-1 w-[30%] rounded-full bg-white/25" />
      </div>
    </div>
  );
}
