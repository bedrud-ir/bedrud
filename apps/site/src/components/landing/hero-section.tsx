import { ArrowRight, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { Spotlight } from "~/components/ui/spotlight";
import { TextGenerateEffect } from "~/components/ui/text-generate-effect";
import { DEMO_URL } from "~/lib/config";
import { type Locale, t } from "../../i18n/utils";
import { DeviceShowcase } from "./device-showcase";

const INSTALL_CMD = "curl -fsSL https://get.bedrud.org | bash";

export function HeroSection({ lang }: { lang: Locale }) {
  const [copied, setCopied] = useState(false);

  const copyInstall = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = INSTALL_CMD;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <Spotlight />
        <div className="hero-glow absolute left-1/2 top-0 h-[40rem] w-[80rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/8 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24 lg:pt-28 xl:pt-32">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {t(lang, "hero.badge")}
          </div>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {t(lang, "hero.kicker")}
          </p>

          <TextGenerateEffect
            words={t(lang, "hero.headline")}
            as="h1"
            className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl xl:text-[3.5rem] rtl:leading-[1.4]"
            duration={0.4}
            delayIncrement={0.06}
          />

          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t(lang, "hero.subheadline")}
          </p>

          <div className="mt-8">
            <button
              type="button"
              onClick={copyInstall}
              aria-label={t(lang, "hero.installNow")}
              className="group mx-auto flex w-full max-w-lg flex-col gap-0 rounded-lg border border-border/80 bg-[#1c1c1e] px-4 pb-3 pt-3 font-mono text-sm transition-colors hover:border-border hover:bg-[#252527] dark:bg-foreground/10 dark:hover:bg-foreground/15"
              dir="ltr"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="size-[11px] rounded-full bg-[#ff5f57]" />
                  <span className="size-[11px] rounded-full bg-[#febc2e]" />
                  <span className="size-[11px] rounded-full bg-[#28c840]" />
                </div>
                {copied ? (
                  <span className="shrink-0 text-xs font-sans font-medium text-emerald-400">
                    {t(lang, "hero.copied")}
                  </span>
                ) : (
                  <Copy className="size-3.5 shrink-0 text-white/40 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />
                )}
              </div>
              <code className="flex items-center gap-2 truncate text-left text-white/90">
                <span className="shrink-0 text-emerald-400">$</span>
                <span>{INSTALL_CMD}</span>
              </code>
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              {t(lang, "hero.installMicrocopy")}
            </p>
          </div>

          <p className="mt-4 text-xs text-muted-foreground/70">
            {t(lang, "hero.trustBar")}
          </p>

          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              asChild
            >
              <a href={DEMO_URL} target="_blank" rel="noreferrer">
                {t(lang, "hero.tryDemo")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>

        <div className="relative z-0 mt-12 sm:mt-16">
          <DeviceShowcase lang={lang} />
        </div>
      </div>
    </section>
  );
}
