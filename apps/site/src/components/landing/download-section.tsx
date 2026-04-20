import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  FileText,
  Globe,
  Laptop,
  MessageSquare,
  Monitor,
  Server,
  Smartphone,
  Tablet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Locale, t } from "../../i18n/utils";
import { DISCORD_URL, GITHUB_URL } from "../../lib/config";
import { cn } from "../../lib/utils";

type Platform = "linux" | "mac" | "windows" | "android" | "ios" | "browser";

const RELEASES_BASE = `${GITHUB_URL}/releases/latest`;

interface PlatformOption {
  id: Platform;
  icon: React.ElementType;
  labelKey: string;
}

const platforms: PlatformOption[] = [
  { id: "linux", icon: Monitor, labelKey: "downloadPage.platform.linux" },
  { id: "mac", icon: Laptop, labelKey: "downloadPage.platform.mac" },
  { id: "windows", icon: Monitor, labelKey: "downloadPage.platform.windows" },
  {
    id: "android",
    icon: Smartphone,
    labelKey: "downloadPage.platform.android",
  },
  { id: "ios", icon: Tablet, labelKey: "downloadPage.platform.ios" },
  { id: "browser", icon: Globe, labelKey: "downloadPage.platform.browser" },
];

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "linux";
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/mac os x/.test(ua)) return "mac";
  if (/windows/.test(ua)) return "windows";
  return "linux";
}

function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = val;
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
    <button type="button" onClick={() => copy(text)} className={className}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {label}
    </button>
  );
}

const cardClass =
  "rounded-xl bg-card p-6 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.1)]";
const btnClass =
  "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90";

