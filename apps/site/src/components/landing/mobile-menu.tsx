import type { LucideIcon } from "lucide-react";
import { BookOpen, Download, GitCompare, Home, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { GITHUB_URL } from "~/lib/config";
import { cn } from "~/lib/utils";
import { type Locale, supportedLocales, t } from "../../i18n/utils";
import { GitHubIcon } from "./github-icon";
import { navLinks, navRouteLinks } from "./nav-links";

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  "git-compare": GitCompare,
  "book-open": BookOpen,
  download: Download,
};

interface MobileMenuProps {
  onClose: () => void;
  lang: Locale;
}

export function MobileMenu({ onClose, lang }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const currentLang = lang;

  const switchTo = useCallback(
    (locale: Locale) => {
      if (locale !== currentLang) {
        const path = window.location.pathname;
        const rest = path.replace(`/${currentLang}`, "");
        window.location.href = `/${locale}${rest}`;
      }
    },
    [currentLang],
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "Tab") {
        if (!panelRef.current) return;
        const focusableElements = panelRef.current.querySelectorAll<
          HTMLButtonElement | HTMLAnchorElement
        >(
          "button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        );
        const first = focusableElements[0] as HTMLElement;
        const last = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (panelRef.current) {
      const focusable = panelRef.current.querySelector(
        "button:not([disabled]), a[href]",
      ) as HTMLElement;
      if (focusable) {
        focusable.focus();
      }
    }
  }, []);

  const backdropClickHandler = useCallback(() => {
    onClose();
  }, [onClose]);

  const starCount = t(lang, "hero.stars");

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t(lang, "a11y.closeMenu")}
        className="mobile-menu-backdrop absolute inset-0 bg-background/80 motion-safe:backdrop-blur-sm"
        onClick={backdropClickHandler}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, "a11y.navigationMenu")}
        className="mobile-menu-panel absolute inset-y-0 start-0 flex w-full max-w-sm flex-col bg-background shadow-xl"
      >
        <div className="flex h-full flex-col px-6 py-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  B
                </span>
              </div>
              <span className="text-lg font-bold tracking-tight">Bedrud</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-5" />
              <span className="sr-only">{t(lang, "a11y.closeMenu")}</span>
            </Button>
          </div>

          {/* Nav links */}
          <nav
            className="mt-8 flex flex-col gap-1"
            aria-label={t(lang, "mobileNav.navigation")}
          >
            {navLinks.map((link) => {
              const Icon = iconMap[link.icon];
              return (
                <a
                  key={link.key}
                  href={`/${lang}${link.route ? `/${link.route}` : ""}${link.hash ? `#${link.hash}` : ""}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {Icon && <Icon className="size-4 opacity-70" />}
                  {t(lang, link.key)}
                </a>
              );
            })}
            {navRouteLinks.map((link) => {
              const Icon = iconMap[link.icon];
              return (
                <a
                  key={link.key}
                  href={`/${lang}/${link.route}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {Icon && <Icon className="size-4 opacity-70" />}
                  {t(lang, link.key)}
                </a>
              );
            })}
          </nav>

          <div className="border-t mt-6 pt-6" />

          {/* CTA */}
          <div className="mt-auto flex flex-col gap-3">
            <Button size="lg" asChild>
              <a href={`/${lang}/docs`}>{t(lang, "mobileNav.getStarted")}</a>
            </Button>
          </div>

          {/* Actions */}
          <div className="border-t pt-6">
            {/* GitHub */}
            <Button variant="outline" asChild>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                <GitHubIcon className="size-4" />
                {t(lang, "mobileNav.github")}{" "}
                <span className="ml-2 text-xs opacity-70">⭐ {starCount}</span>
              </a>
            </Button>

            {/* Language grid */}
            <div className="mt-4">
              <div className="mb-2 text-sm font-medium text-muted-foreground">
                {t(lang, "mobileNav.language")}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {supportedLocales.map((locale) => {
                  const isActive = locale === currentLang;
                  return (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => switchTo(locale)}
                      className={cn(
                        "rounded-md px-2 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-popover-foreground hover:bg-accent/50",
                      )}
                    >
                      {locale}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
