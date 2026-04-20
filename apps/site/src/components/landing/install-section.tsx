import { Check, Copy, ExternalLink } from "lucide-react";
import { useCallback, useState } from "react";
import { type Locale, t } from "../../i18n/utils";
import { GITHUB_URL } from "../../lib/config";
import { cn } from "../../lib/utils";

export function InstallSection({ lang }: { lang: Locale }) {
  const [copied, setCopied] = useState(false);
  const [copiedPs, setCopiedPs] = useState(false);
  const [copiedDocker, setCopiedDocker] = useState(false);
  const [tab, setTab] = useState<"bash" | "powershell">("bash");

  const copy = useCallback(
    async (text: string, setter: (v: boolean) => void) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setter(true);
      setTimeout(() => setter(false), 2000);
    },
    [],
  );

  return (
    <section id="install" className="scroll-mt-20 section-y">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t(lang, "install.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t(lang, "install.subtitle")}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("bash")}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === "bash"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              macOS / Linux
            </button>
            <button
              type="button"
              onClick={() => setTab("powershell")}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === "powershell"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              Windows
            </button>
          </div>

          {tab === "bash" ? (
            <button
              type="button"
              onClick={() => copy(t(lang, "install.command"), setCopied)}
              className="group flex w-full items-center justify-between gap-4 rounded-xl bg-card p-6 text-start shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] transition-[shadow] hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.12),0px_2px_4px_rgba(0,0,0,0.04)] dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.1)] dark:hover:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.14),0px_2px_4px_rgba(0,0,0,0.2)]"
              dir="ltr"
            >
              <code className="font-mono text-sm text-muted-foreground">
                <span className="text-emerald-500">$</span>{" "}
                {t(lang, "install.command")}
              </code>
              <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
                {copied ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                copy(t(lang, "install.powershellCommand"), setCopiedPs)
              }
              className="group flex w-full items-center justify-between gap-4 rounded-xl bg-card p-6 text-start shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] transition-[shadow] hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.12),0px_2px_4px_rgba(0,0,0,0.04)] dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.1)] dark:hover:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.14),0px_2px_4px_rgba(0,0,0,0.2)]"
              dir="ltr"
            >
              <code className="font-mono text-sm text-muted-foreground">
                <span className="text-blue-500">PS&gt;</span>{" "}
                {t(lang, "install.powershellCommand")}
              </code>
              <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
                {copiedPs ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </span>
            </button>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {t(lang, "install.whatItDoes")}
          </p>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>{t(lang, "install.or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={() =>
              copy(t(lang, "install.dockerCommand"), setCopiedDocker)
            }
            className="group flex w-full items-center justify-between gap-4 rounded-xl bg-card p-6 text-start shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] transition-[shadow] hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.12),0px_2px_4px_rgba(0,0,0,0.04)] dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.1)] dark:hover:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.14),0px_2px_4px_rgba(0,0,0,0.2)]"
            dir="ltr"
          >
            <code className="font-mono text-sm text-muted-foreground">
              <span className="text-blue-500">$</span>{" "}
              {t(lang, "install.dockerCommand")}
            </code>
            <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
              {copiedDocker ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </span>
          </button>

          <div className="mt-2 overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-start font-medium">
                    {t(lang, "install.flagsTitle")}
                  </th>
                  <th className="px-4 py-2 text-start font-medium">
                    {t(lang, "install.flagsDesc")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">
                    --version &lt;tag&gt;
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {t(lang, "install.flagVersion")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">
                    --install-dir &lt;path&gt;
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {t(lang, "install.flagInstallDir")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">--skip-shell</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {t(lang, "install.flagSkipShell")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <a
              href={`/${lang}/docs/getting-started/cli-installer`}
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t(lang, "install.fullDocsLink")}
            </a>
            <span aria-hidden="true">&middot;</span>
            <a
              href={`/${lang}/docs/getting-started/installation`}
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t(lang, "install.fullServerDocsLink")}
            </a>
            <span aria-hidden="true">&middot;</span>
            <a
              href={`/${lang}/docs/guides/docker`}
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t(lang, "install.dockerGuideLink")}
            </a>
          </div>

          <a
            href={`${GITHUB_URL}/releases/latest`}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
            {t(lang, "install.githubReleases")}
          </a>
        </div>
      </div>
    </section>
  );
}
