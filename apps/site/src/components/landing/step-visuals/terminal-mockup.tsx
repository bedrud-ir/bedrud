import { useEffect, useState } from "react";
import { useInViewRef } from "~/hooks/use-animation";
import { cn } from "~/lib/utils";
import { type Locale, t } from "../../../i18n/utils";

const command = "curl -fsSL https://get.bedrud.org | bash";

function getOutputLines(lang: Locale) {
  return [
    {
      text: t(lang, "mockups.terminal.downloading"),
      color: "text-emerald-400/80",
    },
    {
      text: t(lang, "mockups.terminal.installing"),
      color: "text-emerald-400/80",
    },
    { text: t(lang, "mockups.terminal.ready"), color: "text-emerald-400/80" },
  ];
}

export function TerminalMockup({ lang }: { lang: Locale }) {
  const outputLines = getOutputLines(lang);
  const [containerRef, isVisible] = useInViewRef();
  const [phase, setPhase] = useState<"typing" | "output" | "prompt">("typing");
  const [typedChars, setTypedChars] = useState(0);
  const [visibleOutput, setVisibleOutput] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    if (phase !== "typing") return;

    if (typedChars >= command.length) {
      const timer = setTimeout(() => setPhase("output"), 400);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(
      () => {
        setTypedChars((c) => c + 1);
      },
      35 + Math.random() * 25,
    );

    return () => clearTimeout(timer);
  }, [isVisible, phase, typedChars]);

  useEffect(() => {
    if (!isVisible) return;
    if (phase !== "output") return;

    if (visibleOutput >= outputLines.length) {
      const timer = setTimeout(() => setPhase("prompt"), 300);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setVisibleOutput((c) => c + 1);
    }, 250);

    return () => clearTimeout(timer);
  }, [isVisible, phase, visibleOutput, outputLines.length]);

  return (
    <div
      ref={containerRef}
      dir="ltr"
      aria-hidden="true"
      className="min-h-[260px] overflow-hidden rounded-2xl bg-[#111127] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04),0px_8px_8px_-8px_rgba(0,0,0,0.04),0px_0px_0px_1px_#fafafa] dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.06),0px_2px_2px_rgba(0,0,0,0.3),0px_8px_8px_-8px_rgba(0,0,0,0.4)]"
    >
      <div className="flex h-9 items-center gap-2 border-b border-white/[0.05] bg-[#0c0c20] px-4">
        <div className="size-2.5 rounded-full bg-[#ff5f57]" />
        <div className="size-2.5 rounded-full bg-[#febc2e]" />
        <div className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ms-2 text-[11px] font-medium text-white/30">
          {t(lang, "mockups.terminal.title")}
        </span>
      </div>

      <div className="p-4 font-mono text-sm leading-relaxed">
        <div className="flex">
          <span className="text-emerald-400">$</span>
          <span className="ms-1.5 text-white/80">
            {command.slice(0, typedChars)}
          </span>
          {phase === "typing" && (
            <span className="animate-pulse text-white/60">█</span>
          )}
        </div>

        {phase !== "typing" && (
          <div className="mt-3 flex flex-col gap-1.5">
            {outputLines.slice(0, visibleOutput).map((line) => (
              <div key={line.text} className={cn("text-[13px]", line.color)}>
                {line.text}
              </div>
            ))}
          </div>
        )}

        {phase === "prompt" && (
          <div className="mt-3 flex">
            <span className="text-emerald-400">$</span>
            <span className="ms-1.5 text-white/80">./bedrud start</span>
            <span className="animate-pulse text-white/60">█</span>
          </div>
        )}

        <div className="mt-2 h-2" />
      </div>
    </div>
  );
}
