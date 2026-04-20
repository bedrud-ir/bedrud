import type { DocMeta } from "./meta";

export interface SidebarItem extends DocMeta {
  slug: string;
}

export interface SidebarSection {
  title: string;
  titleKey: string;
  items: SidebarItem[];
}

export const sections: SidebarSection[] = [
  {
    title: "Getting Started",
    titleKey: "gettingStarted",
    items: [
      {
        slug: "getting-started/quickstart",
        title: "Quick Start",
        description:
          "Deploy Bedrud and join a video meeting in under 5 minutes",
        order: 1,
      },

      {
        slug: "getting-started/installation",
        title: "Server Installation",
        description: "Install Bedrud server on Linux",
        order: 2,
      },
      {
        slug: "getting-started/clients",
        title: "Client Installation",
        description: "Install desktop and mobile apps",
        order: 3,
      },
      {
        slug: "getting-started/configuration",
        title: "Configuration",
        description: "Configure Bedrud for your needs",
        order: 4,
      },
      {
        slug: "getting-started/cli-installer",
        title: "CLI Installer",
        description: "One-command install for all platforms",
        order: 5,
      },
      {
        slug: "getting-started/cli-reference",
        title: "CLI Reference",
        description: "Command-line interface documentation",
        order: 6,
      },
    ],
  },
  {
    title: "Architecture",
    titleKey: "architecture",
    items: [
      {
        slug: "architecture/overview",
        title: "Architecture Overview",
        description: "High-level system architecture of the Bedrud platform",
        order: 6,
      },
      {
        slug: "architecture/server",
        title: "Server Architecture",
        description: "Backend server design and components",
        order: 7,
      },
      {
        slug: "architecture/web",
        title: "Web Frontend",
        description: "React web application architecture",
        order: 8,
      },
      {
        slug: "architecture/android",
        title: "Android App",
        description: "Native Android application",
        order: 9,
      },
      {
        slug: "architecture/ios",
        title: "iOS App",
        description: "Native iOS application",
        order: 10,
      },
      {
        slug: "architecture/desktop",
        title: "Desktop App",
        description: "Rust-based desktop application",
        order: 11,
      },
      {
        slug: "architecture/agents",
        title: "Bot Agents",
        description: "Python bots for streaming content",
        order: 12,
      },
      {
        slug: "architecture/webrtc-connectivity",
        title: "WebRTC Connectivity",
        description: "STUN/ICE/TURN and media routing",
        order: 13,
      },
      {
        slug: "architecture/turn-server",
        title: "TURN Server",
        description: "TURN relay configuration",
        order: 14,
      },
    ],
  },
  {
    title: "Backend",
    titleKey: "backend",
    items: [
      {
        slug: "backend/overview",
        title: "Backend Documentation",
        description: "Overview of the Bedrud backend system architecture",
        order: 15,
      },
      {
        slug: "backend/structure",
        title: "Code Structure",
        description: "Backend code organization",
        order: 16,
      },
      {
        slug: "backend/database",
        title: "Database & Models",
        description: "Data models and database schema",
        order: 17,
      },
      {
        slug: "backend/authentication",
        title: "Authentication",
        description: "Auth implementation details",
        order: 18,
      },
      {
        slug: "backend/api-handlers",
        title: "API Handlers",
        description: "REST API endpoint implementations",
        order: 19,
      },
      {
        slug: "backend/livekit",
        title: "LiveKit Integration",
        description: "WebRTC media server integration",
        order: 20,
      },
      {
        slug: "backend/deployment",
        title: "Deployment",
        description: "Backend deployment strategies",
        order: 21,
      },
      {
        slug: "backend/advanced",
        title: "Advanced Topics",
        description: "Advanced backend features",
        order: 22,
      },
    ],
  },
  {
    title: "API",
    titleKey: "api",
    items: [
      {
        slug: "api/authentication",
        title: "Authentication API",
        description: "Auth endpoints and methods",
        order: 23,
      },
      {
        slug: "api/rooms",
        title: "Rooms API",
        description: "Room management endpoints",
        order: 24,
      },
      {
        slug: "api/admin",
        title: "Admin API",
        description: "Administrative operations",
        order: 25,
      },
      {
        slug: "api/passkeys",
        title: "Passkeys API",
        description: "FIDO2/WebAuthn integration",
        order: 26,
      },
    ],
  },
  {
    title: "Guides",
    titleKey: "guides",
    items: [
      {
        slug: "guides/development",
        title: "Development Workflow",
        description: "Set up development environment",
        order: 27,
      },
      {
        slug: "guides/deployment",
        title: "Deployment Guide",
        description: "Deploy Bedrud to production",
        order: 28,
      },
      {
        slug: "guides/docker",
        title: "Docker Guide",
        description: "Run Bedrud with Docker",
        order: 29,
      },
      {
        slug: "guides/internal-tls",
        title: "Internal TLS",
        description: "Self-signed certificates for internal networks",
        order: 30,
      },
      {
        slug: "guides/makefile",
        title: "Makefile Reference",
        description: "Build automation commands",
        order: 31,
      },
      {
        slug: "guides/packages",
        title: "Package Installation",
        description: "Install from package managers",
        order: 32,
      },
      {
        slug: "guides/appliance",
        title: "Appliance Mode",
        description: "Pre-configured appliance setup",
        order: 33,
      },
    ],
  },
  {
    title: "Contributing",
    titleKey: "contributing",
    items: [
      {
        slug: "contributing",
        title: "Contributing",
        description: "How to contribute to Bedrud",
        order: 34,
      },
    ],
  },
];

export const sidebar = sections.flatMap((section) => section.items);

const sidebarMap = new Map<string, { item: SidebarItem; index: number }>(
  sidebar.map((item, index) => [item.slug, { item, index }]),
);

export function getPreviousDoc(slug: string): SidebarItem | undefined {
  const index = sidebarMap.get(slug)?.index;
  return index !== undefined && index > 0 ? sidebar[index - 1] : undefined;
}

export function getNextDoc(slug: string): SidebarItem | undefined {
  const index = sidebarMap.get(slug)?.index;
  return index !== undefined && index < sidebar.length - 1
    ? sidebar[index + 1]
    : undefined;
}
