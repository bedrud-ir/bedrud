import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { GITHUB_URL } from "~/lib/config";
import { type Locale, t } from "../../i18n/utils";
import { GitHubIcon } from "./github-icon";

export function CtaSection({ lang }: { lang: Locale }) {
  return (
    <section id="cta" className="scroll-mt-20 section-y">
      <div className="section-container">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t(lang, "cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
            {t(lang, "cta.subtitle")}
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Button size="lg" asChild>
            <a
              href={`/${lang}/docs/getting-started/quickstart`}
              className="h-12 rounded-md px-8 font-mono text-sm"
            >
              <ArrowRight className="size-4" />
              {t(lang, "cta.getStarted")}
            </a>
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <GitHubIcon className="size-3.5" />
              {t(lang, "cta.starGithub")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
