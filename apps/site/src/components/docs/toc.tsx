import * as React from "react";
import { cn } from "~/lib/utils";
import { type Locale, t } from "../../i18n/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocProps {
  lang: Locale;
  className?: string;
}

function Toc({ lang, className }: TocProps) {
  const [items, setItems] = React.useState<TocItem[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const headings = document.querySelectorAll("h2, h3");
    const tocItems: TocItem[] = [];
    const seenIds = new Set<string>();

    headings.forEach((heading) => {
      const text = heading.textContent || "";
      let id = heading.id || "";

      if (!id) {
        id = text
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

        if (seenIds.has(id)) {
          let counter = 1;
          while (seenIds.has(`${id}-${counter}`)) counter++;
          id = `${id}-${counter}`;
        }

        heading.id = id;
      }

      seenIds.add(id);
      tocItems.push({
        id,
        text,
        level: parseInt(heading.tagName[1], 10),
      });
    });

    setItems(tocItems);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -66%" },
    );

    headings.forEach((heading) => {
      observer.observe(heading);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <aside className={cn("hidden xl:block", className)}>
      <div className="scroll-area h-[calc(100vh-4rem)] py-6">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            {t(lang, "docs.onThisPage")}
          </h4>
          <nav className="space-y-2">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "block py-0.5 text-sm transition-colors",
                  item.level === 3 ? "ps-6" : "",
                  activeId === item.id
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}

export { Toc };
