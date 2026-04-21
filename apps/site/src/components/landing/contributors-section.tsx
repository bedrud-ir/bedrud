import { useEffect, useState } from "react";
import { type Locale, t } from "../../i18n/utils";
import { GITHUB_REPO, GITHUB_URL } from "../../lib/config";

interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

interface ContributorsSectionProps {
  lang: Locale;
}

export default function ContributorsSection({
  lang,
}: ContributorsSectionProps) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contributors?per_page=50`,
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setContributors(data);
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
            {t(lang, "contributorsPage.title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t(lang, "contributorsPage.subtitle")}
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
                {t(lang, "contributorsPage.error")}
              </p>
            </div>
          )}

          {!loading && !error && contributors.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {contributors.map((contributor) => (
                <a
                  key={contributor.id}
                  href={contributor.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <img
                    src={contributor.avatar_url}
                    alt={contributor.login}
                    className="size-16 rounded-full"
                    loading="lazy"
                  />
                  <span className="text-sm font-medium group-hover:text-primary truncate w-full text-center">
                    {contributor.login}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {contributor.contributions}{" "}
                    {t(lang, "contributorsPage.contributions")}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold">
            {t(lang, "contributorsPage.joinThem")}
          </h2>
          <div className="mt-4">
            <a
              href={`${GITHUB_URL}/contributing`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t(lang, "contributorsPage.joinCta")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
