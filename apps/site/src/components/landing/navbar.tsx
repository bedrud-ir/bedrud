import { Menu, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { GITHUB_URL } from "~/lib/config";
import { fetchRepoInfo } from "~/lib/github";
import { cn } from "~/lib/utils";
import { type Locale, t } from "../../i18n/utils";
import { GitHubIcon } from "./github-icon";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { navLinks, navRouteLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

const SCROLL_THRESHOLD = 50;

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function Navbar({
  lang,
  currentPath,
}: {
  lang: Locale;
  currentPath?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [stars, setStars] = useState<string | null>(null);

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > SCROLL_THRESHOLD);
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetchRepoInfo().then((data) => {
      if (data) setStars(formatCount(data.stargazers_count));
    });
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40">
        <div
          className={cn(
            "transition-all duration-300",
            scrolled
              ? "mx-3 mt-3 rounded-2xl border border-border/40 bg-background/92 shadow-lg shadow-black/[0.03] backdrop-blur-xl saturate-[1.4] sm:mx-auto sm:max-w-4xl dark:border-border/30 dark:shadow-black/20"
              : "border-b border-border/40 bg-background/92 backdrop-blur-xl saturate-[1.4]",
          )}
        >
          <nav
            className={cn(
              "flex items-center justify-between gap-4 transition-all duration-300",
              scrolled ? "mx-auto h-12 px-4" : "h-16 mx-auto max-w-5xl px-6",
            )}
          >
            <a href={`/${lang}`} className="flex shrink-0 items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
                <span className="text-xs font-bold text-primary-foreground">
                  B
                </span>
              </div>
              <span className="text-base font-semibold tracking-tight">
                Bedrud
              </span>
            </a>

            <div className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
              {navLinks.map((link) => {
                const href = `/${lang}${link.route ? `/${link.route}` : ""}${link.hash ? `#${link.hash}` : ""}`;
                const isActive =
                  currentPath === href ||
                  (!link.route && !link.hash && currentPath === `/${lang}`);
                return (
                  <a
                    key={link.key}
                    href={href}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {t(lang, link.key)}
                  </a>
                );
              })}
              {navRouteLinks.map((link) => {
                const href = `/${lang}/${link.route}`;
                const isActive = currentPath === href;
                return (
                  <a
                    key={link.key}
                    href={href}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {t(lang, link.key)}
                  </a>
                );
              })}
            </div>

            <div className="hidden shrink-0 items-center gap-0.5 md:flex">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                aria-label={t(lang, "footer.social.github")}
                className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <GitHubIcon className="size-3.5" />
              </a>
              <ThemeToggle lang={lang} />
              <LanguageSwitcher lang={lang} />
              {scrolled && stars && (
                <a
                  href={`https://github.com/bedrud-ir/bedrud`}
                  target="_blank"
                  rel="noreferrer"
                  className="ms-1.5 inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {stars}
                </a>
              )}
              <Button
                size="sm"
                className={cn(
                  "ms-1.5 rounded-md px-4 transition-all duration-300 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                  scrolled &&
                    "bg-emerald-600 shadow-md shadow-emerald-600/20 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
                )}
                asChild
              >
                <a href={`/${lang}/docs`}>{t(lang, "nav.getStarted")}</a>
              </Button>
            </div>

            <div className="flex items-center gap-0.5 md:hidden">
              <ThemeToggle lang={lang} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
                <span className="sr-only">{t(lang, "a11y.openMenu")}</span>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {mobileOpen && (
        <MobileMenu onClose={() => setMobileOpen(false)} lang={lang} />
      )}
    </>
  );
}
