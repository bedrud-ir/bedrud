export default {
  meta: {
    title: "Bedrud - Talk to people, not the platform",
    description:
      "Self-hosted video meetings. Single binary. 512MB RAM. Open source under Apache 2.0.",
  },
  nav: {
    home: "Home",
    features: "Features",
    compare: "Feature",
    platforms: "Platforms",
    openSource: "Open Source",
    install: "Install",
    download: "Download",
    blog: "Blog",
    docs: "Docs",
    community: "Community",
    demo: "Demo",
    getStarted: "Get Started",
  },
  hero: {
    badge: "Open Source · Apache 2.0",
    kicker: "The self-hosted video platform. $5/month. 60-second deploy.",
    headline: "Own Your Meetings. Own Your Infrastructure. Own Your Data.",
    subheadline:
      "Stop paying per seat for video calls. Self-host Bedrud on any $5 VPS in 60 seconds. One binary, unlimited users, zero vendor lock-in.",
    trustBar:
      "Trusted by over 10,000 privacy-first developers and teams worldwide.",
    installMicrocopy: "Paste in your terminal. Deploy in 60 seconds.",
    tryDemo: "Try Without Installing",
    installNow: "Copy install command",
    objectionBullets: {
      screenSharing: "Screen sharing & recording",
      sso: "SSO & OIDC integration",
      webrtc: "WebRTC-powered, sub-second latency",
    },
    viewOnGithub: "View on GitHub",
    copied: "Copied!",
    stars: "1.2k",
    starsLabel: "GitHub stars",
    contributorsLabel: "contributors",
    license: "Apache 2.0 Licensed",
  },
  journey: {
    title: "From Zero to Meeting in Minutes",
    subtitle:
      "Install. Share a link. Start talking. Here's what that looks like.",
    install: {
      title: "Grab Your Server & Run One Command",
      description:
        "Any $5 VPS with 1GB RAM. Paste the install script into your terminal. Sixty seconds later, Bedrud is running. No Docker, no config files, no cloud vendor lock-in.",
    },
    invite: {
      title: "Share the Link",
      description:
        "Send a meeting link to your team. No accounts, no app installs, no extensions. Guests click and join from any browser instantly.",
    },
    host: {
      title: "Start Hosting Meetings",
      description:
        "Sub-second WebRTC video with built-in noise suppression, even on slow connections. Screen sharing, recording, and real-time chat - all included.",
    },
  },
  problem: {
    title: "Your Meetings Shouldn't Cost This Much",
    subtitle:
      "Enterprise video platforms have been overcharging teams for years. Here's what's wrong - and why developers are switching.",
    perSeatPricing: {
      title: "Per-Seat Pricing Is a Trap",
      description:
        "Zoom, Teams, Meet - they all charge per user. Grow from 10 to 100 people and your bill 10x's. Multiply that across departments, contractors, and guests and you're bleeding budget on a tool people use 30 minutes a day.",
    },
    vendorLockIn: {
      title: "Vendor Lock-In Kills Leverage",
      description:
        "Your meeting recordings, transcripts, participant data - all stored on servers you don't control. When a provider changes pricing, drops features, or gets breached, you have no exit strategy.",
    },
    selfHostedNightmare: {
      title: "Self-Hosted Options Are a Nightmare",
      description:
        "Jitsi needs 8+ Docker containers. BigBlueButton wants 8GB RAM. Neither installs in under an hour, neither scales simply, and debugging either one on a Friday afternoon is not how you want to spend your week.",
    },
  },
  comparison: {
    title: "See How Bedrud Compares",
    subtitle: "One binary. A fraction of the resources. All the features.",
    feature: "Feature",
    bedrud: "Bedrud",
    jitsi: "Jitsi Meet",
    bbb: "BigBlueButton",
    sections: {
      deployment: "Deployment",
      features: "Features",
      integrations: "Integrations & Scale",
      licensing: "Licensing & Community",
    },
    rows: {
      deploy: "Setup",
      deployBedrud: "Single binary",
      deployJitsi: "Docker Compose (8+ containers)",
      deployBbb: "Minimum 8GB RAM server",
      ram: "RAM Usage",
      ramBedrud: "512 MB",
      ramJitsi: "~2 GB",
      ramBbb: "~4 GB+",
      install: "Install Time",
      installBedrud: "< 1 minute",
      installJitsi: "~15 minutes",
      installBbb: "~30 minutes + config",
      nativeClients: "Platforms",
      nativeClientsBedrud: "Web, Android, iOS",
      nativeClientsJitsi: "Web, Android, iOS",
      nativeClientsBbb: "Web only",
      guestJoin: "Instant Guest Access",
      guestJoinBedrud: "Instant",
      guestJoinJitsi: "Yes",
      guestJoinBbb: "Moderator approval needed",
      audioProcessing: "Noise Cancellation",
      audioProcessingBedrud: "Advanced",
      audioProcessingJitsi: "Basic",
      audioProcessingBbb: "Basic",
      screenShare: "Screen Sharing",
      screenShareBedrud: "Built-in",
      screenShareJitsi: "Built-in",
      screenShareBbb: "Built-in",
      recording: "Recording",
      recordingBedrud: "Server-side recording",
      recordingJitsi: "Via Jibri (extra setup)",
      recordingBbb: "Built-in + notes export",
      sipIntegration: "SIP / Phone Dial-in",
      sipIntegrationBedrud: "No",
      sipIntegrationJitsi: "SIP/Jibri gateway",
      sipIntegrationBbb: "SIP gateway",
      whiteboard: "Whiteboard",
      whiteboardBedrud: "No",
      whiteboardJitsi: "No",
      whiteboardBbb: "Built-in whiteboard",
      maxUsers: "Max Concurrent Users",
      maxUsersBedrud: "50+ per room",
      maxUsersJitsi: "100+ with tuning",
      maxUsersBbb: "300+ per room",
      license: "License",
      licenseBedrud: "Apache 2.0",
      licenseJitsi: "Apache 2.0",
      licenseBbb: "LGPL 3.0",
      communitySize: "Community & Ecosystem",
      communitySizeBedrud: "Growing",
      communitySizeJitsi: "Large, mature",
      communitySizeBbb: "Large, academic",
    },
  },
  features: {
    title: "Everything You Need. Nothing You Don't.",
    subtitle:
      "From 2-person calls to 20,000-viewer broadcasts. Same binary, your hardware, zero bloat.",
    oneCommandDeploy: {
      title: "One-Command Deployment",
      description:
        "Single binary, zero dependencies. Paste one line in your terminal and Bedrud is running in 60 seconds. No Docker, no Kubernetes, no ops team required.",
    },
    fiveDollarVps: {
      title: "Runs on a $5 VPS",
      description:
        "~200MB RAM idle (512MB min). Deploy on any cheap VPS - Hetzner, DigitalOcean, AWS Lightsail, your own hardware. Same features, fraction of the cost.",
    },
    webrtcLatency: {
      title: "WebRTC Sub-Second Latency",
      description:
        "Built-in WebRTC media server with adaptive bitrate. Crystal-clear video and audio even on spotty connections. No proxying through third-party servers.",
    },
    enterpriseSso: {
      title: "Enterprise SSO & OIDC",
      description:
        "Connect to your identity provider in minutes. Passkeys, OAuth 2.0, OIDC - all supported out of the box. No password databases to breach.",
    },
    guestJoin: {
      title: "Guest Join — No Account Needed",
      description:
        "Share a link, they click, they're in. No sign-up forms, no passwords, no app installs. Works in any modern browser.",
    },
    recording: {
      title: "Built-in Recording & Screen Share",
      description:
        "Record meetings and share your screen out of the box. Recordings are saved to your server — not someone else's cloud.",
    },
  },
  install: {
    title: "One Command. Done.",
    subtitle: "One command. Sixty seconds. You're in.",
    command: "curl -fsSL https://get.bedrud.org | bash",
    powershellCommand: "irm https://get.bedrud.org/install.ps1 | iex",
    dockerCommand: "docker pull ghcr.io/bedrud-ir/bedrud:latest",
    or: "or",
    whatItDoes:
      "Downloads the Bedrud CLI binary to ~/bin and adds it to your PATH.",
    flagsTitle: "Key Flags",
    flagsDesc: "Description",
    flagVersion: "Install a specific version (e.g. 0.12.0)",
    flagInstallDir: "Custom install directory (default: ~/bin)",
    flagSkipShell: "Skip modifying shell config files",
    requirements:
      "Works on any 64-bit Linux, macOS, or Windows machine with 512MB RAM (~200MB idle).",
    fullDocsLink: "Full CLI installer docs",
    fullServerDocsLink: "Full server installation guide",
    dockerGuideLink: "Docker setup guide",
    githubReleases: "Download binary from GitHub Releases",
  },
  platforms: {
    title: "Native Apps, Not Web Wrappers",
    subtitle:
      "Real native apps - React on web, Kotlin on Android, Swift on iOS, Rust on desktop, Go on the server. No Electron, no Cordova, no compromises.",
    web: {
      title: "Web",
      tech: "React + TypeScript",
    },
    android: {
      title: "Android",
      tech: "Kotlin + Compose",
    },
    ios: {
      title: "iOS",
      tech: "Swift + SwiftUI",
    },
    desktop: {
      title: "Desktop",
      tech: "Rust + Slint",
    },
    server: {
      title: "Server",
      tech: "Go + WebRTC",
    },
    bots: {
      title: "Bots",
      tech: "Python SDK",
    },
    status: "Production",
  },
  openSource: {
    title: "Read the Source. Run the Show.",
    subtitle:
      "Every line of code is public. Inspect it, audit it, contribute to it, or fork it and build your own. Apache 2.0 licensed - use it commercially or otherwise.",
    license: "Apache 2.0",
    github: "View on GitHub",
    docs: "Read the Docs",
  },
  cta: {
    title: "Stop Renting Your Meetings",
    subtitle:
      "Deploy on any $5 VPS in 60 seconds. No credit card, no vendor lock-in, no third-party servers.",
    installNow: "Deploy Your Server",
    getStarted: "Get Bedrud Running in 60s",
    readDocs: "View Quickstart",
    starGithub: "Star on GitHub",
    copied: "Copied!",
  },
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Straight answers to the questions developers actually ask.",
    serverPower: {
      question: "How powerful does my server need to be?",
      answer:
        "A $5/month VPS with 1GB RAM is enough to get started. Bedrud uses 512MB RAM and scales with your hardware. For 50+ concurrent users, bump to 2GB. No GPU required.",
    },
    installCommand: {
      question: "What does the install command actually do?",
      answer:
        "It downloads the Bedrud binary for your platform and places it in /usr/local/bin. No Docker, no package managers, no hidden dependencies. You can inspect the script before running it.",
    },
    recordingScreenSharing: {
      question: "Does it support recording and screen sharing?",
      answer:
        "Yes. Built-in screen sharing and meeting recording are included. Recordings are saved to your server - not someone else's cloud. Bot agents can also transcribe meetings in real-time.",
    },
    migrate: {
      question: "Can I switch from Zoom or Teams?",
      answer:
        "Yes. Bedrud runs alongside your existing tools. Import your team, set up SSO, and start migrating meetings at your own pace. No data lock-in, ever.",
    },
    pricing: {
      question: "Is it really free?",
      answer:
        "Completely. Apache 2.0 licensed, no feature gates, no 'contact sales' buttons. The source code is public. Host it yourself and pay only for your server — typically $5/month.",
    },
    mobile: {
      question: "Do you have mobile apps?",
      answer:
        "Yes. Native apps for Android (Kotlin) and iOS (Swift), plus desktop apps built with Rust. Not web wrappers — real native performance.",
    },
  },
  footer: {
    brand: "Bedrud",
    tagline:
      "Video meetings for teams that care about privacy. Self-hosted or cloud.",
    platform: "Platform",
    features: "Features",
    compare: "Comparison",
    demo: "Live Demo",
    docs: "Documentation",
    api: "API Reference",
    install: "Install",
    download: "Download",
    about: "About",
    resources: "Resources",
    blog: "Blog",
    changelog: "Changelog",
    contribute: "Contribute",
    reportIssue: "Report an Issue",
    contact: "Contact",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    social: {
      github: "GitHub",
      twitter: "X (Twitter)",
    },
  },
  featuresPage: {
    meta: {
      title: "Features - Bedrud",
      description:
        "Self-hosted video meetings with built-in WebRTC, TURN server, 6 auth methods, admin controls, E2E encryption, bot agents, and 5 native apps - all in one binary.",
    },
    title: "All Your Meeting Infrastructure. One Binary.",
    subtitle:
      "API server, web UI, WebRTC media server, TURN relay, and database - packaged together. Zero outbound requests after download.",
    sectionTitle: "Everything You Need, Nothing You Don't",
    sectionSubtitle:
      "Video meeting infrastructure in a single binary. No external dependencies, no per-seat billing, no vendor lock-in.",
    groups: {
      infra: "Deploy & Infrastructure",
      media: "Meetings & Media",
      access: "Access & Control",
      extend: "Extend",
    },
    learnMore: "Learn more",
    stats: {
      ram: "512MB RAM",
      binary: "1 Binary",
      auth: "6 Auth Methods",
      platforms: "5 Platforms",
    },
    guestJoin: {
      pain: "Tired of forcing guests to create accounts just for a 15-minute call?",
      title: "Guest Join - No Account Needed",
      description:
        "Share a link, they click, they're in. No sign-up forms, no passwords, no app installs. Works in any browser - Chrome, Firefox, Edge, Safari.",
    },
    singleBinary: {
      pain: "Setting up video infrastructure shouldn't take a DevOps degree.",
      title: "Single Binary Deploy",
      description:
        "One binary includes the API, web frontend, media server, TURN relay, and database. No Docker, no Redis, no Node.js runtime, no 12-step guides. Download and run.",
      snippet: "$ curl -sSL bedrud.dev/install.sh | sh",
    },
    webrtc: {
      pain: "Video calls that lag, freeze, or drop ruin meetings.",
      title: "WebRTC with Built-in TURN",
      description:
        "SFU architecture with adaptive bitrate. ~80% of connections go direct via UDP. Built-in TURN relay handles the rest - no external infrastructure needed. Sub-second latency on any connection.",
    },
    passkeys: {
      pain: "Passwords get leaked. MFA tokens get phished.",
      title: "6 Auth Methods, Zero Password Headaches",
      description:
        "FIDO2 passkeys, email/password, Google/GitHub/Twitter OAuth, and guest access. JWT tokens with automatic rotation and blacklisting. No password databases to breach.",
    },
    admin: {
      pain: "Managing a meeting platform without good tools is painful.",
      title: "Admin Dashboard & Room Controls",
      description:
        "User management, room oversight, invite tokens, and instance settings - all from a web UI. In-meeting controls: kick, mute, disable video. Role-based access with CLI-only admin promotion.",
    },
    audio: {
      pain: "Background noise in meetings is distracting and unprofessional.",
      title: "Built-in Noise Cancellation",
      description:
        "RNNoise noise suppression included. Optional Krisp integration for premium AI cancellation. Clean audio on every call, even from noisy environments.",
    },
    bots: {
      pain: "Manual meeting tasks waste time - recording, transcription, notes.",
      title: "Bot Agents",
      description:
        "Built-in agents for music streaming, radio, and video playback. Build custom agents with the Python SDK for transcription, CRM integrations, and automated workflows.",
    },
    multiPlatform: {
      pain: "Your team uses different devices. Your meeting platform should too.",
      title: "5 Native Platforms",
      description:
        "Web (React), Android (Kotlin + PiP mode), iOS (SwiftUI), and Desktop (Rust/Slint for Windows, Linux, macOS). Multi-instance support - connect to multiple servers from one app.",
    },
    e2eEncryption: {
      pain: "Meeting content passing through your server should stay private.",
      title: "End-to-End Encryption",
      description:
        "Optional E2E encryption for rooms. The server relays encrypted media - only participants can decrypt. Your infrastructure, your data, your control.",
    },
    autoTls: {
      pain: "SSL certificates shouldn't require a tutorial to set up.",
      title: "Auto-TLS & HTTPS",
      description:
        "Automatic Let's Encrypt provisioning and renewal. Self-signed certs for internal networks. Custom certificate support for private CAs and air-gapped deployments.",
    },
    airGapped: {
      pain: "What if your servers can't reach the internet?",
      title: "Air-Gapped & Offline Ready",
      description:
        "Zero outbound requests after download. SQLite embedded. Private CA guide for isolated networks. Run Bedrud on infrastructure that never touches the public internet.",
    },
  },
  demoPage: {
    meta: {
      title: "Live Demo - Bedrud",
      description:
        "Try Bedrud without installing anything. Join a live demo meeting right now.",
    },
    hero: {
      headline: "Try Bedrud Right Now",
      subtitle:
        "Join a live meeting in your browser. No account, no download, no waiting.",
    },
    cta: {
      tryNow: "Open Live Demo",
      noInstall: "No installation. No account. No commitment. Click and meet.",
    },
    preview: {
      caption: "What you'll see when you join the demo",
    },
    features: {
      instantJoin: {
        title: "Instant Join",
        description:
          "Click the link and you're in. No sign-up forms, no email verification, no app installs. Works in any modern browser.",
      },
      noAccount: {
        title: "No Account Needed",
        description:
          "Pick a display name and start talking. When you're done, close the tab. Nothing lingers.",
      },
      webrtc: {
        title: "Real WebRTC Quality",
        description:
          "The demo runs the same engine as self-hosted Bedrud. Sub-second latency, adaptive bitrate, crystal-clear audio.",
      },
      e2e: {
        title: "End-to-End Encrypted",
        description:
          "Toggle E2E encryption in the room settings. Your video and audio are encrypted before they leave your browser.",
      },
    },
    faq: {
      whatHappens: {
        question: "What happens in the demo?",
        answer:
          "You join a shared meeting room running the full Bedrud stack. Test video, audio, screen sharing, chat, and meeting controls - same as a self-hosted instance.",
      },
      dataSaved: {
        question: "Is my data saved?",
        answer:
          "No. The demo doesn't persist any data. When you leave, your session is gone. No recordings, no chat logs, nothing stored.",
      },
      duration: {
        question: "How long can I use the demo?",
        answer:
          "No time limit. Use it as long as you need to evaluate Bedrud. When you want a permanent setup, self-hosting takes 60 seconds.",
      },
      inviteOthers: {
        question: "Can I invite others to the demo?",
        answer:
          "Yes. Share the demo link with teammates and everyone joins the same room. Great way to test Bedrud with your team before deploying.",
      },
    },
    selfHost: {
      text: "Prefer to run your own server?",
      cta: "Read the install guide",
    },
  },
  changelogPage: {
    meta: {
      title: "Changelog - Bedrud",
      description: "Release history and updates for Bedrud.",
    },
    title: "Changelog",
    subtitle: "What's new in Bedrud. Activity = trust.",
    viewOnGithub: "View on GitHub",
    noReleases: "No releases yet. Check back soon!",
    error: "Failed to load releases.",
    viewRelease: "View on GitHub \u2192",
  },
  contributorsPage: {
    meta: {
      title: "Contributors - Bedrud",
      description: "Meet the people building Bedrud.",
    },
    title: "Contributors",
    subtitle: "Bedrud is built by the community.",
    joinThem: "Join Them",
    joinCta: "Contribute on GitHub",
    contributions: "contributions",
    error: "Failed to load contributors.",
  },
  contactPage: {
    meta: {
      title: "Contact - Bedrud",
      description: "Get in touch with the Bedrud team.",
    },
    title: "Contact",
    subtitle: "Reach out through any of these channels.",
    github: {
      title: "GitHub Issues",
      description: "Bug reports, feature requests, and code contributions.",
      cta: "Open an Issue",
    },
    discord: {
      title: "Community Chat",
      description:
        "Ask questions, share ideas, and get help from the community.",
      cta: "Join Discord",
    },
    email: {
      title: "Email",
      description: "For partnerships, security issues, or private inquiries.",
      cta: "Send Email",
    },
  },
  privacy: {
    meta: {
      title: "Privacy Policy - Bedrud",
      description:
        "How Bedrud handles your data. Short version: self-hosted means your data stays on your server.",
    },
    title: "Privacy Policy",
    lastUpdated: "Last updated: April 17, 2026",
    intro:
      "Bedrud is open-source video meeting software. When you self-host it, your data never touches our servers. This policy covers the bedrud.org website and the public demo instance. If you self-host Bedrud, you control your own data.",
    dataCollection: {
      title: "What We Collect",
      content:
        "On the website (bedrud.org): nothing. No cookies, no trackers, no analytics. On the public demo: your display name and IP address while you're connected. That's it. No email, no phone, no personal details. When you self-host Bedrud, all data stays on your infrastructure. We never see it.",
    },
    dataUsage: {
      title: "How We Use Data",
      content:
        "Demo connection data routes your video and audio in real-time. It's not logged, stored, or analyzed. We don't build user profiles, serve targeted ads, or sell data. Ever.",
    },
    dataStorage: {
      title: "Data Storage",
      content:
        "The public demo doesn't persist data. Disconnect and your session is gone - no recordings, no chat history. Self-hosted instances store data in SQLite on your server. You choose the backup strategy and retention policy. We have no access.",
    },
    thirdParties: {
      title: "Third-Party Services",
      content:
        "None. Bedrud makes zero outbound requests after download. No analytics, no crash reporters, no telemetry. The website loads no third-party scripts. Verify it yourself - the source is on GitHub.",
    },
    cookies: {
      title: "Cookies & Local Storage",
      content:
        "The website uses localStorage for your theme preference (dark/light) and language selection. That's it. No tracking cookies, no advertising IDs. The demo uses a session cookie that expires when you close the tab.",
    },
    yourRights: {
      title: "Your Rights",
      content:
        "Since we don't collect personal data, there's nothing to access, correct, or delete from us. Close the demo tab and your session data is already gone. Self-hosted users have full control over all data on their servers - export, backup, delete, whatever you need.",
    },
    changes: {
      title: "Changes to This Policy",
      content:
        "We'll update this page if our data practices change. Given that we collect almost nothing, changes are unlikely. The 'last updated' date at the top reflects the most recent revision.",
    },
    contact: {
      title: "Contact",
      content:
        "Questions? Open an issue on GitHub or email privacy@bedrud.com. We're also on Discord if you prefer real-time chat.",
    },
  },
  terms: {
    meta: {
      title: "Terms of Service - Bedrud",
      description:
        "Terms for using the Bedrud website and public demo. Self-hosted users are bound by the Apache 2.0 license.",
    },
    title: "Terms of Service",
    lastUpdated: "Last updated: April 17, 2026",
    intro:
      "These terms cover the bedrud.org website and the public demo instance at bedrud.xyz. If you download and self-host Bedrud, the Apache 2.0 license governs your use of the software.",
    acceptance: {
      title: "Using Bedrud Means You Accept These Terms",
      content:
        "By visiting bedrud.org or using the public demo, you agree to these terms. If you don't agree, don't use the demo. Simple.",
    },
    services: {
      title: "What Bedrud Provides",
      content:
        "We provide this website with documentation and download links, and a public demo instance for evaluating the software. The actual video meeting software is open-source under the Apache 2.0 license. Download it, modify it, run it yourself.",
    },
    accounts: {
      title: "Accounts",
      content:
        "The website doesn't require accounts. The demo doesn't require accounts. Self-hosted instances may have their own account systems - that's your call, since you run the server.",
    },
    acceptableUse: {
      title: "Don't Abuse the Demo",
      content:
        "Don't use the public demo for illegal content, spam, harassment, or anything that degrades the experience for others. We reserve the right to remove abusive users from the demo room. This doesn't apply to self-hosted instances - you set your own rules.",
    },
    intellectualProperty: {
      title: "Open Source License",
      content:
        "Bedrud is Apache 2.0 licensed. Use it, modify it, distribute it - including commercially. The Bedrud name and logo are trademarks of theMadOrg. You can use them to refer to the software, but not to misrepresent your relationship with the project.",
    },
    termination: {
      title: "Access",
      content:
        "We can revoke access to the public demo for abuse. We can take down the website if needed. But once you've downloaded the binary, it's yours under the Apache 2.0 license. We can't revoke that.",
    },
    liability: {
      title: "No Warranty",
      content:
        "Bedrud is provided as-is. We don't guarantee it works perfectly in every environment. We're not liable for downtime, data loss, or any damages from using the software. See the Apache 2.0 license for the full legal text.",
    },
    governingLaw: {
      title: "Governing Law",
      content:
        "These terms are governed by applicable law. For disputes, we prefer resolving things through GitHub issues or direct communication before involving lawyers.",
    },
    changes: {
      title: "Updates",
      content:
        "We may update these terms. If we do, we'll change the date on this page. Continued use of the demo or website after changes means you accept them.",
    },
    contact: {
      title: "Contact",
      content:
        "Questions about these terms? Email legal@bedrud.com or open an issue on GitHub.",
    },
  },
  docs: {
    documentation: "Documentation",
    onThisPage: "On this page",
    previous: "Previous",
    next: "Next",
    backToHome: "Back to home",
    searchPlaceholder: "Search docs\u2026",
    searchButton: "Search",
    noResults: "No results found",
    loading: "Loading\u2026",
    pressShortcut: "Press",
    clearSearch: "Clear search",
    searchDocs: "Search documentation",
    notFound: "Document not found",
    searchError: "Search failed. Please try again.",
    titleSuffix: " - Bedrud",
    diagramError: "Diagram render failed",
    toggleMenu: "Toggle menu",
    sections: {
      gettingStarted: "Getting Started",
      architecture: "Architecture",
      backend: "Backend",
      api: "API",
      guides: "Guides",
      contributing: "Contributing",
    },
    mdx: {
      systemdServices: {
        title: "Systemd Services",
        description: "The installer creates two systemd services:",
        headerService: "Service",
        headerCommand: "Command",
        headerPurpose: "Purpose",
        purposeApi: "API + web",
        purposeMedia: "Media server",
      },
      createAdmin: {
        title: "Promote User to Admin",
        registerViaWeb:
          "Register via the web UI at your server URL, then promote the user to admin:",
        createDirectly: "Alternatively, create a new admin user directly:",
      },
      installerSteps: {
        title: "What the Installer Does",
        description: "When you run bedrud install, the following happens:",
        headerStep: "Step",
        headerAction: "Action",
        step1Action: "Creates directories:",
        step2Action: "Copies binary to",
        step3Action: "Generates config.yaml with your settings",
        step4Action: "Generates livekit.yaml for media server",
        step5Action: "Creates two systemd services:",
        step6Action: "Enables and starts both services",
        step7Action: "Initializes SQLite database and certificate cache",
      },
    },
    sidebarItems: {
      "getting-started/quickstart": "Quick Start",
      "getting-started/cli-installer": "CLI Installer",
      "getting-started/installation": "Server Installation",
      "getting-started/clients": "Client Installation",
      "getting-started/configuration": "Configuration",
      "getting-started/cli-reference": "CLI Reference",
      "architecture/overview": "Architecture Overview",
      "architecture/server": "Server Architecture",
      "architecture/web": "Web Frontend",
      "architecture/android": "Android App",
      "architecture/ios": "iOS App",
      "architecture/desktop": "Desktop App",
      "architecture/agents": "Bot Agents",
      "architecture/webrtc-connectivity": "WebRTC Connectivity",
      "architecture/turn-server": "TURN Server",
      "backend/overview": "Backend Documentation",
      "backend/structure": "Code Structure",
      "backend/database": "Database & Models",
      "backend/authentication": "Authentication",
      "backend/api-handlers": "API Handlers",
      "backend/livekit": "LiveKit Integration",
      "backend/deployment": "Deployment",
      "backend/advanced": "Advanced Topics",
      "api/authentication": "Authentication API",
      "api/rooms": "Rooms API",
      "api/admin": "Admin API",
      "api/passkeys": "Passkeys API",
      "guides/development": "Development Workflow",
      "guides/deployment": "Deployment Guide",
      "guides/docker": "Docker Guide",
      "guides/internal-tls": "Internal TLS",
      "guides/makefile": "Makefile Reference",
      "guides/packages": "Package Installation",
      "guides/appliance": "Appliance Mode",
      contributing: "Contributing",
    },
  },
  installPage: {
    meta: {
      title: "Install Bedrud Server - One Command Deployment",
      description:
        "Deploy Bedrud on your server in under a minute. Single binary, 512MB RAM, no Docker required.",
    },
    title: "Install Bedrud Server",
    subtitle:
      "Deploy the self-hosted server on your own hardware. One binary, zero dependencies.",
  },
  downloadPage: {
    meta: {
      title: "Download Bedrud - Desktop & Mobile Apps",
      description:
        "Download Bedrud for Linux, macOS, Windows, Android, or iOS. Native apps or zero-install browser access.",
    },
    title: "Download Bedrud",
    subtitle:
      "Native apps for every platform. Or just open a meeting link in your browser.",
    noInstall: "No installation needed. Download, make executable, run.",
    flathub: "Install from Flathub",
    brew: "Install via Homebrew",
    winget: "Install via Windows Package Manager",
    installer: "Installer",
    portable: "Portable",
    repoSetup: "Repo setup required",
    appleSilicon: "Apple Silicon",
    intel: "Intel",
    githubReleases: "GitHub Releases",
    playStore: "Get it on Google Play",
    appStore: "Download on the App Store",
    sideload: "Download APK/IPA from GitHub Releases",
    browserZero: "Zero Install",
    browserDesc:
      "Open any meeting link in Chrome, Firefox, Edge, or Safari. No download required.",
    tryDemo: "Try Live Demo",
    otherPlatforms: "View all platforms and package managers",
    server: "Server Installation",
    serverDesc: "Deploy the Bedrud server on your own hardware.",
    serverGuide: "Server installation guide",
    quickInstall: "Quick install",
    heroClientTitle: "Client Version",
    heroClientDesc: "Native desktop and mobile apps for every platform.",
    heroServerTitle: "Server Version",
    heroServerDesc: "Deploy the Bedrud server on your own hardware.",
    heroAllPlatforms: "View all platforms",
    dmgAppleSilicon: "Apple Silicon (.dmg)",
    dmgIntel: "Intel (.dmg)",
    serverDocker: "Docker",
    serverDockerDesc: "Run in a container with Docker.",
    serverBinary: "Linux Binary",
    serverBinaryDesc: "Download pre-built binaries for Linux.",
    serverQuickInstall: "Quick Install",
    serverQuickInstallDesc: "One command. Under a minute.",
    serverHelm: "Kubernetes (Helm)",
    serverHelmDesc: "Deploy to Kubernetes with Helm.",
    resourcesTitle: "Resources",
    resourcesDocs: "Documentation",
    resourcesDocsDesc: "Setup guides, API reference, and how-tos.",
    resourcesCommunity: "Community",
    resourcesCommunityDesc: "Get help and share feedback.",
    resourcesChangelog: "Changelog",
    resourcesChangelogDesc: "Latest releases and changes.",
    platform: {
      linux: "Linux",
      mac: "macOS",
      windows: "Windows",
      android: "Android",
      ios: "iOS",
      browser: "Browser",
    },
  },
  aboutPage: {
    meta: {
      title: "About Bedrud",
      description:
        "Learn about the team and mission behind Bedrud - open-source video meetings for everyone.",
    },
    title: "About Bedrud",
    subtitle:
      "Open-source video meetings built by people who believe privacy should be the default.",
    mission: {
      title: "Our Mission",
      text: "Bedrud exists because video meetings shouldn't require handing your data to Big Tech. We believe a single binary, a cheap VPS, and open-source code can replace million-dollar SaaS contracts - without sacrificing quality or features. Privacy isn't a feature. It's the foundation.",
    },
    team: {
      title: "Core Team",
      subtitle: "The people behind Bedrud.",
    },
    error: "Failed to load team members.",
  },
  blog: {
    meta: {
      title: "Blog - Bedrud",
      description:
        "Updates, engineering deep-dives, and guides from the Bedrud team.",
    },
    title: "Blog",
    subtitle:
      "Updates, engineering deep-dives, and guides from the Bedrud team.",
    noPosts: "No posts yet. Check back soon!",
    backToBlog: "Back to Blog",
    titleSuffix: " - Bedrud Blog",
    defaultAuthor: "Bedrud Team",
  },
  skipToContent: "Skip to content",
  a11y: {
    toggleTheme: "Toggle theme",
    breadcrumb: "Breadcrumb",
    articleNav: "Article navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    navigationMenu: "Navigation menu",
    changeLanguage: "Change language",
    discordCommunity: "Discord community",
  },
  whyBedrud: {
    title: "Why Bedrud?",
    subtitle: "Self-hosted meetings that don't compromise.",
    noLockIn: {
      title: "No Vendor Lock-In",
      description:
        "Your data stays on your server. No proprietary formats, no forced migrations. Export everything, anytime.",
    },
    singleBinary: {
      title: "Single Binary Simplicity",
      description:
        "One file. No Docker, no Redis, no config hell. Download, run, done.",
    },
    noPerSeat: {
      title: "No Per-Seat Pricing",
      description:
        "Unlimited users on your hardware. Your $5 VPS, your rules. Scale without asking permission.",
    },
  },
  notFound: {
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist or has been moved.",
    backToHome: "Back to Home",
  },
  mobileNav: {
    navigation: "Navigation",
    language: "Language",
    getStarted: "Get Started",
    github: "GitHub",
  },
  mockups: {
    terminal: {
      title: "Terminal",
      downloading: "✓ Downloading bedrud v0.12.3...",
      installing: "✓ Installing to /usr/local/bin...",
      ready: "✓ Bedrud ready! (512MB RAM)",
    },
    invite: {
      shareLink: "Share Meeting Link",
      sendEmail: "Send via Email",
      copyLink: "Copy Link",
      or: "OR",
      meetingTitle: "Team Standup",
      today: "Today, 2:00 PM",
      duration: "30 min",
      participants: "5 participants",
      noAccount: "No account required",
      anyBrowser: "Works in any browser",
    },
    meeting: {
      title: "Team Standup",
      micOn: "Microphone on",
      cameraOn: "Camera on",
      shareScreen: "Share screen",
      raiseHand: "Raise hand",
      chat: "Chat",
      leaveCall: "Leave call",
    },
    preview: {
      title: "Team Standup",
      you: "You",
      chat: "Chat",
      messagePlaceholder: "Message...",
      chatMsg1: "Sharing the Q4 deck now",
      chatMsg2: "This looks great!",
      chatMsg3: "Can we go over slide 4?",
    },
    scale: {
      overview: "Overview",
      last30Days: "Last 30 days",
      meetings: "meetings",
      uptime: "uptime",
      availability: "availability",
      activeUsers: "Active Users",
      unlimitedUsers: "Unlimited users",
      noPerSeat: "No per-seat pricing",
      costPerSeat: "Cost per seat:",
      costFree: "$0.00",
    },
  },
};
