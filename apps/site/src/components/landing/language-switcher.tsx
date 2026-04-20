import { Globe } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { type Locale, supportedLocales, t } from "../../i18n/utils";

interface LangMeta {
  flag: string;
  label: string;
}

const langMeta: Record<Locale, LangMeta> = {
  en: { flag: "🇬🇧", label: "English" },
  de: { flag: "🇩🇪", label: "Deutsch" },
  fr: { flag: "🇫🇷", label: "Français" },
  es: { flag: "🇪🇸", label: "Español" },
  zh: { flag: "🇨🇳", label: "中文" },
  ja: { flag: "🇯🇵", label: "日本語" },
  tr: { flag: "🇹🇷", label: "Türkçe" },
  fa: { flag: "🇮🇷", label: "فارسی ⟵" },
  ar: { flag: "🇸🇦", label: "العربية ⟵" },
  ru: { flag: "🇷🇺", label: "Русский" },
};

export function LanguageSwitcher({
  className,
  lang,
}: {
  className?: string;
  lang: Locale;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentLang = lang;

  const switchTo = useCallback(
    (locale: Locale) => {
      setOpen(false);
      if (locale !== currentLang) {
        const path = window.location.pathname;
        const rest = path.replace(`/${currentLang}`, "");
        window.location.href = `/${locale}${rest}`;
      }
    },
    [currentLang],
  );

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t(lang, "a11y.changeLanguage")}
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Globe className="size-4" />
      </button>

      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`lang-${currentLang}`}
          className="absolute inset-e-0 top-full z-50 mt-1.5 min-w-36 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-popover p-1 shadow-lg"
        >
          {supportedLocales.map((locale) => {
            const meta = langMeta[locale];
            const isActive = locale === currentLang;
            return (
              <button
                key={locale}
                id={`lang-${locale}`}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => switchTo(locale)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-popover-foreground hover:bg-accent/50",
                )}
              >
                <span className="text-base leading-none">{meta.flag}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
