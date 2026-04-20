"use client";

import type { LucideIcon } from "lucide-react";
import { Link, Server, Video } from "lucide-react";
import { useInViewRef, useReducedMotion } from "~/hooks/use-animation";
import { cn } from "~/lib/utils";
import { type Locale, t } from "../../i18n/utils";
import { InviteMockup } from "./step-visuals/invite-mockup";
import { MeetingMockup } from "./step-visuals/meeting-mockup";
import { TerminalMockup } from "./step-visuals/terminal-mockup";

interface Step {
  key: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  glowColor: string;
}

const steps: Step[] = [
  {
    key: "install",
    icon: Server,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    glowColor: "shadow-[0_0_12px_rgba(59,130,246,0.5)]",
  },
  {
    key: "invite",
    icon: Link,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    glowColor: "shadow-[0_0_12px_rgba(16,185,129,0.5)]",
  },
  {
    key: "host",
    icon: Video,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
    glowColor: "shadow-[0_0_12px_rgba(139,92,246,0.5)]",
  },
];

function StepVisuals({ lang, index }: { lang: Locale; index: number }) {
  const visuals = [
    <TerminalMockup key="terminal" lang={lang} />,
    <InviteMockup key="invite" lang={lang} />,
    <MeetingMockup key="meeting" lang={lang} />,
  ];
  return visuals[index];
}

function StepCard({
  step,
  lang,
  iconSize,
}: {
  step: Step;
  lang: Locale;
  iconSize: string;
}) {
  return (
    <>
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-2xl",
          iconSize === "lg" ? "size-14" : "size-10 rounded-xl",
          step.bg,
        )}
      >
        <step.icon
          className={cn(iconSize === "lg" ? "size-7" : "size-5", step.color)}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
      <h3
        className={cn(
          "font-semibold tracking-tight",
          iconSize === "lg" ? "mt-5 text-xl lg:text-2xl" : "mt-3 text-[17px]",
        )}
      >
        {t(lang, `journey.${step.key}.title`)}
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground sm:mt-3 lg:text-base">
        {t(lang, `journey.${step.key}.description`)}
      </p>
    </>
  );
}

function JourneySteps({ lang }: { lang: Locale }) {
  const [desktopRef, desktopInView] = useInViewRef();
  const [mobileRef, mobileInView] = useInViewRef();
  const reduced = useReducedMotion();

  return (
    <>
      <div className="hidden md:block">
        <div ref={desktopRef} className="flex flex-col gap-16 md:gap-20">
          {steps.map((step, i) => {
            const isReversed = i % 2 === 1;

            return (
              <div
                key={step.key}
                className="grid grid-cols-2 items-center gap-12 lg:gap-16"
              >
                <div
                  className={cn(
                    "flex min-w-0 flex-col transition-all duration-700 ease-out",
                    isReversed && "order-last items-end text-end",
                    reduced || desktopInView
                      ? "translate-x-0 opacity-100"
                      : isReversed
                        ? "translate-x-8 opacity-0"
                        : "-translate-x-8 opacity-0",
                  )}
                  style={
                    !reduced ? { transitionDelay: `${i * 150}ms` } : undefined
                  }
                >
                  <StepCard step={step} lang={lang} iconSize="lg" />
                </div>
                <div
                  className={cn(
                    "flex min-w-0 justify-center transition-all duration-700 ease-out",
                    reduced || desktopInView
                      ? "translate-x-0 opacity-100"
                      : isReversed
                        ? "-translate-x-8 opacity-0"
                        : "translate-x-8 opacity-0",
                  )}
                  style={
                    !reduced
                      ? { transitionDelay: `${i * 150 + 100}ms` }
                      : undefined
                  }
                >
                  <StepVisuals lang={lang} index={i} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-6 md:hidden" ref={mobileRef}>
        <div className="flex flex-col items-center pt-1">
          {steps.map((step, i) => (
            <div key={step.key} className="flex flex-col items-center">
              <div
                className={cn(
                  "rounded-full transition-all duration-500 size-2.5",
                  step.bg,
                  i === 0 && "size-3.5 ring-2 ring-background",
                  i === 0 && step.glowColor,
                )}
                aria-hidden="true"
              />
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-border my-1" />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-12">
          {steps.map((step, i) => (
            <div
              key={step.key}
              className={cn(
                "flex flex-col transition-all duration-700 ease-out",
                reduced || mobileInView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-5 opacity-0",
              )}
              style={!reduced ? { transitionDelay: `${i * 150}ms` } : undefined}
            >
              <StepCard step={step} lang={lang} iconSize="sm" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function JourneyStepper({ lang }: { lang: Locale }) {
  const [ref, inView] = useInViewRef();
  const reduced = useReducedMotion();

  return (
    <section className="scroll-mt-20 px-6 py-24 sm:px-8 sm:py-32 lg:px-12">
      <div className="mx-auto max-w-7xl lg:max-w-screen-2xl">
        <div
          ref={ref}
          className={cn(
            "mb-12 text-center md:mb-16 transition-all duration-700 ease-out",
            reduced || inView
              ? "translate-y-0 opacity-100"
              : "translate-y-5 opacity-0",
          )}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t(lang, "journey.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
            {t(lang, "journey.subtitle")}
          </p>
        </div>

        <JourneySteps lang={lang} />
      </div>
    </section>
  );
}