function HeroCards({ lang }: { lang: Locale }) {
  return (
    <div className="mx-auto mt-4 grid max-w-5xl gap-5 sm:grid-cols-2">
      <div className={cn(cardClass, "p-8")}>
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/8">
          <ArrowDownToLine className="size-5 text-primary" />
        </div>
        <h3 className="mt-5 text-lg font-semibold">
          {t(lang, "downloadPage.heroClientTitle")}
        </h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
          {t(lang, "downloadPage.heroClientDesc")}
        </p>
        <a
          href={`${RELEASES_BASE}/download/bedrud-desktop-linux-x86_64.AppImage`}
          className={cn(btnClass, "mt-4")}
        >
          <ArrowDownToLine className="size-4" />
          .AppImage (x86_64)
        </a>
        <div className="mt-2">
          <a
            href="#platforms"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {t(lang, "downloadPage.heroAllPlatforms")}
            <span aria-hidden="true">&darr;</span>
          </a>
        </div>
      </div>
      <div className={cn(cardClass, "p-8")}>
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/8">
          <Server className="size-5 text-primary" />
        </div>
        <h3 className="mt-5 text-lg font-semibold">
          {t(lang, "downloadPage.heroServerTitle")}
        </h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
          {t(lang, "downloadPage.heroServerDesc")}
        </p>
        <a
          href={`/${lang}/docs/getting-started/installation`}
          className={cn(btnClass, "mt-4")}
        >
          <ArrowRight className="size-4" />
          {t(lang, "downloadPage.serverGuide")}
        </a>
        <div className="mt-2">
          <a
            href={`/${lang}/install`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {t(lang, "downloadPage.quickInstall")}
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function PlatformContent({
  platform,
  lang,
}: {
  platform: Platform;
  lang: Locale;
}) {
  switch (platform) {
    case "linux":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={cardClass}>
            <h4 className="font-semibold">AppImage</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(lang, "downloadPage.noInstall")}
            </p>
            <a
              href={`${RELEASES_BASE}/download/bedrud-desktop-linux-x86_64.AppImage`}
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              .AppImage (x86_64)
            </a>
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">Flatpak</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(lang, "downloadPage.flathub")}
            </p>
            <CopyButton
              text="flatpak install https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-linux-x86_64.flatpak"
              label="flatpak install"
              className={cn(btnClass, "mt-4")}
            />
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">Ubuntu / Debian</h4>
            <p className="mt-1 text-sm text-muted-foreground">apt</p>
            <CopyButton
              text="sudo apt install bedrud-desktop"
              label="apt install"
              className={cn(btnClass, "mt-4")}
            />
            <a
              href={`/${lang}/docs/guides/packages`}
              className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(lang, "downloadPage.repoSetup")}
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">Arch (AUR)</h4>
            <p className="mt-1 text-sm text-muted-foreground">yay / paru</p>
            <CopyButton
              text="yay -S bedrud-desktop-bin"
              label="yay -S bedrud-desktop-bin"
              className={cn(btnClass, "mt-4")}
            />
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">Fedora / RHEL</h4>
            <p className="mt-1 text-sm text-muted-foreground">dnf</p>
            <CopyButton
              text="sudo dnf install https://get.bedrud.org/rpm/bedrud-desktop-latest.x86_64.rpm"
              label="dnf install"
              className={cn(btnClass, "mt-4")}
            />
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">
              {t(lang, "downloadPage.portable")}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">tar.xz</p>
            <a
              href={`${RELEASES_BASE}/download/bedrud-desktop-linux-x86_64.tar.xz`}
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              tar.xz (x86_64)
            </a>
          </div>
        </div>
      );

    case "mac":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={cardClass}>
            <h4 className="font-semibold">Homebrew</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(lang, "downloadPage.brew")}
            </p>
            <CopyButton
              text="brew tap bedrud-ir/bedrud && brew install bedrud-desktop"
              label="brew install bedrud-desktop"
              className={cn(btnClass, "mt-4")}
            />
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">
              {t(lang, "downloadPage.dmgAppleSilicon")}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">arm64 .dmg</p>
            <a
              href={`${RELEASES_BASE}/download/bedrud-desktop-macos-arm64.dmg`}
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              arm64 .dmg
            </a>
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">
              {t(lang, "downloadPage.dmgIntel")}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">x86_64 .dmg</p>
            <a
              href={`${RELEASES_BASE}/download/bedrud-desktop-macos-x86_64.dmg`}
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              x86_64 .dmg
            </a>
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">
              {t(lang, "downloadPage.appleSilicon")}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">arm64 tar.gz</p>
            <a
              href={`${RELEASES_BASE}/download/bedrud-desktop-macos-arm64.tar.gz`}
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              arm64 tar.gz
            </a>
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">{t(lang, "downloadPage.intel")}</h4>
            <p className="mt-1 text-sm text-muted-foreground">x86_64 tar.gz</p>
            <a
              href={`${RELEASES_BASE}/download/bedrud-desktop-macos-x86_64.tar.gz`}
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              x86_64 tar.gz
            </a>
          </div>
        </div>
      );

    case "windows":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={cardClass}>
            <h4 className="font-semibold">WinGet</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(lang, "downloadPage.winget")}
            </p>
            <CopyButton
              text="winget install Bedrud.BedrudDesktop"
              label="winget install"
              className={cn(btnClass, "mt-4")}
            />
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">Chocolatey</h4>
            <p className="mt-1 text-sm text-muted-foreground">choco</p>
            <CopyButton
              text="choco install bedrud-desktop"
              label="choco install"
              className={cn(btnClass, "mt-4")}
            />
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">
              {t(lang, "downloadPage.installer")}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">NSIS .exe</p>
            <a
              href={`${RELEASES_BASE}/download/bedrud-desktop-windows-x86_64.exe`}
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              .exe (x86_64)
            </a>
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">
              {t(lang, "downloadPage.portable")}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">.zip</p>
            <a
              href={`${RELEASES_BASE}/download/bedrud-desktop-windows-x86_64.zip`}
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              .zip (x86_64)
            </a>
          </div>
        </div>
      );

    case "android":
      return (
        <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-2">
          <div className={cardClass}>
            <h4 className="font-semibold">Google Play</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(lang, "downloadPage.playStore")}
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=org.bedrud.app"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              Google Play
            </a>
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">APK</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(lang, "downloadPage.sideload")}
            </p>
            <a
              href={`${RELEASES_BASE}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              {t(lang, "downloadPage.githubReleases")}
            </a>
          </div>
        </div>
      );

    case "ios":
      return (
        <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-2">
          <div className={cardClass}>
            <h4 className="font-semibold">App Store</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(lang, "downloadPage.appStore")}
            </p>
            <a
              href="https://apps.apple.com/app/bedrud"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              App Store
            </a>
          </div>
          <div className={cardClass}>
            <h4 className="font-semibold">IPA</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(lang, "downloadPage.sideload")}
            </p>
            <a
              href={`${RELEASES_BASE}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(btnClass, "mt-4")}
            >
              <ArrowDownToLine className="size-4" />
              {t(lang, "downloadPage.githubReleases")}
            </a>
          </div>
        </div>
      );

    case "browser":
      return (
        <div className="mx-auto max-w-md text-center">
          <div className={cn(cardClass, "text-center")}>
            <Globe className="mx-auto size-12 text-muted-foreground" />
            <h4 className="mt-4 font-semibold">
              {t(lang, "downloadPage.browserZero")}
            </h4>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(lang, "downloadPage.browserDesc")}
            </p>
            <a href={`/${lang}/demo`} className={cn(btnClass, "mt-4")}>
              {t(lang, "downloadPage.tryDemo")}
            </a>
          </div>
        </div>
      );
  }
}

