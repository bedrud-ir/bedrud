export default {
  meta: {
    title: "Bedrud - 随心所欲的视频会议",
    description:
      "Bedrud 是一个开源视频会议平台。自行托管或使用我们的云服务--一个集成了 Web 界面、REST API 和 WebRTC 媒体服务器的单一二进制文件。",
  },
  nav: {
    home: "首页",
    features: "功能",
    compare: "功能对比",
    platforms: "平台",
    openSource: "开源",
    docs: "文档",
    community: "社区",
    demo: "演示",
    install: "安装",
    download: "下载",
    blog: "博客",
    getStarted: "立即开始",
  },
  hero: {
    badge: "开源 · Apache 2.0",
    kicker: "开源 Zoom 替代方案。$5 VPS 即可运行。",
    headline: "你的会议。你的服务器。你的规则。",
    subheadline:
      "在你自己的硬件上托管视频会议。单个二进制文件，512MB 内存，60 秒部署。从私密通话到数千观众直播。",
    trustBar: "全球超过 10,000 名关注隐私的开发者和团队信任 Bedrud。",
    installMicrocopy: "粘贴到终端，60 秒完成部署。",
    tryDemo: "无需安装即可试用",
    installNow: "复制安装命令",
    objectionBullets: {
      screenSharing: "屏幕共享与录制",
      sso: "SSO 和 OIDC 集成",
      webrtc: "基于 WebRTC，亚秒级延迟",
    },
    getStarted: "立即开始",
    viewOnGithub: "在 GitHub 上查看",
    copied: "已复制!",
    stars: "1.2k",
    starsLabel: "GitHub 星标",
    contributorsLabel: "贡献者",
    license: "Apache 2.0 许可",
  },
  journey: {
    title: "从零到会议只需几分钟",
    subtitle: "安装。分享链接。开始通话。就是这样。",
    install: {
      title: "安装",
      description:
        "下载单个二进制文件或拉取 Docker 镜像。一条命令，零依赖。一分钟内即可运行。",
    },
    invite: {
      title: "邀请",
      description:
        "分享链接。无需注册、无需下载、无障碍。客人可从任何浏览器即时加入。",
    },
    host: {
      title: "会议",
      description:
        "内置降噪的清晰 WebRTC 视频和音频。屏幕共享、录制和实时聊天一应俱全。",
    },
  },
  whyBedrud: {
    title: "天生不同",
    subtitle: "无锁定。无臃肿。无账单惊喜。",
    noLockIn: {
      title: "无供应商锁定",
      description:
        "你的基础设施。你的数据。你的规则。随时部署到任意服务器，随时迁移。无专有格式，无退出费用，无云依赖。",
    },
    singleBinary: {
      title: "单一二进制",
      description:
        "一个文件。一条命令。零依赖。不用 Docker，不用 Kubernetes，告别周五下午的部署噩梦。",
    },
    noPerSeat: {
      title: "无按座位收费",
      description:
        "5个用户或5000个。价格一样：零。没有许可证密钥，没有席位计数器，没有'联系销售'按钮。",
    },
  },
  problem: {
    title: "你的会议不该这么贵",
    subtitle:
      "企业视频平台多年来一直对团队过度收费。以下是问题所在--以及开发者为什么在转向其他方案。",
    perSeatPricing: {
      title: "按座位收费是个陷阱",
      description:
        "Zoom、Teams、Meet--全都按用户收费。从 10 人增长到 100 人，账单直接翻 10 倍。跨部门、承包商和访客叠加后，你在一个每天只用 30 分钟的工具上大量流失预算。",
    },
    vendorLockIn: {
      title: "供应商锁定扼杀主动权",
      description:
        "你的会议录制、转录、参会者数据--全都存储在你无法控制的服务器上。当供应商涨价、砍功能或被入侵时，你没有任何退出策略。",
    },
    selfHostedNightmare: {
      title: "自建方案简直是噩梦",
      description:
        "Jitsi 需要 8+ 个 Docker 容器。BigBlueButton 要 8GB 内存。两者安装都超过一小时，扩展都不简单，周五下午调试它们绝不是你想度过周末的方式。",
    },
  },
  comparison: {
    title: "看看 Bedrud 的对比",
    subtitle: "无复杂性的自托管视频会议。",
    feature: "功能",
    bedrud: "Bedrud",
    jitsi: "Jitsi Meet",
    bbb: "BigBlueButton",
    sections: {
      deployment: "部署",
      features: "功能",
      integrations: "集成与扩展",
      licensing: "许可与社区",
    },
    rows: {
      deploy: "部署复杂性",
      deployBedrud: "单一二进制",
      deployJitsi: "Docker Compose (8+ 容器)",
      deployBbb: "最低 8GB RAM 服务器",
      ram: "RAM 使用",
      ramBedrud: "512MB",
      ramJitsi: "~2GB",
      ramBbb: "~4GB+",
      install: "安装时间",
      installBedrud: "< 1 分钟",
      installJitsi: "~15 分钟",
      installBbb: "~30 分钟 + 配置",
      nativeClients: "原生客户端",
      nativeClientsBedrud: "Web、Android、iOS",
      nativeClientsJitsi: "Web、Android、iOS",
      nativeClientsBbb: "仅 Web",
      guestJoin: "客人加入 (无需账户)",
      guestJoinBedrud: "是",
      guestJoinJitsi: "是",
      guestJoinBbb: "是 (需要主持人批准)",
      audioProcessing: "音频处理 (降噪)",
      audioProcessingBedrud: "RNNoise / Krisp",
      audioProcessingJitsi: "基础",
      audioProcessingBbb: "基础",
      screenShare: "屏幕共享",
      screenShareBedrud: "内置",
      screenShareJitsi: "内置",
      screenShareBbb: "内置",
      recording: "录制",
      recordingBedrud: "服务器端录制",
      recordingJitsi: "通过 Jibri (额外配置)",
      recordingBbb: "内置 + 笔记导出",
      sipIntegration: "SIP / 电话拨入",
      sipIntegrationBedrud: "否",
      sipIntegrationJitsi: "SIP/Jibri 网关",
      sipIntegrationBbb: "SIP 网关",
      whiteboard: "白板",
      whiteboardBedrud: "否",
      whiteboardJitsi: "否",
      whiteboardBbb: "内置白板",
      maxUsers: "最大并发用户",
      maxUsersBedrud: "50+ 每房间",
      maxUsersJitsi: "100+ 需调优",
      maxUsersBbb: "300+ 每房间",
      license: "许可证",
      licenseBedrud: "Apache 2.0",
      licenseJitsi: "Apache 2.0",
      licenseBbb: "LGPL 3.0",
      communitySize: "社区与生态",
      communitySizeBedrud: "成长中",
      communitySizeJitsi: "大型，成熟",
      communitySizeBbb: "大型，学术",
    },
  },
  features: {
    title: "开箱即用",
    subtitle: "视频、音频、认证、机器人--全部包含。无需微服务架构。",
    oneCommandDeploy: {
      title: "一条命令部署",
      description:
        "单一二进制文件，零依赖。在终端粘贴一行命令，Bedrud 60 秒内即可运行。无需 Docker、无需 Kubernetes、无需运维团队。",
    },
    fiveDollarVps: {
      title: "5 美元 VPS 即可运行",
      description:
        "空闲时约 200MB 内存（最低 512MB）。部署在任何廉价 VPS 上--Hetzner、DigitalOcean、AWS Lightsail 或你自己的硬件。同样功能，几分之一成本。",
    },
    webrtcLatency: {
      title: "WebRTC 亚秒级延迟",
      description:
        "内置 WebRTC 媒体服务器，支持自适应码率。即使在不稳定连接下也能提供清晰的视频和音频。不通过第三方服务器中转。",
    },
    enterpriseSso: {
      title: "企业 SSO 和 OIDC",
      description:
        "几分钟内连接你的身份提供商。通行密钥、OAuth 2.0、OIDC--全部开箱即用。没有可能被泄露的密码数据库。",
    },
    guestJoin: {
      title: "访客加入 — 无需账号",
      description:
        "分享链接，点击即可加入。无需注册、无需密码、无需安装应用。支持所有现代浏览器。",
    },
    recording: {
      title: "内置录制和屏幕共享",
      description:
        "直接录制会议和共享屏幕。录制文件保存到你的服务器——不是别人的云端。",
    },
  },
  install: {
    title: "一条命令。完成。",
    subtitle: "复制。粘贴。运行。安装完成。",
    command: "curl -fsSL https://get.bedrud.org | bash",
    powershellCommand: "irm https://get.bedrud.org/install.ps1 | iex",
    dockerCommand: "docker pull ghcr.io/bedrud-ir/bedrud:latest",
    or: "或",
    whatItDoes:
      "Downloads the Bedrud CLI binary to ~/bin and adds it to your PATH.",
    flagsTitle: "Key Flags",
    flagsDesc: "Description",
    flagVersion: "Install a specific version (e.g. 0.12.0)",
    flagInstallDir: "Custom install directory (default: ~/bin)",
    flagSkipShell: "Skip modifying shell config files",
    requirements:
      "支持任何 64 位 Linux、macOS 或 Windows，512MB 内存（空闲时约 200MB）。",
    fullDocsLink: "Full CLI installer docs",
    fullServerDocsLink: "Full server installation guide",
    dockerGuideLink: "Docker setup guide",
    githubReleases: "Download binary from GitHub Releases",
  },
  platforms: {
    title: "原生应用，不是网页套壳",
    subtitle:
      "真正的原生应用--Web 用 React、Android 用 Kotlin、iOS 用 Swift、桌面用 Rust、服务端用 Go。不用 Electron，不用 Cordova。",
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
      title: "桌面",
      tech: "Rust + Slint",
    },
    server: {
      title: "服务器",
      tech: "Go + WebRTC",
    },
    bots: {
      title: "机器人",
      tech: "Python SDK",
    },
    status: "生产环境",
  },
  openSource: {
    title: "阅读源码。掌控一切。",
    subtitle:
      "每一行代码都是公开的。审查、审计、贡献或 fork。Apache 2.0 许可--商业或个人使用皆可。",
    license: "Apache 2.0",
    github: "在 GitHub 上查看",
    docs: "阅读文档",
  },
  cta: {
    title: "停止租赁你的会议",
    subtitle:
      "在任意 $5 VPS 上 60 秒内部署。无需信用卡、无供应商锁定、无第三方服务器。",
    installNow: "部署你的服务器",
    getStarted: "阅读快速入门",
    readDocs: "查看快速入门",
    starGithub: "在 GitHub 上星标",
    copied: "已复制!",
  },
  faq: {
    title: "常见问题",
    subtitle: "技术问题，直接回答。",
    serverPower: {
      question: "我的服务器需要多强？",
      answer:
        "每月 5 美元、1GB 内存的 VPS 就足够起步。Bedrud 使用 512MB 内存，随硬件扩展。50+ 并发用户建议升级到 2GB。无需 GPU。",
    },
    installCommand: {
      question: "安装命令具体做了什么？",
      answer:
        "下载适合你平台的 Bedrud 二进制文件并放置到 /usr/local/bin。无需 Docker、无需包管理器、无隐藏依赖。你可以在运行前检查脚本内容。",
    },
    recordingScreenSharing: {
      question: "支持录制和屏幕共享吗？",
      answer:
        "支持。内置屏幕共享和会议录制。录制文件保存到你的服务器--不是别人的云上。机器人代理还可以实时转录会议内容。",
    },
    migrate: {
      question: "可以从 Zoom 或 Teams 迁移吗？",
      answer:
        "可以。Bedrud 可以与现有工具并行运行。导入团队、设置 SSO，按自己的节奏迁移会议。永远不会出现数据锁定。",
    },
    pricing: {
      question: "真的免费吗？",
      answer:
        "完全免费。Apache 2.0 许可证，没有功能限制，没有「联系销售」按钮。源代码公开。自己托管，只付服务器费用——通常每月 5 美元。",
    },
    mobile: {
      question: "有移动应用吗？",
      answer:
        "有。Android（Kotlin）和 iOS（Swift）原生应用，还有 Rust 构建的桌面应用。不是网页封装——真正的原生性能。",
    },
  },
  footer: {
    brand: "Bedrud",
    tagline: "为重视隐私的团队打造的视频会议。自托管或云端。",
    platform: "平台",
    features: "功能",
    compare: "对比",
    demo: "在线演示",
    docs: "文档",
    api: "API 参考",
    download: "下载",
    about: "关于",
    resources: "资源",
    blog: "博客",
    changelog: "更新日志",
    contribute: "贡献",
    reportIssue: "报告问题",
    contact: "联系",
    install: "安装",
    privacy: "隐私政策",
    terms: "服务条款",
    social: {
      github: "GitHub",
      twitter: "X (Twitter)",
    },
  },
  privacy: {
    meta: {
      title: "隐私政策 - Bedrud",
      description:
        "Bedrud 如何处理你的数据。简而言之：自托管意味着你的数据留在你的服务器上。",
    },
    title: "隐私政策",
    lastUpdated: "最后更新：2026 年 4 月 17 日",
    intro:
      "Bedrud 是开源视频会议软件。当你自托管时，你的数据永远不会经过我们的服务器。本政策涵盖 bedrud.org 网站和公共演示实例。如果你自托管 Bedrud，你完全控制自己的数据。",
    dataCollection: {
      title: "我们收集什么",
      content:
        "在网站（bedrud.org）上：什么也不收集。没有 cookie，没有追踪器，没有分析。在公共演示上：你连接时的显示名称和 IP 地址。仅此而已。没有电子邮件，没有电话，没有个人信息。当你自托管 Bedrud 时，所有数据都留在你的基础设施上。我们从不会看到。",
    },
    dataUsage: {
      title: "我们如何使用数据",
      content:
        "演示连接数据仅用于实时路由你的视频和音频。不会被记录、存储或分析。我们不会建立用户画像，不会投放定向广告，不会出售数据。绝不。",
    },
    dataStorage: {
      title: "数据存储",
      content:
        "公共演示不会持久化数据。断开连接后，你的会话就消失了--没有录制，没有聊天记录。自托管实例将数据存储在你服务器上的 SQLite 中。你选择备份策略和保留策略。我们无法访问。",
    },
    thirdParties: {
      title: "第三方服务",
      content:
        "没有。Bedrud 在下载后不会发出任何出站请求。没有分析，没有崩溃报告，没有遥测。网站不加载任何第三方脚本。你可以自行验证--源代码在 GitHub 上。",
    },
    cookies: {
      title: "Cookie 与本地存储",
      content:
        "网站使用 localStorage 来保存你的主题偏好（深色/浅色）和语言选择。仅此而已。没有追踪 cookie，没有广告 ID。演示使用会话 cookie，关闭标签页后过期。",
    },
    yourRights: {
      title: "你的权利",
      content:
        "由于我们不收集个人数据，你无需向我们申请访问、更正或删除任何内容。关闭演示标签页，你的会话数据就已经消失了。自托管用户对自己的服务器上的所有数据拥有完全控制权--导出、备份、删除，随你所需。",
    },
    changes: {
      title: "本政策的变更",
      content:
        "如果我们的数据处理方式发生变化，我们会更新此页面。鉴于我们几乎不收集任何数据，变更的可能性很小。页面顶部的日期反映了最近的修订。",
    },
    contact: {
      title: "联系我们",
      content:
        "有问题？在 GitHub 上开一个 issue，或发送邮件至 privacy@bedrud.com。我们也在 Discord 上，如果你更喜欢实时聊天的话。",
    },
  },
  terms: {
    meta: {
      title: "服务条款 - Bedrud",
      description:
        "bedrud.org 网站和公共演示的使用条款。自托管用户受 Apache 2.0 许可证约束。",
    },
    title: "服务条款",
    lastUpdated: "最后更新：2026 年 4 月 17 日",
    intro:
      "本条款涵盖 bedrud.org 网站和 bedrud.xyz 上的公共演示实例。如果你下载并自托管 Bedrud，Apache 2.0 许可证适用于你对软件的使用。",
    acceptance: {
      title: "使用 Bedrud 即表示你接受本条款",
      content:
        "访问 bedrud.org 或使用公共演示即表示你同意本条款。如果你不同意，请不要使用演示。就这么简单。",
    },
    services: {
      title: "Bedrud 提供什么",
      content:
        "我们提供此网站（含文档和下载链接）以及一个用于评估软件的公共演示实例。视频会议软件本身是在 Apache 2.0 许可证下的开源软件。你可以下载、修改并自行运行。",
    },
    accounts: {
      title: "账户",
      content:
        "网站不需要账户。演示不需要账户。自托管实例可以有自己的账户系统--这由你决定，因为是你管理服务器。",
    },
    acceptableUse: {
      title: "请勿滥用演示",
      content:
        "请勿将公共演示用于非法内容、垃圾信息、骚扰或任何损害他人体验的行为。我们保留将滥用用户从演示房间中移除的权利。这不适用于自托管实例--你制定自己的规则。",
    },
    intellectualProperty: {
      title: "开源许可证",
      content:
        "Bedrud 采用 Apache 2.0 许可证。你可以使用、修改和分发它--包括商业用途。Bedrud 名称和标志是 theMadOrg 的商标。你可以使用它们来指代该软件，但不能歪曲你与项目的关系。",
    },
    termination: {
      title: "访问权限",
      content:
        "我们可以在任何时候因滥用行为撤销对公共演示的访问权限。必要时我们可以下线网站。但一旦你下载了二进制文件，它在 Apache 2.0 许可证下就属于你了。我们无法撤销这一点。",
    },
    liability: {
      title: "不提供保证",
      content:
        "Bedrud 按原样提供。我们不保证它在所有环境中都能完美运行。我们对停机、数据丢失或使用软件造成的任何损害不承担责任。请参阅 Apache 2.0 许可证获取完整的法律文本。",
    },
    governingLaw: {
      title: "适用法律",
      content:
        "本条款受适用法律管辖。对于争议，我们倾向于通过 GitHub issue 或直接沟通解决，然后再考虑律师。",
    },
    changes: {
      title: "更新",
      content:
        "我们可能会更新这些条款。如果更新，我们会修改此页面上的日期。在更改后继续使用演示或网站即表示你接受这些更改。",
    },
    contact: {
      title: "联系我们",
      content:
        "对本条款有疑问？发送邮件至 legal@bedrud.com 或在 GitHub 上开一个 issue。",
    },
  },
  docs: {
    documentation: "文档",
    onThisPage: "本页",
    previous: "上一页",
    next: "下一页",
    backToHome: "返回首页",
    searchPlaceholder: "搜索文档…",
    searchButton: "搜索",
    noResults: "未找到结果",
    loading: "加载中…",
    pressShortcut: "按",
    clearSearch: "清除搜索",
    searchDocs: "搜索文档",
    searchError: "搜索失败，请重试。",
    notFound: "文档未找到",
    sections: {
      gettingStarted: "快速入门",
      architecture: "架构",
      backend: "后端",
      api: "API",
      guides: "指南",
      contributing: "贡献",
    },
    titleSuffix: " - Bedrud",
    diagramError: "图表渲染失败",
    toggleMenu: "切换菜单",
    mdx: {
      systemdServices: {
        title: "Systemd 服务",
        description: "安装程序会创建两个 systemd 服务：",
        headerService: "服务",
        headerCommand: "命令",
        headerPurpose: "用途",
        purposeApi: "API + Web",
        purposeMedia: "媒体服务器",
      },
      createAdmin: {
        title: "提升用户为管理员",
        registerViaWeb: "通过 Web 界面注册用户，然后提升为管理员：",
        createDirectly: "或者，直接创建新的管理员用户：",
      },
      installerSteps: {
        title: "安装程序的工作流程",
        description: "运行 bedrud install 时，会执行以下操作：",
        headerStep: "步骤",
        headerAction: "操作",
        step1Action: "创建目录：",
        step2Action: "将二进制文件复制到",
        step3Action: "根据你的设置生成 config.yaml",
        step4Action: "为媒体服务器生成 livekit.yaml",
        step5Action: "创建两个 systemd 服务：",
        step6Action: "启用并启动两个服务",
        step7Action: "初始化 SQLite 数据库和证书缓存",
      },
    },
    sidebarItems: {
      "getting-started/quickstart": "快速入门",
      "getting-started/cli-installer": "CLI Installer",
      "getting-started/installation": "服务器安装",
      "getting-started/clients": "客户端安装",
      "getting-started/configuration": "配置",
      "getting-started/cli-reference": "CLI 参考",
      "architecture/overview": "架构概览",
      "architecture/server": "服务器架构",
      "architecture/web": "Web 前端",
      "architecture/android": "Android 应用",
      "architecture/ios": "iOS 应用",
      "architecture/desktop": "桌面应用",
      "architecture/agents": "机器人代理",
      "architecture/webrtc-connectivity": "WebRTC 连接",
      "architecture/turn-server": "TURN 服务器",
      "backend/overview": "后端文档",
      "backend/structure": "代码结构",
      "backend/database": "数据库与模型",
      "backend/authentication": "身份认证",
      "backend/api-handlers": "API 处理器",
      "backend/livekit": "LiveKit 集成",
      "backend/deployment": "部署",
      "backend/advanced": "高级主题",
      "api/authentication": "认证 API",
      "api/rooms": "房间 API",
      "api/admin": "管理 API",
      "api/passkeys": "通行密钥 API",
      "guides/development": "开发工作流",
      "guides/deployment": "部署指南",
      "guides/docker": "Docker 指南",
      "guides/internal-tls": "内部 TLS",
      "guides/makefile": "Makefile 参考",
      "guides/packages": "包安装",
      "guides/appliance": "一体机模式",
      contributing: "贡献",
    },
  },
  installPage: {
    meta: {
      title: "安装 Bedrud Server - 一条命令完成部署",
      description:
        "在不到一分钟内将 Bedrud 部署到你的服务器。单个二进制文件，512MB 内存，无需 Docker。",
    },
    title: "安装 Bedrud Server",
    subtitle:
      "在不到一分钟内将自托管服务器部署到你的服务器。一个二进制文件，零依赖。",
  },
  downloadPage: {
    meta: {
      title: "下载 Bedrud - 桌面和移动应用",
      description:
        "下载适用于 Linux、macOS、Windows、Android 或 iOS 的 Bedrud。原生应用或免安装浏览器访问。",
    },
    title: "下载 Bedrud",
    subtitle: "适用于每个平台的原生应用。或者直接在浏览器中打开会议链接。",
    noInstall: "无需安装。下载、添加执行权限、运行。",
    flathub: "从 Flathub 安装",
    brew: "通过 Homebrew 安装",
    winget: "通过 Windows 包管理器安装",
    installer: "安装程序",
    portable: "便携版",
    playStore: "从 Google Play 获取",
    appStore: "从 App Store 获取",
    sideload: "从 GitHub Releases 下载 APK/IPA",
    browserZero: "免安装",
    browserDesc:
      "在 Chrome、Firefox、Edge 或 Safari 中打开任意会议链接。无需下载。",
    tryDemo: "试试在线演示",
    otherPlatforms: "查看所有平台和包管理器",
    server: "服务器安装",
    serverDesc: "在你自己的硬件上部署 Bedrud 服务器。",
    serverGuide: "服务器安装指南",
    quickInstall: "Quick install",
    heroClientTitle: "客户端版本",
    heroClientDesc: "适用于每个平台的原生桌面和移动应用。",
    heroServerTitle: "服务器版本",
    heroServerDesc: "在你自己的硬件上部署 Bedrud 服务器。",
    heroAllPlatforms: "查看所有平台",
    dmgAppleSilicon: "Apple Silicon (.dmg)",
    dmgIntel: "Intel (.dmg)",
    serverDocker: "Docker",
    serverDockerDesc: "使用 Docker 容器运行。",
    serverBinary: "Linux 二进制文件",
    serverBinaryDesc: "下载预编译的 Linux 二进制文件。",
    serverQuickInstall: "快速安装",
    serverQuickInstallDesc: "一条命令，不到一分钟。",
    serverHelm: "Kubernetes (Helm)",
    serverHelmDesc: "使用 Helm 部署到 Kubernetes。",
    resourcesTitle: "资源",
    resourcesDocs: "文档",
    resourcesDocsDesc: "安装指南、API 参考和使用教程。",
    resourcesCommunity: "社区",
    resourcesCommunityDesc: "获取帮助和分享反馈。",
    resourcesChangelog: "更新日志",
    resourcesChangelogDesc: "最新版本和变更记录。",
    repoSetup: "需要仓库配置",
    appleSilicon: "Apple Silicon",
    intel: "Intel",
    githubReleases: "GitHub Releases",
    platform: {
      linux: "Linux",
      mac: "macOS",
      windows: "Windows",
      android: "Android",
      ios: "iOS",
      browser: "浏览器",
    },
  },
  aboutPage: {
    meta: {
      title: "关于 Bedrud",
      description:
        "了解 Bedrud 背后的团队和使命 - 为所有人打造的开源视频会议。",
    },
    title: "关于 Bedrud",
    subtitle: "由相信隐私应是默认设置的人打造的开源视频会议。",
    error: "加载团队成员失败。",
    mission: {
      title: "我们的使命",
      text: "Bedrud 的存在是因为视频会议不应该要求将数据交给大型科技公司。我们相信一个单一二进制文件、一台便宜的 VPS 和开源代码就能取代价值数百万的 SaaS 合同 - 无需牺牲质量或功能。隐私不是一项功能。它是基础。",
    },
    team: {
      title: "核心团队",
      subtitle: "Bedrud 背后的人。",
    },
  },
  blog: {
    meta: {
      title: "博客 - Bedrud",
      description: "来自 Bedrud 团队的更新、技术深度解析和指南。",
    },
    title: "博客",
    subtitle: "来自 Bedrud 团队的更新、技术深度解析和指南。",
    noPosts: "暂无文章。请稍后再来!",
    backToBlog: "返回博客",
    titleSuffix: " - Bedrud Blog",
    defaultAuthor: "Bedrud 团队",
  },
  skipToContent: "跳到内容",
  mobileNav: {
    navigation: "导航",
    language: "语言",
    getStarted: "立即开始",
    github: "GitHub",
  },
  featuresPage: {
    meta: {
      title: "功能 - Bedrud",
      description:
        "探索 Bedrud 的功能：单一二进制文件、WebRTC 质量、访客加入、通行密钥、管理员控制、音频处理、机器人和多平台支持。",
    },
    title: "功能",
    subtitle: "每个功能都解决一个真正的问题。",
    sectionTitle: "你需要的一切，不需要的什么都没有",
    sectionSubtitle:
      "单一二进制文件中的视频会议基础设施。无外部依赖，无按席位收费，无供应商锁定。",
    groups: {
      infra: "部署与基础设施",
      media: "会议与媒体",
      access: "访问与控制",
      extend: "扩展",
    },
    learnMore: "了解更多",
    stats: {
      ram: "512MB 内存",
      binary: "1 个二进制文件",
      auth: "6 种认证方式",
      platforms: "5 个平台",
    },
    guestJoin: {
      pain: "厌倦了仅仅为了 15 分钟的通话而强迫客人创建账户？",
      title: "访客加入 - 无需账户",
      description:
        "分享链接，他们点击，就进来了。没有注册表单，没有密码，无障碍。可选密码以确保安全。",
    },
    singleBinary: {
      pain: "设置视频基础设施不应该需要 DevOps 学位。",
      title: "单一二进制部署",
      description:
        "一次下载，一条命令，运行。没有 Docker Compose，没有 Kubernetes 清单，没有 12 步指南。只是一个能工作的二进制文件。",
      snippet: "$ curl -sSL bedrud.dev/install.sh | sh",
    },
    webrtc: {
      pain: "延迟、冻结或断开的视频通话会破坏会议。",
      title: "WebRTC 质量",
      description:
        "内置 WebRTC 媒体服务器，具有自适应比特率、simulcast 和 SVC。任何连接上的清晰视频和音频。",
    },
    passkeys: {
      pain: "密码会泄露。MFA 令牌会被钓鱼。",
      title: "通行密钥 + OAuth",
      description:
        "FIDO2 通行密钥用于无密码身份验证。OAuth 2.0 / OIDC 用于与你现有的身份提供者进行 SSO。没有密码数据库可以泄露。",
    },
    admin: {
      pain: "没有好的工具，管理会议平台很痛苦。",
      title: "管理仪表板",
      description:
        "房间管理、用户管理、使用分析和配置 - 全部通过干净的 Web UI。没有 CLI 猜测。",
    },
    audio: {
      pain: "会议中的背景噪音让人分心且不专业。",
      title: "音频处理",
      description:
        "由 RNNoise 驱动的内置降噪。可选的 Krisp 集成，用于高级 AI 降噪。每次通话都有清晰的音频。",
    },
    bots: {
      pain: "手动的会议任务浪费时间 - 录制、转录、笔记。",
      title: "机器人代理",
      description:
        "可编程的机器人通过 Go SDK 加入会议。自动化转录、翻译、录制、CRM 集成和自定义工作流程。",
    },
    multiPlatform: {
      pain: "你的团队使用不同的设备。你的会议平台也应该如此。",
      title: "多平台",
      description:
        "用于 Web (React)、Android (Kotlin) 和 iOS (Swift) 的原生应用。一致的体验，平台原生性能。",
    },
    e2eEncryption: {
      pain: "经过您服务器的会议内容应该保持私密。",
      title: "端到端加密",
      description:
        "房间可选 E2E 加密。服务器仅转发加密媒体--只有参与者可以解密。",
    },
    autoTls: {
      pain: "SSL 证书不应该需要教程才能设置。",
      title: "自动 TLS 和 HTTPS",
      description: "自动 Let's Encrypt 配置和续期。内部网络可使用自签名证书。",
    },
    airGapped: {
      pain: "如果你的服务器无法连接互联网怎么办？",
      title: "支持离线和隔离网络",
      description:
        "下载后零出站请求。内嵌 SQLite。可在从不接触公共互联网的基础设施上运行。",
    },
  },
  demoPage: {
    meta: {
      title: "在线演示 - Bedrud",
      description: "无需安装即可试用 Bedrud。立即加入在线演示会议。",
    },
    hero: {
      headline: "立即试用 Bedrud",
      subtitle: "在浏览器中加入实时会议。无需账户，无需下载，无需等待。",
    },
    cta: {
      tryNow: "打开在线演示",
      noInstall: "无需安装，无需账户，无需承诺。点击即可加入。",
    },
    preview: {
      caption: "加入演示后你将看到的界面",
    },
    features: {
      instantJoin: {
        title: "即时加入",
        description:
          "点击链接即可加入。无需注册表单，无需邮件验证，无需安装应用。支持所有现代浏览器。",
      },
      noAccount: {
        title: "无需账户",
        description:
          "选择一个显示名称即可开始。结束后关闭标签页，不留任何痕迹。",
      },
      webrtc: {
        title: "真正的 WebRTC 质量",
        description:
          "演示运行与自托管 Bedrud 相同的引擎。亚秒级延迟，自适应码率，清晰的音频。",
      },
      e2e: {
        title: "端到端加密",
        description:
          "在房间设置中启用 E2E 加密。你的视频和音频在离开浏览器之前就已加密。",
      },
    },
    faq: {
      whatHappens: {
        question: "演示中会发生什么？",
        answer:
          "你将加入一个运行完整 Bedrud 技术栈的共享会议室。可以测试视频、音频、屏幕共享、聊天和会议控制--与自托管实例完全相同。",
      },
      dataSaved: {
        question: "我的数据会被保存吗？",
        answer:
          "不会。演示不会持久化任何数据。当你离开时，你的会话就消失了--没有录制，没有聊天记录，没有任何数据被存储。",
      },
      duration: {
        question: "演示可以使用多久？",
        answer:
          "没有时间限制。你可以使用演示来评估 Bedrud，想用多久就用多久。当你想要永久设置时，自托管只需 60 秒。",
      },
      inviteOthers: {
        question: "我可以邀请其他人加入演示吗？",
        answer:
          "可以。将演示链接分享给团队成员，所有人都能加入同一个房间。这是在部署前与团队一起测试 Bedrud 的好方法。",
      },
    },
    selfHost: {
      text: "更倾向于运行自己的服务器？",
      cta: "阅读安装指南",
    },
  },
  changelogPage: {
    meta: {
      title: "更新日志 - Bedrud",
      description: "Bedrud 的版本历史和更新记录。",
    },
    title: "更新日志",
    subtitle: "Bedrud 有什么新功能。活动 = 信任。",
    viewOnGithub: "在 GitHub 上查看",
    noReleases: "还没有发布。请稍后再来！",
    error: "加载版本发布失败。",
    viewRelease: "在 GitHub 上查看 →",
  },
  contributorsPage: {
    meta: {
      title: "贡献者 - Bedrud",
      description: "认识构建 Bedrud 的人们。",
    },
    title: "贡献者",
    subtitle: "Bedrud 由社区构建。",
    joinThem: "加入他们",
    joinCta: "在 GitHub 上贡献",
    contributions: "贡献",
    error: "加载贡献者失败。",
  },
  contactPage: {
    meta: {
      title: "联系我们 - Bedrud",
      description: "与 Bedrud 团队取得联系。",
    },
    title: "联系",
    subtitle: "通过任何这些渠道联系我们。",
    github: {
      title: "GitHub 问题",
      description: "错误报告、功能请求和代码贡献。",
      cta: "打开问题",
    },
    discord: {
      title: "社区聊天",
      description: "提问、分享想法并从社区获得帮助。",
      cta: "加入 Discord",
    },
    email: {
      title: "电子邮件",
      description: "用于合作伙伴关系、安全问题或私人查询。",
      cta: "发送电子邮件",
    },
  },
  a11y: {
    toggleTheme: "切换主题",
    breadcrumb: "面包屑导航",
    articleNav: "文章导航",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    navigationMenu: "导航菜单",
    changeLanguage: "切换语言",
    discordCommunity: "Discord 社区",
  },
  notFound: {
    title: "页面未找到",
    description: "您查找的页面不存在或已被移动。",
    backToHome: "返回首页",
  },
  mockups: {
    terminal: {
      title: "终端",
      downloading: "✓ 正在下载 bedrud v0.12.3...",
      installing: "✓ 正在安装到 /usr/local/bin...",
      ready: "✓ Bedrud 就绪！(512MB 内存)",
    },
    invite: {
      shareLink: "分享会议链接",
      sendEmail: "通过邮件发送",
      copyLink: "复制链接",
      or: "或",
      meetingTitle: "团队站会",
      today: "今天，下午 2:00",
      duration: "30 分钟",
      participants: "5 位参会者",
      noAccount: "无需账户",
      anyBrowser: "支持任何浏览器",
    },
    meeting: {
      title: "团队站会",
      micOn: "麦克风开启",
      cameraOn: "摄像头开启",
      shareScreen: "共享屏幕",
      raiseHand: "举手",
      chat: "聊天",
      leaveCall: "离开通话",
    },
    preview: {
      title: "团队站会",
      you: "你",
      chat: "聊天",
      messagePlaceholder: "输入消息...",
      chatMsg1: "正在分享第四季度报告",
      chatMsg2: "看起来不错！",
      chatMsg3: "能看一下第 4 页幻灯片吗？",
    },
    scale: {
      overview: "概览",
      last30Days: "最近 30 天",
      meetings: "会议",
      uptime: "运行时间",
      availability: "可用性",
      activeUsers: "活跃用户",
      unlimitedUsers: "无限用户",
      noPerSeat: "无按座位收费",
      costPerSeat: "每座位成本：",
      costFree: "$0.00",
    },
  },
};
