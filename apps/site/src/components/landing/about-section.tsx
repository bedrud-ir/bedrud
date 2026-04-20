import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { type Locale, t } from "../../i18n/utils";
import { GITHUB_REPO } from "../../lib/config";

interface OrgMember {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

interface AboutSectionProps {
  lang: Locale;
}

export default function AboutSection({ lang }: AboutSectionProps) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(
      `https://api.github.com/orgs/${GITHUB_REPO.split("/")[0]}/members?per_page=20`,
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setMembers(data);
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
            {t(lang, "aboutPage.title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t(lang, "aboutPage.subtitle")}
          </p>
        </div>

        <div className="mt-16 mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            {t(lang, "aboutPage.mission.title")}
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {t(lang, "aboutPage.mission.text")}
          </p>
        </div>

        <div className="mt-16">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            {t(lang, "aboutPage.team.title")}
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            {t(lang, "aboutPage.team.subtitle")}
          </p>

          <div className="mt-8">
            {loading && (
              <div className="flex justify-center py-12">
                <div className="size-8 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border bg-destructive/10 p-6 text-center">
                <p className="text-sm text-destructive">
                  {t(lang, "aboutPage.error")}
                </p>
              </div>
            )}

            {!loading && !error && members.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {members.map((member) => (
                  <a
                    key={member.id}
                    href={member.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <img
                      src={member.avatar_url}
                      alt={member.login}
                      className="size-16 rounded-full"
                      loading="lazy"
                    />
                    <span className="text-sm font-medium group-hover:text-primary truncate w-full text-center">
                      {member.login}
                    </span>
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
