import { ArrowLeft } from "lucide-react";
import { sections } from "@/content/docs/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { cn } from "~/lib/utils";
import { type Locale, t } from "../../i18n/utils";

interface SidebarProps {
  lang: Locale;
  currentSlug?: string;
}

function Sidebar({ lang, currentSlug = "" }: SidebarProps) {
  const activeSection = sections.find((section) =>
    section.items.some((item) => item.slug === currentSlug),
  );

  const openSections = activeSection ? [activeSection.title] : [];

  return (
    <aside className="border-e" suppressHydrationWarning>
      <div className="scroll-area h-[calc(100vh-4rem)] py-6 pe-4">
        <div className="space-y-3">
          <div className="pb-4">
            <a
              href={`/${lang}`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>{t(lang, "docs.backToHome")}</span>
            </a>
          </div>
          <div className="pb-4">
            <h3 className="px-4 text-sm font-semibold">
              {t(lang, "docs.documentation")}
            </h3>
          </div>
          <Accordion
            type="multiple"
            defaultValue={openSections}
            className="space-y-2"
          >
            {sections.map((section) => (
              <AccordionItem key={section.title} value={section.title}>
                <AccordionTrigger className="ps-4 py-2 text-sm font-semibold hover:no-underline">
                  {t(lang, `docs.sections.${section.titleKey}`)}
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-0">
                  <nav className="space-y-1.5">
                    {section.items.map((item) => {
                      const isActive = item.slug === currentSlug;
                      return (
                        <a
                          key={item.slug}
                          href={`/${lang}/docs/${item.slug}`}
                          className={cn(
                            "block rounded-md ps-5 pe-3 py-2 text-sm transition-colors ms-2",
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                          )}
                        >
                          {t(lang, `docs.sidebarItems.${item.slug}`)}
                        </a>
                      );
                    })}
                  </nav>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </aside>
  );
}

export { Sidebar };
