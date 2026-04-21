import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { rehypeCodeLtr } from "./scripts/rehype-code-ltr";

const locales = [
  "en",
  "de",
  "fr",
  "es",
  "zh",
  "ja",
  "tr",
  "fa",
  "ar",
  "ru",
] as const;

const localeChunks = Object.fromEntries(
  locales.map((lang) => [
    lang,
    (item: { url: string }) => {
      const path = new URL(item.url).pathname;
      return path.startsWith(`/${lang}/`) ? item : undefined;
    },
  ]),
);

export default defineConfig({
  compressHTML: true,
  output: "static",
  site: "https://bedrud.org",
  srcDir: "./src",
  integrations: [
    icon({
      include: {
        lucide: ["*"],
      },
    }),
    react(),
    mdx(),
    sitemap({
      chunks: localeChunks,
      filter: (page) => page !== "https://bedrud.org/",
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en-US",
          de: "de-DE",
          fr: "fr-FR",
          es: "es-ES",
          zh: "zh-CN",
          ja: "ja-JP",
          tr: "tr-TR",
          fa: "fa-IR",
          ar: "ar-SA",
          ru: "ru-RU",
        },
      },
      serialize(item) {
        const path = new URL(item.url).pathname;
        if (path === "/en" || path === "/en/") {
          if (item.links && !item.links.some((l) => l.lang === "x-default")) {
            const enLink = item.links.find(
              (l) => l.lang === "en-US" || l.lang === "en",
            );
            if (enLink) {
              item.links.push({ lang: "x-default", url: enLink.url });
            }
          }
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          themes: { light: "github-light", dark: "github-dark" },
          defaultTheme: "dark",
        },
      ],
      rehypeCodeLtr,
    ],
    syntaxHighlight: false,
    remarkPlugins: [remarkGfm],
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "de", "fr", "es", "zh", "ja", "tr", "fa", "ar", "ru"],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
