import { ExternalLink, Globe } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { DISCORD_URL, GITHUB_URL, TWITTER_URL } from "~/lib/config";
import { cn } from "~/lib/utils";
import { type Locale, supportedLocales, t } from "../../i18n/utils";
import { GitHubIcon } from "./github-icon";
import { XIcon } from "./x-icon";

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  zh: "中文",
  ja: "日本語",
  tr: "Türkçe",
  fa: "فارسی",
  ar: "العربية",
  ru: "Русский",
};

export function Footer({ lang }: { lang: Locale }) {
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const switchLocale = useCallback(
    (locale: Locale) => {
      const path = window.location.pathname;
      const rest = path.replace(`/${lang}`, "");
      window.location.href = `/${locale}${rest || "/"}`;
    },
    [lang],
  );

  const linkClass =
    "text-sm text-muted-foreground transition-colors hover:text-foreground";

  return (
    <footer className="bg-muted/30 px-6 pt-16 pb-8">
      <div className="section-container">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  B
                </span>
              </div>
              <span className="text-lg font-bold tracking-tight">
                {t(lang, "footer.brand")}
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {t(lang, "footer.tagline")}
            </p>
            <div className="mt-4 flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" asChild>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t(lang, "footer.social.github")}
                >
                  <GitHubIcon className="size-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon-sm" asChild>
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t(lang, "a11y.discordCommunity")}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4"
                  >
                    <title>Discord</title>
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                </a>
              </Button>
              <Button variant="ghost" size="icon-sm" asChild>
                <a
                  href={TWITTER_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t(lang, "footer.social.twitter")}
                >
                  <XIcon className="size-4" />
                </a>
              </Button>
            </div>
            <a
              href={`/${lang}/about`}
              className={cn(linkClass, "mt-3 inline-block")}
            >
              {t(lang, "footer.about")}
            </a>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              {t(lang, "footer.platform")}
            </h4>
            <ul className="mt-3 space-y-3">
              <li>
                <a href={`/${lang}/features`} className={linkClass}>
                  {t(lang, "footer.features")}
                </a>
              </li>
              <li>
                <a href={`/${lang}/demo`} className={linkClass}>
                  {t(lang, "footer.demo")}
                </a>
              </li>
              <li>
                <a href={`/${lang}/docs`} className={linkClass}>
                  {t(lang, "footer.docs")}
                </a>
              </li>
              <li>
                <a href={`/${lang}/docs/api`} className={linkClass}>
                  {t(lang, "footer.api")}
                </a>
              </li>
              <li>
                <a href={`/${lang}/features#comparison`} className={linkClass}>
                  {t(lang, "footer.compare")}
                </a>
              </li>
              <li>
                <a href={`/${lang}/install`} className={linkClass}>
                  {t(lang, "footer.install")}
                </a>
              </li>
              <li>
                <a href={`/${lang}/download`} className={linkClass}>
                  {t(lang, "footer.download")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              {t(lang, "footer.resources")}
            </h4>
            <ul className="mt-3 space-y-3">
              <li>
                <a href={`/${lang}/blog`} className={linkClass}>
                  {t(lang, "footer.blog")}
                </a>
              </li>
              <li>
                <a href={`/${lang}/changelog`} className={linkClass}>
                  {t(lang, "footer.changelog")}
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}/blob/main/CONTRIBUTING.md`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(linkClass, "inline-flex items-center")}
                >
                  {t(lang, "footer.contribute")}
                  <ExternalLink className="ml-1 size-3" />
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}/issues/new`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(linkClass, "inline-flex items-center")}
                >
                  {t(lang, "footer.reportIssue")}
                  <ExternalLink className="ml-1 size-3" />
                </a>
              </li>
              <li>
                <a href={`/${lang}/contact`} className={linkClass}>
                  {t(lang, "footer.contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 border-t pt-6 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} bedrud-ir</span>
            <a
              href={`${GITHUB_URL}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Apache 2.0
            </a>
            <a
              href={`https://bedrud.org/sitemap-${lang}-0.xml`}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Sitemap
            </a>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <a
                href={`/${lang}/privacy`}
                className="transition-colors hover:text-foreground"
              >
                {t(lang, "footer.privacy")}
              </a>
              <a
                href={`/${lang}/terms`}
                className="transition-colors hover:text-foreground"
              >
                {t(lang, "footer.terms")}
              </a>
            </div>
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Globe className="size-4" />
                <span>{LOCALE_NAMES[lang]}</span>
              </button>
              {langOpen && (
                <div className="absolute bottom-full right-0 mb-2 rounded-lg border bg-popover p-1 shadow-md">
                  {supportedLocales.map((locale) => (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => switchLocale(locale)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                        locale === lang
                          ? "bg-accent font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <span>{LOCALE_NAMES[locale]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
