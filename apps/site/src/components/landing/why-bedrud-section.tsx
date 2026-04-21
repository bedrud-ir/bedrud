import { Ban, Binary, Lock } from "lucide-react";
import { type Locale, t } from "../../i18n/utils";

const cards = [
  {
    key: "noLockIn",
    icon: Lock,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
  },
  {
    key: "singleBinary",
    icon: Binary,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
  },
  {
    key: "noPerSeat",
    icon: Ban,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
  },
] as const;

export function WhyBedrudSection({ lang }: { lang: Locale }) {
  return (
    <section id="why-bedrud" className="relative scroll-mt-20 section-y">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t(lang, "whyBedrud.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t(lang, "whyBedrud.subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {cards.map(({ key, icon: Icon, color, bg }) => (
            <div
              key={key}
              className="group relative rounded-2xl bg-card p-7 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] transition-[shadow] duration-300 hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.12),0px_2px_4px_rgba(0,0,0,0.04)] dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.1)] dark:hover:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.14),0px_2px_4px_rgba(0,0,0,0.2)] sm:p-8"
            >
              <div
                className={`inline-flex size-11 items-center justify-center rounded-xl ${bg}`}
              >
                <Icon className={`size-5 ${color}`} strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight">
                {t(lang, `whyBedrud.${key}.title`)}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {t(lang, `whyBedrud.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