function ResourcesSection({ lang }: { lang: Locale }) {
  return (
    <div className="mt-16">
      <h3 className="text-center text-2xl font-bold tracking-tight">
        {t(lang, "downloadPage.resourcesTitle")}
      </h3>
      <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
        <a
          href={`/${lang}/docs`}
          className={cn(
            cardClass,
            "group transition-[shadow] duration-300 hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.12)]",
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/8">
            <BookOpen className="size-5 text-primary" />
          </div>
          <h4 className="mt-3 font-semibold">
            {t(lang, "downloadPage.resourcesDocs")}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(lang, "downloadPage.resourcesDocsDesc")}
          </p>
        </a>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            cardClass,
            "group transition-[shadow] duration-300 hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.12)]",
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/8">
            <MessageSquare className="size-5 text-primary" />
          </div>
          <h4 className="mt-3 font-semibold">
            {t(lang, "downloadPage.resourcesCommunity")}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(lang, "downloadPage.resourcesCommunityDesc")}
          </p>
        </a>
        <a
          href={`/${lang}/changelog`}
          className={cn(
            cardClass,
            "group transition-[shadow] duration-300 hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.12)]",
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/8">
            <FileText className="size-5 text-primary" />
          </div>
          <h4 className="mt-3 font-semibold">
            {t(lang, "downloadPage.resourcesChangelog")}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(lang, "downloadPage.resourcesChangelogDesc")}
          </p>
        </a>
      </div>
    </div>
  );
}

export function DownloadSection({ lang }: { lang: Locale }) {
  const detected = useMemo(() => detectPlatform(), []);
  const [active, setActive] = useState<Platform>(detected);

  useEffect(() => {
    setActive(detected);
  }, [detected]);

  return (
    <section className="section-y">
      <div className="section-container max-w-7xl">
        <div className="mx-auto max-w-5xl">
          <HeroCards lang={lang} />

          <div id="platforms" className="mt-10 scroll-mt-20">
            <div className="flex flex-wrap justify-center gap-2">
              {platforms.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActive(p.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      active === p.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {t(lang, p.labelKey)}
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <PlatformContent platform={active} lang={lang} />
            </div>

            <div className="mt-10 text-center">
              <a
                href={`/${lang}/docs/getting-started/clients`}
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80",
                )}
              >
                {t(lang, "downloadPage.otherPlatforms")}
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>

          <ResourcesSection lang={lang} />
        </div>
      </div>
    </section>
  );
}
