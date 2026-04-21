import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import type { Locale } from "~/i18n/utils";
import { t } from "~/i18n/utils";
import { cn } from "~/lib/utils";

function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: "light" | "dark") {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta)
    meta.setAttribute("content", theme === "dark" ? "#09090b" : "#ffffff");
}

export function ThemeToggle({
  lang,
  className,
}: {
  lang: Locale;
  className?: string;
}) {
  const [theme, setTheme] = useState<"light" | "dark">(getTheme);

  useEffect(() => {
    setTheme(getTheme());

    const observer = new MutationObserver(() => {
      setTheme(getTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const newTheme = theme === "light" ? "dark" : "light";
    const { clientX: x, clientY: y } = event;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!document.startViewTransition || prefersReducedMotion) {
      applyTheme(newTheme);
      setTheme(newTheme);
      return;
    }

    document.documentElement.style.setProperty("--x", `${x}px`);
    document.documentElement.style.setProperty("--y", `${y}px`);
    document.documentElement.classList.add("theme-transitioning");

    const transition = document.startViewTransition(() => {
      applyTheme(newTheme);
      setTheme(newTheme);
    });
    transition.finished.then(() => {
      document.documentElement.classList.remove("theme-transitioning");
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={t(lang, "a11y.toggleTheme")}
      className={cn("cursor-pointer", className)}
    >
      <Sun className="size-4 block dark:hidden" />
      <Moon className="size-4 hidden dark:block" />
    </Button>
  );
}
