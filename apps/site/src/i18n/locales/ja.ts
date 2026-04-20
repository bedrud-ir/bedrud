export default {
  meta: {
    title: "Bedrud - あなたらしいビデオ会議",
    description:
      "Bedrud はオープンソースのビデオ会議プラットフォームです。セルフホストまたはクラウドで利用可能。Web UI、REST API、WebRTC メディアサーバーを単一バイナリに統合。",
  },
  nav: {
    home: "ホーム",
    features: "機能",
    compare: "比較",
    platforms: "プラットフォーム",
    openSource: "オープンソース",
    docs: "ドキュメント",
    community: "コミュニティ",
    demo: "デモ",
    getStarted: "はじめる",
    install: "インストール",
    blog: "ブログ",
  },
  hero: {
    badge: "オープンソース · Apache 2.0",
    kicker: "オープンソースの Zoom 代替。$5 VPS で稼働。",
    headline: "あなたのミーティング。あなたのサーバー。あなたのルール。",
    subheadline:
      "独自のハードウェアでセルフホスト型ビデオ会議。単一バイナリ、512MB RAM、60秒デプロイ。プライベート通話から数千視聴者のライブ配信まで。",
    trustBar:
      "世界中で10,000人以上のプライバシー重視の開発者とチームに信頼されています。",
    installMicrocopy: "ターミナルに貼り付けるだけ。60秒でデプロイ完了。",
    tryDemo: "インストールなしで試す",
    installNow: "インストールコマンドをコピー",
    objectionBullets: {
      screenSharing: "画面共有・録画機能",
      sso: "SSO・OIDC 連携",
      webrtc: "WebRTC 搭載、サブ秒レイテンシ",
    },
    getStarted: "はじめる",
    viewOnGithub: "GitHub で見る",
    copied: "コピーしました!",
    stars: "1.2k",
    starsLabel: "GitHub スター",
    contributorsLabel: "貢献者",
    license: "Apache 2.0 ライセンス",
  },
  journey: {
    title: "ゼロからミーティングまで数分で",
    subtitle: "インストール。リンクを共有。通話開始。実際の流れはこちら。",
    install: {
      title: "インストール",
      description:
        "単一バイナリをダウンロードするか、Dockerイメージをプルします。1つのコマンド、依存関係ゼロ。1分以内で実行。",
    },
    invite: {
      title: "招待",
      description:
        "リンクを共有。登録なし、ダウンロードなし、摩擦なし。ゲストは任意のブラウザから即座に参加。",
    },
    host: {
      title: "ミーティング",
      description:
        "ノイズキャンセル内蔵のクリスタルクリアなWebRTCビデオとオーディオ。画面共有、録画、チャットも完備。",
    },
  },
  whyBedrud: {
    title: "異なる設計",
    subtitle: "ロックインなし。無駄なし。請求の驚きなし。",
    noLockIn: {
      title: "ベンダーロックインなし",
      description:
        "あなたのインフラ。あなたのデータ。あなたのルール。任意のサーバーにデプロイ、いつでも移行可能。独自フォーマットなし、退出費用なし、クラウド依存なし。",
    },
    singleBinary: {
      title: "単一バイナリ",
      description:
        "ファイル1つ。コマンド1つ。依存関係ゼロ。Dockerなし、Kubernetesなし、金曜午後のデプロイ悪夢なし。",
    },
    noPerSeat: {
      title: "シートごとの課金なし",
      description:
        "5ユーザーでも5,000ユーザーでも。価格は同じ：ゼロ。ライセンスキーなし、シートカウンターなし、「営業に連絡」ボタンなし。",
    },
  },
  problem: {
    title: "ミーティングにこんなに払う必要はない",
    subtitle:
      "エンタープライズビデオプラットフォームは長年チームに過剰請求してきた。何が問題なのか、そして開発者が乗り換える理由をご紹介します。",
    perSeatPricing: {
      title: "シートごとの課金は罠",
      description:
        "Zoom、Teams、Meet - すべてユーザーごとの課金。10人から100人に増えれば請求額は10倍に。部門、契約者、ゲストに掛け算すれば、1日30分しか使わないツールに予算を垂れ流すことになる。",
    },
    vendorLockIn: {
      title: "ベンダーロックインが選択肢を奪う",
      description:
        "ミーティング録画、文字起こし、参加者データ - すべてあなたがコントロールできないサーバーに保存されている。プロバイダーが価格を変え、機能を削り、セキュリティ侵害が起きても、出口戦略はない。",
    },
    selfHostedNightmare: {
      title: "セルフホストの選択肢は悪夢",
      description:
        "Jitsiは8個以上のDockerコンテナが必要。BigBlueButtonは8GB RAMを要求。どちらも1時間以内にインストールできず、シンプルにスケールもしない。金曜午後にどちらかをデバッグするのは、週末の過ごし方としては最悪だ。",
    },
  },
  comparison: {
    title: "Bedrudの比較を見る",
    subtitle: "複雑さのないセルフホストビデオ会議。",
    feature: "機能",
    bedrud: "Bedrud",
    jitsi: "Jitsi Meet",
    bbb: "BigBlueButton",
    sections: {
      deployment: "デプロイ",
      features: "機能",
      integrations: "統合とスケール",
      licensing: "ライセンスとコミュニティ",
    },
    rows: {
      deploy: "デプロイの複雑さ",
      deployBedrud: "単一バイナリ",
      deployJitsi: "Docker Compose (8+コンテナ)",
      deployBbb: "最小8GB RAMサーバー",
      ram: "RAM使用量",
      ramBedrud: "512MB",
      ramJitsi: "~2GB",
      ramBbb: "~4GB+",
      install: "インストール時間",
      installBedrud: "< 1分",
      installJitsi: "~15分",
      installBbb: "~30分 + 設定",
      nativeClients: "ネイティブクライアント",
      nativeClientsBedrud: "Web、Android、iOS",
      nativeClientsJitsi: "Web、Android、iOS",
      nativeClientsBbb: "Webのみ",
      guestJoin: "ゲスト参加（アカウント不要）",
      guestJoinBedrud: "はい",
      guestJoinJitsi: "はい",
      guestJoinBbb: "はい（モデレーター承認）",
      audioProcessing: "オーディオ処理（ノイズキャンセル）",
      audioProcessingBedrud: "RNNoise / Krisp",
      audioProcessingJitsi: "基本",
      audioProcessingBbb: "基本",
      screenShare: "画面共有",
      screenShareBedrud: "内蔵",
      screenShareJitsi: "内蔵",
      screenShareBbb: "内蔵",
      recording: "録画",
      recordingBedrud: "サーバー側録画",
      recordingJitsi: "Jibri経由（追加設定）",
      recordingBbb: "内蔵 + ノートエクスポート",
      sipIntegration: "SIP / 電話ダイヤルイン",
      sipIntegrationBedrud: "なし",
      sipIntegrationJitsi: "SIP/Jibriゲートウェイ",
      sipIntegrationBbb: "SIPゲートウェイ",
      whiteboard: "ホワイトボード",
      whiteboardBedrud: "なし",
      whiteboardJitsi: "なし",
      whiteboardBbb: "内蔵ホワイトボード",
      maxUsers: "最大同時ユーザー",
      maxUsersBedrud: "50+ ルームあたり",
      maxUsersJitsi: "100+ チューニング必要",
      maxUsersBbb: "300+ ルームあたり",
      license: "ライセンス",
      licenseBedrud: "Apache 2.0",
      licenseJitsi: "Apache 2.0",
      licenseBbb: "LGPL 3.0",
      communitySize: "コミュニティとエコシステム",
      communitySizeBedrud: "成長中",
      communitySizeJitsi: "大規模、成熟",
      communitySizeBbb: "大規模、学術",
    },
  },
  features: {
    title: "すべて同梱",
    subtitle:
      "ビデオ、音声、認証、ボット - すべて含まれています。マイクロサービスアーキテクチャ不要。",
    oneCommandDeploy: {
      title: "ワンコマンドデプロイ",
      description:
        "単一バイナリ、依存関係ゼロ。ターミナルに1行貼り付けるだけで60秒でBedrudが稼働。Docker不要、Kubernetes不要、運用チーム不要。",
    },
    fiveDollarVps: {
      title: "$5 VPSで稼働",
      description:
        "アイドル時約200MB RAM（最小512MB）。Hetzner、DigitalOcean、AWS Lightsail、自前ハードウェアなど、安価なVPSにデプロイ可能。同じ機能でコストは数分の一。",
    },
    webrtcLatency: {
      title: "WebRTCサブ秒レイテンシ",
      description:
        "アダプティブビットレート搭載のWebRTCメディアサーバー内蔵。不安定な接続でもクリスタルクリアなビデオとオーディオ。サードパーティサーバー経由のプロキシなし。",
    },
    enterpriseSso: {
      title: "エンタープライズSSO & OIDC",
      description:
        "数分でIDプロバイダーに接続。パスキー、OAuth 2.0、OIDC - すべて標準対応。侵害されるパスワードデータベースなし。",
    },
    guestJoin: {
      title: "ゲスト参加 — アカウント不要",
      description:
        "リンクを共有するだけ。クリックして参加。登録フォーム、パスワード、アプリのインストール不要。すべてのモダンブラウザで動作。",
    },
    recording: {
      title: "内蔵録画と画面共有",
      description:
        "ミーティングの録画と画面共有が組み込み。録画はあなたのサーバーに保存 — 誰かのクラウドではない。",
    },
  },
  install: {
    title: "1つのコマンド。完了。",
    subtitle: "コピー。ペースト。実行中。セットアップはこれだけ。",
    command: "curl -fsSL https://get.bedrud.org | bash",
    powershellCommand: "irm https://get.bedrud.org/install.ps1 | iex",
    dockerCommand: "docker pull ghcr.io/bedrud-ir/bedrud:latest",
    or: "または",
    whatItDoes:
      "Downloads the Bedrud CLI binary to ~/bin and adds it to your PATH.",
    flagsTitle: "Key Flags",
    flagsDesc: "Description",
    flagVersion: "Install a specific version (e.g. 0.12.0)",
    flagInstallDir: "Custom install directory (default: ~/bin)",
    flagSkipShell: "Skip modifying shell config files",
    requirements:
      "任意の64ビット Linux、macOS、Windowsで動作。512MB RAMのみ必要。",
    fullDocsLink: "Full CLI installer docs",
    fullServerDocsLink: "Full server installation guide",
    dockerGuideLink: "Docker setup guide",
    githubReleases: "Download binary from GitHub Releases",
  },
  platforms: {
    title: "Webラッパーではないネイティブアプリ",
    subtitle:
      "本当のネイティブアプリ - WebはReact、AndroidはKotlin、iOSはSwift、デスクトップはRust、サーバーはGo。Electronなし、Cordovaなし。",
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
      title: "デスクトップ",
      tech: "Rust + Slint",
    },
    server: {
      title: "サーバー",
      tech: "Go + WebRTC",
    },
    bots: {
      title: "ボット",
      tech: "Python SDK",
    },
    status: "本番環境",
  },
  openSource: {
    title: "ソースコードを読む。主導権を握る。",
    subtitle:
      "すべてのコードが公開されています。検査、監査、貢献、またはフォーク可能。Apache 2.0ライセンス - 商用・個人利用自由。",
    license: "Apache 2.0",
    github: "GitHub で見る",
    docs: "ドキュメントを読む",
  },
  cta: {
    title: "ミーティングをレンタルするのは終わり",
    subtitle:
      "任意の $5 VPS に 60 秒でデプロイ。クレジットカード不要、ベンダーロックインなし、サードパーティサーバーなし。",
    installNow: "サーバーをデプロイ",
    getStarted: "クイックスタートを読む",
    readDocs: "クイックスタートを見る",
    starGithub: "GitHubでスター",
    copied: "コピーしました！",
  },
  faq: {
    title: "よくある質問",
    subtitle: "技術的な質問に直接お答えします。",
    serverPower: {
      question: "サーバーの性能はどのくらい必要ですか？",
      answer:
        "月額$5、1GB RAMのVPSで始められます。Bedrudは512MB RAMを使用し、ハードウェアに応じてスケール。50人以上の同時ユーザーには2GBへ増設。GPU不要。",
    },
    installCommand: {
      question: "インストールコマンドは具体的に何をしますか？",
      answer:
        "プラットフォーム用のBedrudバイナリをダウンロードし、/usr/local/binに配置。Docker、パッケージマネージャー、隠れた依存関係なし。実行前にスクリプトを検査可能。",
    },
    recordingScreenSharing: {
      question: "録画と画面共有に対応していますか？",
      answer:
        "はい。画面共有とミーティング録画を内蔵。録画はあなたのサーバーに保存 - 誰かのクラウドではない。Botエージェントによるリアルタイム文字起こしも可能。",
    },
    migrate: {
      question: "ZoomやTeamsから移行できますか？",
      answer:
        "はい。Bedrudは既存のツールと並行して動作します。チームをインポートし、SSOを設定し、自分のペースでミーティングの移行を始めましょう。データのロックインはありません。",
    },
    pricing: {
      question: "本当に無料ですか？",
      answer:
        "完全に無料です。Apache 2.0ライセンス、機能制限なし、「営業に連絡」ボタンなし。ソースコードは公開されています。自分でホストして、サーバー代だけ払えばOK — 通常月額5ドル。",
    },
    mobile: {
      question: "モバイルアプリはありますか？",
      answer:
        "はい。Android（Kotlin）とiOS（Swift）のネイティブアプリに加え、Rust製のデスクトップアプリ。Webラッパーではありません — 本物のネイティブパフォーマンス。",
    },
  },
  footer: {
    brand: "Bedrud",
    tagline:
      "プライバシーを大切にするチームのためのビデオ会議。セルフホストまたはクラウド。",
    platform: "プラットフォーム",
    features: "機能",
    compare: "比較",
    demo: "ライブデモ",
    docs: "ドキュメント",
    api: "APIリファレンス",
    download: "ダウンロード",
    about: "概要",
    resources: "リソース",
    blog: "ブログ",
    changelog: "変更履歴",
    contribute: "貢献する",
    reportIssue: "問題を報告",
    contact: "お問い合わせ",
    privacy: "プライバシーポリシー",
    terms: "利用規約",
    install: "インストール",
    social: {
      github: "GitHub",
      twitter: "X (Twitter)",
    },
  },
  privacy: {
    meta: {
      title: "プライバシーポリシー - Bedrud",
      description:
        "Bedrud がデータをどのように扱うか。一言で言えば：セルフホストならデータはあなたのサーバーに残ります。",
    },
    title: "プライバシーポリシー",
    lastUpdated: "最終更新日：2026年4月17日",
    intro:
      "Bedrud はオープンソースのビデオ会議ソフトウェアです。セルフホストする場合、データは当方のサーバーを経由しません。本ポリシーは bedrud.org ウェブサイトと公開デモインスタンスを対象としています。Bedrud をセルフホストする場合、データはあなたが管理します。",
    dataCollection: {
      title: "収集する情報",
      content:
        "ウェブサイト（bedrud.org）：何も収集しません。Cookie なし、トラッカーなし、アナリティクスなし。公開デモ：接続中の表示名と IP アドレスのみ。それだけです。メール、電話、個人情報は一切不要。Bedrud をセルフホストする場合、すべてのデータはあなたのインフラ上に残ります。当方は一切見ません。",
    },
    dataUsage: {
      title: "データの使用方法",
      content:
        "デモの接続データは、リアルタイムでのビデオと音声のルーティングにのみ使用されます。ログ保存、データ保存、分析は一切しません。ユーザープロファイルの構築、ターゲット広告の配信、データの販売はしません。絶対に。",
    },
    dataStorage: {
      title: "データ保存",
      content:
        "公開デモはデータを永続化しません。切断するとセッションは消滅します。録画もチャット履歴もありません。セルフホストインスタンスでは SQLite にデータが保存されます。バックアップ戦略と保持ポリシーはあなたが選択します。当方にはアクセスできません。",
    },
    thirdParties: {
      title: "サードパーティサービス",
      content:
        "なし。Bedrud はダウンロード後に外部へのリクエストを一切行いません。アナリティクス、クラッシュレポート、テレメトリもありません。ウェブサイトもサードパーティスクリプトを読み込みません。GitHub のソースコードでご確認ください。",
    },
    cookies: {
      title: "Cookie とローカルストレージ",
      content:
        "ウェブサイトはテーマ設定（ダーク/ライト）と言語選択に localStorage を使用するだけです。それだけです。トラッキング Cookie、広告 ID もありません。デモはタブを閉じると失効するセッション Cookie を使用します。",
    },
    yourRights: {
      title: "あなたの権利",
      content:
        "個人情報を収集していないため、アクセス、修正、削除の対象となるデータはありません。デモのタブを閉じればセッションデータは既に消滅しています。セルフホストユーザーはサーバー上のすべてのデータを完全に制御できます。エクスポート、バックアップ、削除、必要に応じて。",
    },
    changes: {
      title: "本ポリシーの変更",
      content:
        "データ取り扱い方法が変更された場合、このページを更新します。ほとんどデータを収集していないため、変更の可能性は低いです。ページ上部の日付が最新の改訂を反映しています。",
    },
    contact: {
      title: "お問い合わせ",
      content:
        "ご質問がありますか？GitHub で Issue を開くか、privacy@bedrud.com までメールしてください。リアルタイムチャットをご希望なら Discord にもいます。",
    },
  },
  terms: {
    meta: {
      title: "利用規約 - Bedrud",
      description:
        "bedrud.org ウェブサイトと公開デモの利用規約。セルフホストユーザーは Apache 2.0 ライセンスに従います。",
    },
    title: "利用規約",
    lastUpdated: "最終更新日：2026年4月17日",
    intro:
      "本規約は bedrud.org ウェブサイトと bedrud.xyz の公開デモインスタンスを対象としています。Bedrud をダウンロードしてセルフホストする場合、Apache 2.0 ライセンスが適用されます。",
    acceptance: {
      title: "Bedrud を使用することで本規約に同意したとみなされます",
      content:
        "bedrud.org にアクセスするか、公開デモを使用することで、本規約に同意したことになります。同意しない場合、デモを使用しないでください。シンプルです。",
    },
    services: {
      title: "Bedrud が提供するもの",
      content:
        "当方はドキュメントとダウンロードリンクがあるウェブサイトと、ソフトウェア評価用の公開デモインスタンスを提供しています。ビデオ会議ソフトウェア自体は Apache 2.0 ライセンスのオープンソースです。ダウンロード、改変、自前での実行が可能です。",
    },
    accounts: {
      title: "アカウント",
      content:
        "ウェブサイトはアカウント不要です。デモもアカウント不要です。セルフホストインスタンスには独自のアカウントシステムを設定できます。サーバーを運用するのはあなたなので、判断はあなた次第です。",
    },
    acceptableUse: {
      title: "デモを悪用しないでください",
      content:
        "公開デモを違法なコンテンツ、スパム、ハラスメント、または他者の体験を損なう目的で使用しないでください。悪質なユーザーをデモルームから削除する権利を留保します。これはセルフホストインスタンスには適用されません。ルールはあなたが決められます。",
    },
    intellectualProperty: {
      title: "オープンソースライセンス",
      content:
        "Bedrud は Apache 2.0 ライセンスです。商用を含めて使用、改変、配布が可能です。Bedrud の名前とロゴは theMadOrg の商標です。ソフトウェアを指す用途には使用できますが、プロジェクトとの関係を誤って表現する目的には使用できません。",
    },
    termination: {
      title: "アクセス",
      content:
        "悪用があった場合、公開デモへのアクセスをいつでも取り消すことができます。必要に応じてウェブサイトを閉鎖することもあります。ただし、バイナリをダウンロードした時点で、Apache 2.0 ライセンスに基づきあなたのものになります。これは取り消せません。",
    },
    liability: {
      title: "無保証",
      content:
        "Bedrud は現状のまま提供されます。すべての環境で完璧に動作することを保証しません。ダウンタイム、データ損失、ソフトウェア使用に起因する損害について責任を負いません。完全な法的テキストは Apache 2.0 ライセンスをご覧ください。",
    },
    governingLaw: {
      title: "準拠法",
      content:
        "本規約は適用される法律に準拠します。紛争については、弁護士を介入させる前に GitHub Issue または直接のコミュニケーションでの解決を希望します。",
    },
    changes: {
      title: "更新",
      content:
        "本規約を更新する場合があります。更新した場合、このページの日付を変更します。変更後もデモやウェブサイトを継続して使用することは、変更に同意したことを意味します。",
    },
    contact: {
      title: "お問い合わせ",
      content:
        "本規約についてご質問がありますか？legal@bedrud.com にメールするか、GitHub で Issue を開いてください。",
    },
  },
  docs: {
    documentation: "ドキュメント",
    onThisPage: "このページ",
    previous: "前へ",
    next: "次へ",
    backToHome: "ホームに戻る",
    searchPlaceholder: "ドキュメントを検索…",
    searchButton: "検索",
    noResults: "結果なし",
    loading: "読み込み中…",
    searchError: "検索に失敗しました。もう一度お試しください。",
    titleSuffix: " - Bedrud",
    diagramError: "Diagram render failed",
    pressShortcut: "押す",
    clearSearch: "検索をクリア",
    searchDocs: "ドキュメントを検索",
    notFound: "ドキュメントが見つかりません",
    sections: {
      gettingStarted: "はじめに",
      architecture: "アーキテクチャ",
      backend: "バックエンド",
      api: "API",
      guides: "ガイド",
      contributing: "貢献する",
    },
    sidebarItems: {
      "getting-started/quickstart": "クイックスタート",
      "getting-started/cli-installer": "CLI Installer",
      "getting-started/installation": "サーバーインストール",
      "getting-started/clients": "クライアントインストール",
      "getting-started/configuration": "設定",
      "getting-started/cli-reference": "CLIリファレンス",
      "architecture/overview": "アーキテクチャ概要",
      "architecture/server": "サーバーアーキテクチャ",
      "architecture/web": "Webフロントエンド",
      "architecture/android": "Androidアプリ",
      "architecture/ios": "iOSアプリ",
      "architecture/desktop": "デスクトップアプリ",
      "architecture/agents": "Botエージェント",
      "architecture/webrtc-connectivity": "WebRTC接続性",
      "architecture/turn-server": "TURNサーバー",
      "backend/overview": "バックエンドドキュメント",
      "backend/structure": "コード構造",
      "backend/database": "データベースとモデル",
      "backend/authentication": "認証",
      "backend/api-handlers": "APIハンドラ",
      "backend/livekit": "LiveKit統合",
      "backend/deployment": "デプロイ",
      "backend/advanced": "高度なトピック",
      "api/authentication": "認証API",
      "api/rooms": "ルームAPI",
      "api/admin": "管理API",
      "api/passkeys": "パスキーAPI",
      "guides/development": "開発ワークフロー",
      "guides/deployment": "デプロイガイド",
      "guides/docker": "Dockerガイド",
      "guides/internal-tls": "内部TLS",
      "guides/makefile": "Makefileリファレンス",
      "guides/packages": "パッケージインストール",
      "guides/appliance": "アプライアンスモード",
      contributing: "貢献する",
    },
  },
  installPage: {
    meta: {
      title: "Bedrud Server のインストール - ワンコマンドデプロイ",
      description:
        "Bedrud をサーバーに1分以内でデプロイ。単一バイナリ、512MB RAM、Docker 不要。",
    },
    title: "Bedrud Server をインストール",
    subtitle:
      "サーバーにself-hostedサーバーを1分以内でデプロイ。1つのバイナリ、依存関係ゼロ。",
  },
  downloadPage: {
    meta: {
      title: "Bedrudをダウンロード - デスクトップ & モバイルアプリ",
      description:
        "Linux、macOS、Windows、Android、iOS用Bedrudをダウンロード。ネイティブアプリまたはゼロインストールブラウザアクセス。",
    },
    title: "Bedrudをダウンロード",
    subtitle:
      "全プラットフォーム向けネイティブアプリ。またはブラウザでミーティングリンクを開くだけ。",
    noInstall: "インストール不要。ダウンロード、実行可能ファイルにして、起動。",
    flathub: "Flathubからインストール",
    brew: "Homebrewでインストール",
    winget: "Windows Package Managerでインストール",
    installer: "インストーラー",
    portable: "ポータブル版",
    repoSetup: "リポジトリのセットアップが必要",
    appleSilicon: "Apple Silicon",
    intel: "Intel",
    githubReleases: "GitHubリリース",
    playStore: "Google Playで入手",
    appStore: "App Storeからダウンロード",
    sideload: "GitHubリリースからAPK/IPAをダウンロード",
    browserZero: "ゼロインストール",
    browserDesc:
      "Chrome、Firefox、Edge、Safariでミーティングリンクを開く。ダウンロード不要。",
    tryDemo: "ライブデモを試す",
    otherPlatforms: "全プラットフォームとパッケージマネージャーを見る",
    server: "サーバーインストール",
    serverDesc: "自前ハードウェアにBedrudサーバーをデプロイ。",
    serverGuide: "サーバーインストールガイド",
    quickInstall: "Quick install",
    heroClientTitle: "クライアント版",
    heroClientDesc:
      "全プラットフォーム向けネイティブデスクトップ & モバイルアプリ。",
    heroServerTitle: "サーバー版",
    heroServerDesc: "自前ハードウェアにBedrudサーバーをデプロイ。",
    heroAllPlatforms: "全プラットフォームを見る",
    dmgAppleSilicon: "Apple Silicon (.dmg)",
    dmgIntel: "Intel (.dmg)",
    serverDocker: "Docker",
    serverDockerDesc: "Dockerでコンテナとして実行。",
    serverBinary: "Linuxバイナリ",
    serverBinaryDesc: "Linux用ビルド済みバイナリをダウンロード。",
    serverQuickInstall: "クイックインストール",
    serverQuickInstallDesc: "1つのコマンド。1分以内。",
    serverHelm: "Kubernetes (Helm)",
    serverHelmDesc: "HelmでKubernetesにデプロイ。",
    resourcesTitle: "リソース",
    resourcesDocs: "ドキュメント",
    resourcesDocsDesc: "セットアップガイド、APIリファレンス、ハウツー。",
    resourcesCommunity: "コミュニティ",
    resourcesCommunityDesc: "ヘルプやフィードバックの共有。",
    resourcesChangelog: "変更履歴",
    resourcesChangelogDesc: "最新リリースと変更点。",
    platform: {
      linux: "Linux",
      mac: "macOS",
      windows: "Windows",
      android: "Android",
      ios: "iOS",
      browser: "ブラウザ",
    },
  },
  blog: {
    meta: {
      title: "ブログ - Bedrud",
      description:
        "Bedrud チームによるアップデート、エンジニアリングの深掘り、ガイド。",
    },
    title: "ブログ",
    subtitle:
      "Bedrud チームによるアップデート、エンジニアリングの深掘り、ガイド。",
    noPosts: "まだ投稿がありません。また後でチェックしてください！",
    backToBlog: "ブログに戻る",
    titleSuffix: " - Bedrudブログ",
    defaultAuthor: "Bedrudチーム",
  },
  skipToContent: "コンテンツへスキップ",
  mobileNav: {
    navigation: "ナビゲーション",
    language: "言語",
    getStarted: "はじめる",
    github: "GitHub",
  },
  featuresPage: {
    meta: {
      title: "機能 - Bedrud",
      description:
        "Bedrud の機能をご紹介：単一バイナリ、WebRTC 品質、ゲスト参加、パスキー、管理者コントロール、オーディオ処理、ボットエージェント、マルチプラットフォーム対応。",
    },
    title: "機能",
    subtitle: "各機能が本当の問題を解決します。",
    sectionTitle: "必要なものだけ、余計なものは一切なし",
    sectionSubtitle:
      "単一バイナリのビデオ会議インフラ。外部依存なし、シート課金なし、ベンダーロックインなし。",
    groups: {
      infra: "デプロイ & インフラ",
      media: "ミーティング & メディア",
      access: "アクセス & コントロール",
      extend: "拡張",
    },
    learnMore: "詳細を見る",
    stats: {
      ram: "512MB RAM",
      binary: "1 バイナリ",
      auth: "6 認証方式",
      platforms: "5 プラットフォーム",
    },
    guestJoin: {
      pain: "15分の通話のためにゲストにアカウント作成を強要するのにうんざりしていませんか？",
      title: "ゲスト参加 - アカウント不要",
      description:
        "リンクを共有、クリック、参加完了。登録フォームなし、パスワードなし、摩擦なし。セキュリティ用オプションのパスコード。",
    },
    singleBinary: {
      pain: "ビデオインフラのセットアップにDevOpsの学位が必要なはずがありません。",
      title: "単一バイナリデプロイ",
      description:
        "1回のダウンロード、1つのコマンド、実行中。Docker Composeなし、Kubernetesマニフェストなし、12ステップガイドなし。動作するバイナリだけ。",
      snippet: "$ curl -sSL bedrud.dev/install.sh | sh",
    },
    webrtc: {
      pain: "ラグ、フリーズ、または切断するビデオ通話はミーティングを台無しにします。",
      title: "WebRTC品質",
      description:
        "アダプティブビットレート、simulcast、SVC内蔵のWebRTCメディアサーバー。どの接続でもクリスタルクリアなビデオとオーディオ。",
    },
    passkeys: {
      pain: "パスワードは漏洩します。MFAトークンはフィッシングされます。",
      title: "パスキー + OAuth",
      description:
        "パスワードレス認証用のFIDO2パスキー。既存のIDプロバイダーでのSSO用のOAuth 2.0 / OIDC。侵害されるパスワードデータベースなし。",
    },
    admin: {
      pain: "良いツールなしで会議プラットフォームを管理するのは苦痛です。",
      title: "管理ダッシュボード",
      description:
        "ルーム管理、ユーザー管理、使用分析、設定 - すべてクリーンなWeb UIから。CLI推測なし。",
    },
    audio: {
      pain: "ミーティングの背景ノイズは気を散らし、非プロフェッショナルです。",
      title: "オーディオ処理",
      description:
        "RNNoise駆動の内蔵ノイズ抑制。プレミアムAIノイズ抑制用のオプションKrisp統合。すべての通話でクリーンなオーディオ。",
    },
    bots: {
      pain: "手動の会議タスクは時間を浪費します - 録画、文字起こし、メモ。",
      title: "ボットエージェント",
      description:
        "プログラマブルボットがGo SDK経由で会議に参加。文字起こし、翻訳、録画、CRM統合、カスタムワークフローを自動化。",
    },
    multiPlatform: {
      pain: "チームは異なるデバイスを使用しています。会議プラットフォームもそうあるべきです。",
      title: "マルチプラットフォーム",
      description:
        "Web (React)、Android (Kotlin)、iOS (Swift) のネイティブアプリ。一貫したエクスペリエンス、プラットフォームネイティブパフォーマンス。",
    },
    e2eEncryption: {
      pain: "サーバーを経由する会議内容はプライベートであるべきです。",
      title: "エンドツーエンド暗号化",
      description:
        "ルームのオプション E2E 暗号化。サーバーは暗号化メディアを中継するだけ - 参加者のみが復号できます。",
    },
    autoTls: {
      pain: "SSL証明書の設定にチュートリアルは不要なはずです。",
      title: "自動 TLS と HTTPS",
      description:
        "Let's Encrypt の自動プロビジョニングと更新。内部ネットワーク用の自己署名証明書。",
    },
    airGapped: {
      pain: "サーバーがインターネットに接続できない場合はどうしますか？",
      title: "エアギャップ＆オフライン対応",
      description:
        "ダウンロード後の外部リクエストゼロ。SQLite 内蔵。公共インターネットに接続しないインフラで動作。",
    },
  },
  demoPage: {
    meta: {
      title: "ライブデモ - Bedrud",
      description:
        "インストール不要で Bedrud をお試しください。今すぐライブデモ会議に参加できます。",
    },
    hero: {
      headline: "今すぐ Bedrud を試す",
      subtitle:
        "ブラウザでライブ会議に参加。アカウント不要、ダウンロード不要、待ち時間なし。",
    },
    cta: {
      tryNow: "ライブデモを開く",
      noInstall:
        "インストール不要。アカウント不要。コミットメント不要。クリックして参加。",
    },
    preview: {
      caption: "デモに参加すると表示される画面",
    },
    features: {
      instantJoin: {
        title: "即座に参加",
        description:
          "リンクをクリックするだけで参加できます。登録フォーム、メール認証、アプリのインストールは一切不要。すべてのモダンブラウザで動作します。",
      },
      noAccount: {
        title: "アカウント不要",
        description:
          "表示名を選んですぐに会話を始められます。終わったらタブを閉じるだけ。何も残りません。",
      },
      webrtc: {
        title: "本物の WebRTC 品質",
        description:
          "デモはセルフホスト版の Bedrud と同じエンジンを使用。サブ秒レイテンシ、アダプティブビットレート、クリスタルクリアな音声。",
      },
      e2e: {
        title: "エンドツーエンド暗号化",
        description:
          "ルーム設定で E2E 暗号化を有効にできます。動画と音声はブラウザを離れる前に暗号化されます。",
      },
    },
    faq: {
      whatHappens: {
        question: "デモで何ができますか？",
        answer:
          "Bedrud のフルスタックが稼働する共有会議ルームに参加します。ビデオ、音声、画面共有、チャット、会議コントロールをテストできます。セルフホスト版と全く同じです。",
      },
      dataSaved: {
        question: "データは保存されますか？",
        answer:
          "いいえ。デモではデータを永続化しません。退出するとセッションは消滅します。録画もチャット履歴も保存されません。",
      },
      duration: {
        question: "デモはどのくらい使えますか？",
        answer:
          "時間制限はありません。Bedrud を評価するのに必要なだけデモをご利用ください。永続的なセットアップが必要なら、セルフホストは60秒で完了します。",
      },
      inviteOthers: {
        question: "他の人をデモに招待できますか？",
        answer:
          "はい。デモリンクをチームメンバーと共有すれば、全員が同じルームに参加できます。デプロイ前にチームで Bedrud をテストするのに最適です。",
      },
    },
    selfHost: {
      text: "自分でサーバーを運用したいですか？",
      cta: "インストールガイドを読む",
    },
  },
  changelogPage: {
    meta: {
      title: "変更履歴 - Bedrud",
      description: "Bedrud のリリース履歴とアップデート情報。",
    },
    title: "変更履歴",
    subtitle: "Bedrudの新機能。アクティビティ = 信頼。",
    viewOnGithub: "GitHub で見る",
    noReleases: "リリースはまだありません。すぐにお戻りください！",
    error: "リリースの読み込みに失敗しました。",
    viewRelease: "GitHubで見る →",
  },
  contributorsPage: {
    meta: {
      title: "コントリビューター - Bedrud",
      description: "Bedrud を開発している人々を紹介します。",
    },
    title: "コントリビューター",
    subtitle: "Bedrud はコミュニティによって構築されています。",
    joinThem: "彼らに参加",
    joinCta: "GitHubで貢献",
    contributions: "貢献",
    error: "コントリビューターの読み込みに失敗しました。",
  },
  contactPage: {
    meta: {
      title: "お問い合わせ - Bedrud",
      description: "Bedrud チームにお問い合わせください。",
    },
    title: "お問い合わせ",
    subtitle: "これらのチャネルのいずれかからお問い合わせください。",
    github: {
      title: "GitHub Issues",
      description: "バグ報告、機能リクエスト、コード貢献。",
      cta: "Issueを開く",
    },
    discord: {
      title: "コミュニティチャット",
      description:
        "質問をし、アイデアを共有し、コミュニティから助けを得てください。",
      cta: "Discordに参加",
    },
    email: {
      title: "メール",
      description:
        "パートナーシップ、セキュリティ問題、またはプライベートなお問い合わせ用。",
      cta: "メール送信",
    },
  },
  aboutPage: {
    meta: {
      title: "Bedrudについて",
      description:
        "Bedrudのチームとミッションについて - すべての人のためのオープンソースビデオ会議。",
    },
    title: "Bedrudについて",
    subtitle:
      "プライバシーがデフォルトであるべきだと信じる人々によるオープンソースビデオ会議。",
    mission: {
      title: "私たちのミッション",
      text: "Bedrudが生まれた理由は、ビデオ会議のためにビッグテックにデータを渡す必要はないからです。単一バイナリ、安価なVPS、オープンソースコードが数百万ドルのSaaS契約に取って代わると信じています - 品質や機能を犠牲にすることなく。プライバシーは機能ではない。それは基盤です。",
    },
    team: {
      title: "コアチーム",
      subtitle: "Bedrudの背後にいる人々。",
    },
    error: "チームメンバーの読み込みに失敗しました。",
  },
  notFound: {
    title: "ページが見つかりません",
    description: "お探しのページは存在しないか、移動されました。",
    backToHome: "ホームに戻る",
  },
  a11y: {
    toggleTheme: "テーマ切替",
    breadcrumb: "パンくずリスト",
    articleNav: "記事ナビゲーション",
  },
  mockups: {
    terminal: {
      title: "ターミナル",
      downloading: "✓ bedrud v0.12.3 をダウンロード中...",
      installing: "✓ /usr/local/bin にインストール中...",
      ready: "✓ Bedrud準備完了！ (512MB RAM)",
    },
    invite: {
      shareLink: "ミーティングリンクを共有",
      sendEmail: "メールで送信",
      copyLink: "リンクをコピー",
      or: "または",
      meetingTitle: "チーム定例",
      today: "今日、午後2:00",
      duration: "30分",
      participants: "参加者5人",
      noAccount: "アカウント不要",
      anyBrowser: "すべてのブラウザで動作",
    },
    meeting: {
      title: "チーム定例",
      micOn: "マイクオン",
      cameraOn: "カメラオン",
      shareScreen: "画面共有",
      raiseHand: "手を挙げる",
      chat: "チャット",
      leaveCall: "通話を終了",
    },
    preview: {
      title: "チーム定例",
      you: "あなた",
      chat: "チャット",
      messagePlaceholder: "メッセージ...",
      chatMsg1: "Q4のデッキを共有します",
      chatMsg2: "素晴らしい！",
      chatMsg3: "スライド4を見てもいい？",
    },
    scale: {
      overview: "概要",
      last30Days: "過去30日間",
      meetings: "ミーティング",
      uptime: "稼働時間",
      availability: "可用性",
      activeUsers: "アクティブユーザー",
      unlimitedUsers: "ユーザー数無制限",
      noPerSeat: "シート課金なし",
      costPerSeat: "シートあたりのコスト：",
      costFree: "$0.00",
    },
  },
};
