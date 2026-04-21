import { Copy, Link, Send } from "lucide-react";
import { Button } from "~/components/ui/button";
import { type Locale, t } from "../../../i18n/utils";

export function InviteMockup({ lang }: { lang: Locale }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl bg-card p-6 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)] dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.06),0px_2px_2px_rgba(0,0,0,0.2)]"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/15">
          <Link
            className="size-4 text-blue-600 dark:text-blue-400"
            strokeWidth={1.5}
          />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">
          {t(lang, "mockups.invite.shareLink")}
        </span>
      </div>

      <div
        dir="ltr"
        className="mt-4 flex items-center gap-2 rounded-md bg-secondary px-3.5 py-2.5"
      >
        <span className="flex-1 truncate font-mono text-sm text-muted-foreground">
          bedrud.org/m/x7k2p9
        </span>
        <Button variant="default" size="icon-sm" className="shrink-0">
          <Copy className="size-3.5" />
        </Button>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="default" size="sm" className="gap-1.5">
          <Send className="size-3.5" />
          {t(lang, "mockups.invite.sendEmail")}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Copy className="size-3.5 text-muted-foreground" />
          {t(lang, "mockups.invite.copyLink")}
        </Button>
      </div>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">
          {t(lang, "mockups.invite.or")}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-medium">
          {t(lang, "mockups.invite.meetingTitle")}
        </span>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{t(lang, "mockups.invite.today")}</span>
          <span>{t(lang, "mockups.invite.duration")}</span>
          <span>{t(lang, "mockups.invite.participants")}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {t(lang, "mockups.invite.noAccount")}
        </div>
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {t(lang, "mockups.invite.anyBrowser")}
        </div>
      </div>
    </div>
  );
}
