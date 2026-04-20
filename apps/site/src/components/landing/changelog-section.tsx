import { useEffect, useState } from "react";
import { type Locale, t } from "../../i18n/utils";
import { GITHUB_REPO, GITHUB_URL } from "../../lib/config";

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string;
}

interface ChangelogSectionProps {
  lang: Locale;
}

export default function ChangelogSection({ lang }: ChangelogSectionProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=20`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setReleases(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t(lang, "changelogPage.title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t(lang, "changelogPage.subtitle")}
          </p>
        </div>

        <div className="mt-12">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="size-8 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border bg-destructive/10 p-6 text-center">
              <p className="text-sm text-destructive">
                {t(lang, "changelogPage.error")}
              </p>
            </div>
          )}

          {!loading && !error && releases.length === 0 && (
            <p className="text-center text-muted-foreground">
              {t(lang, "changelogPage.noReleases")}
            </p>
          )}

          {!loading && !error && releases.length > 0 && (
            <div className="space-y-8">
              {releases.map((release) => (
                <article
                  key={release.tag_name}
                  className="rounded-lg border bg-card p-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {release.name || release.tag_name}
                    </h2>
                    <time className="text-sm text-muted-foreground">
                      {new Date(release.published_at).toLocaleDateString()}
                    </time>
                  </div>
                  {release.body && (
                    <div className="mt-4 prose prose-sm prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap">
                      {release.body}
                    </div>
                  )}
                  <div className="mt-4">
                    <a
                      href={release.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {t(lang, "changelogPage.viewRelease")}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <a
            href={`${GITHUB_URL}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            {t(lang, "changelogPage.viewOnGithub")}
          </a>
        </div>
      </div>
    </section>
  );
}
