import { BarChart3, ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { type Locale, t } from "../../../i18n/utils";

function getStats(lang: Locale) {
  return [
    { value: "1,247", label: t(lang, "mockups.scale.meetings") },
    { value: "99.9%", label: t(lang, "mockups.scale.uptime") },
    { value: "24/7", label: t(lang, "mockups.scale.availability") },
  ];
}

export function ScaleMockup({ lang }: { lang: Locale }) {
  const stats = getStats(lang);
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl bg-card p-6 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)] dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.06),0px_2px_2px_rgba(0,0,0,0.2)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/15">
            <BarChart3
              className="size-4 text-amber-600 dark:text-amber-400"
              strokeWidth={1.5}
            />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            {t(lang, "mockups.scale.overview")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-[13px] text-muted-foreground"
        >
          {t(lang, "mockups.scale.last30Days")}
          <ChevronDown className="size-3.5" />
        </Button>
      </div>

      <div dir="ltr" className="mt-5 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.value} className="rounded-xl bg-secondary p-3.5">
            <div className="text-2xl font-bold tracking-tight">
              {stat.value}
            </div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-medium">
            {t(lang, "mockups.scale.activeUsers")}
          </span>
          <span className="text-muted-foreground">
            847 / <span className="text-foreground font-medium">&infin;</span>
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: "72%" }}
          />
        </div>
      </div>

      <div dir="ltr" className="mt-5 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {t(lang, "mockups.scale.unlimitedUsers")}
        </div>
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {t(lang, "mockups.scale.noPerSeat")}
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="font-medium">
            {t(lang, "mockups.scale.costPerSeat")}
          </span>
          <span className="font-bold">{t(lang, "mockups.scale.costFree")}</span>
        </div>
      </div>
    </div>
  );
}
