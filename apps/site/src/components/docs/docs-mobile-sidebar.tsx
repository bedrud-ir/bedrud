import { Menu } from "lucide-react";
import * as React from "react";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetTrigger,
} from "~/components/ui/sheet";
import type { Locale } from "../../i18n/utils";
import { getDir, t } from "../../i18n/utils";
import { Sidebar } from "./sidebar";

interface DocsMobileSidebarProps {
  lang: Locale;
  currentSlug?: string;
}

export function DocsMobileSidebar({
  lang,
  currentSlug = "",
}: DocsMobileSidebarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="size-5" aria-hidden="true" />
          <span className="sr-only">{t(lang, "docs.toggleMenu")}</span>
        </Button>
      </SheetTrigger>
      <SheetOverlay />
      <SheetContent
        side={getDir(lang) === "rtl" ? "right" : "left"}
        className="w-3/4 max-w-sm p-0"
        closeLabel={t(lang, "a11y.closeMenu")}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <Sidebar lang={lang} currentSlug={currentSlug} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
