import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { type Locale, t } from "../../i18n/utils";

const faqKeys = [
  "serverPower",
  "installCommand",
  "recordingScreenSharing",
  "migrate",
  "pricing",
  "mobile",
] as const;

export function FaqSection({ lang }: { lang: Locale }) {
  return (
    <section id="faq" className="relative scroll-mt-20 section-y">
      <div className="section-container">
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t(lang, "faq.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t(lang, "faq.subtitle")}
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="mx-auto mt-14 max-w-3xl"
        >
          {faqKeys.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="text-left text-[17px] hover:no-underline hover:text-foreground">
                {t(lang, `faq.${key}.question`)}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                {t(lang, `faq.${key}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
