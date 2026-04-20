export default {
  meta: {
    title: "Bedrud - Общайтесь с людьми, а не с платформой",
    description:
      "Self-hosted видеовстречи. Один бинарник. 512 МБ ОЗУ. Open source, лицензия Apache 2.0.",
  },
  nav: {
    home: "Главная",
    features: "Возможности",
    compare: "Сравнение",
    platforms: "Платформы",
    openSource: "Open Source",
    install: "Установка",
    download: "Скачать",
    blog: "Блог",
    docs: "Документация",
    community: "Сообщество",
    demo: "Демо",
    getStarted: "Начать",
  },
  hero: {
    badge: "Open Source · Лицензия Apache 2.0",
    kicker: "Open-source альтернатива Zoom. Работает на VPS за $5.",
    headline: "Ваши встречи. Ваш сервер. Ваши правила.",
    subheadline:
      "Self-hosted видеовстречи на вашем железе. Один бинарник, 512 МБ ОЗУ, 60 секунд на установку. От приватных звонков до трансляций на тысячи зрителей.",
    trustBar: "Более 10 000 разработчиков и команд, ценящих приватность.",
    installMicrocopy: "Вставьте в терминал. Готово через 60 секунд.",
    tryDemo: "Попробовать без установки",
    installNow: "Копировать команду установки",
    objectionBullets: {
      screenSharing: "Демонстрация экрана и запись",
      sso: "Интеграция SSO и OIDC",
      webrtc: "На базе WebRTC, задержка менее секунды",
    },
    viewOnGithub: "Смотреть на GitHub",
    copied: "Скопировано!",
    stars: "1.2k",
    starsLabel: "Звезд на GitHub",
    contributorsLabel: "контрибьюторов",
    license: "Лицензия Apache 2.0",
  },
  journey: {
    title: "От нуля до встречи за минуты",
    subtitle:
      "Установите. Поделитесь ссылкой. Начинайте говорить. Вот как это выглядит.",
    install: {
      title: "Возьмите сервер и выполните одну команду",
      description:
        "Любой VPS за $5 с 1 ГБ ОЗУ. Вставьте скрипт установки в терминал. Через 60 секунд Bedrud запущен. Без Docker, без конфигов, без привязки к облакам.",
    },
    invite: {
      title: "Поделитесь ссылкой",
      description:
        "Отправьте ссылку команде. Без аккаунтов, установки приложений и расширений. Гости кликают и мгновенно присоединяются из любого браузера.",
    },
    host: {
      title: "Начните проводить встречи",
      description:
        "WebRTC-видео с субсекундной задержкой и шумоподавлением - даже на медленных каналах. Демонстрация экрана, запись и чат в реальном времени - всё включено.",
    },
  },
  problem: {
    title: "Ваши встречи стоят слишком дорого",
    subtitle:
      "Корпоративные видеоплатформы годами заламывали цены. Вот почему разработчики уходят.",
    perSeatPricing: {
      title: "Оплата за пользователя - ловушка",
      description:
        "Zoom, Teams, Meet берут плату за пользователя. Вырастите с 10 до 100 человек - счет увеличится в 10 раз. А теперь умножьте на отделы, подрядчиков и гостей. Вы сливаете бюджет на инструмент, который используют 30 минут в день.",
    },
    vendorLockIn: {
      title: "Привязка к вендору убивает независимость",
      description:
        "Записи, транскрипты, данные участников - всё на чужих серверах. Когда провайдер поднимет цены, уберет функции или утечет данные - у вас нет пути назад.",
    },
    selfHostedNightmare: {
      title: "Self-hosted варианты - это кошмар",
      description:
        "Jitsi требует 8+ Docker-контейнеров. BigBlueButton - 8 ГБ ОЗУ. Ни один не ставится за час. И дебажить это в пятницу вечером - так себе план.",
    },
  },
  comparison: {
    title: "Сравнение Bedrud",
    subtitle: "Один бинарник. Минимум ресурсов. Все функции.",
    feature: "Функция",
    bedrud: "Bedrud",
    jitsi: "Jitsi Meet",
    bbb: "BigBlueButton",
    sections: {
      deployment: "Развертывание",
      features: "Возможности",
      integrations: "Интеграции и Масштабирование",
      licensing: "Лицензирование и Сообщество",
    },
    rows: {
      deploy: "Установка",
      deployBedrud: "Один бинарник",
      deployJitsi: "Docker Compose (8+ контейнеров)",
      deployBbb: "Сервер мин. 8 ГБ ОЗУ",
      ram: "Потребление ОЗУ",
      ramBedrud: "512 МБ",
      ramJitsi: "~2 ГБ",
      ramBbb: "~4 ГБ+",
      install: "Время установки",
      installBedrud: "Менее 1 мин.",
      installJitsi: "~15 минут",
      installBbb: "~30 минут + настройка",
      nativeClients: "Платформы",
      nativeClientsBedrud: "Web, Android, iOS",
      nativeClientsJitsi: "Web, Android, iOS",
      nativeClientsBbb: "Только Web",
      guestJoin: "Гостевой доступ",
      guestJoinBedrud: "Мгновенно",
      guestJoinJitsi: "Да",
      guestJoinBbb: "Требуется одобрение модератора",
      audioProcessing: "Шумоподавление",
      audioProcessingBedrud: "Продвинутое",
      audioProcessingJitsi: "Базовое",
      audioProcessingBbb: "Базовое",
      screenShare: "Демонстрация экрана",
      screenShareBedrud: "Встроено",
      screenShareJitsi: "Встроено",
      screenShareBbb: "Встроено",
      recording: "Запись",
      recordingBedrud: "На сервере",
      recordingJitsi: "Через Jibri",
      recordingBbb: "Встроено + экспорт",
      sipIntegration: "Интеграция SIP",
      sipIntegrationBedrud: "Нет",
      sipIntegrationJitsi: "Шлюз SIP/Jibri",
      sipIntegrationBbb: "Шлюз SIP",
      whiteboard: "Интерактивная доска",
      whiteboardBedrud: "Нет",
      whiteboardJitsi: "Нет",
      whiteboardBbb: "Встроено",
      maxUsers: "Макс. пользователей",
      maxUsersBedrud: "50+ на комнату",
      maxUsersJitsi: "100+ с тюнингом",
      maxUsersBbb: "300+ на комнату",
      license: "Лицензия",
      licenseBedrud: "Apache 2.0",
      licenseJitsi: "Apache 2.0",
      licenseBbb: "LGPL 3.0",
      communitySize: "Сообщество",
      communitySizeBedrud: "Растущее",
      communitySizeJitsi: "Большое, зрелое",
      communitySizeBbb: "Академическое",
    },
  },
  features: {
    title: "Всё необходимое. Ничего лишнего.",
    subtitle:
      "От звонков на двоих до трансляций на 20 000 зрителей. Тот же бинарник, ваше железо, ноль раздутости.",
    oneCommandDeploy: {
      title: "Установка одной командой",
      description:
        "Ноль зависимостей. Одна строка в терминале - Bedrud запущен через 60 секунд. Без Docker, без Kubernetes, без админов.",
    },
    fiveDollarVps: {
      title: "Работает на VPS за $5",
      description:
        "~200 МБ ОЗУ в простое (512 МБ мин.). Hetzner, DigitalOcean, AWS Lightsail или свое железо - те же функции за копейки.",
    },
    webrtcLatency: {
      title: "Субсекундная задержка WebRTC",
      description:
        "Встроенный медиасервер WebRTC с адаптивным битрейтом. Кристально чистое видео и аудио даже на плохих каналах. Без проксирования через чужие серверы.",
    },
    enterpriseSso: {
      title: "Корпоративный SSO и OIDC",
      description:
        "Подключите свой IdP за минуты. Passkeys, OAuth 2.0, OIDC из коробки. Больше никаких баз паролей, которые можно украсть.",
    },
    guestJoin: {
      title: "Гостевой доступ — без аккаунта",
      description:
        "Поделитесь ссылкой — гость кликнет и войдёт. Без форм регистрации, паролей и установки приложений. Работает в любом современном браузере.",
    },
    recording: {
      title: "Встроенная запись и демонстрация экрана",
      description:
        "Записывайте встречи и делитесь экраном. Записи сохраняются на вашем сервере — не в чужом облаке.",
    },
  },
  install: {
    title: "Одна команда. Готово.",
    subtitle: "Одна команда. Шестьдесят секунд. Вы внутри.",
    command: "curl -fsSL https://get.bedrud.org | bash",
    powershellCommand: "irm https://get.bedrud.org/install.ps1 | iex",
    dockerCommand: "docker pull ghcr.io/bedrud-ir/bedrud:latest",
    or: "или",
    whatItDoes:
      "Downloads the Bedrud CLI binary to ~/bin and adds it to your PATH.",
    flagsTitle: "Key Flags",
    flagsDesc: "Description",
    flagVersion: "Install a specific version (e.g. 0.12.0)",
    flagInstallDir: "Custom install directory (default: ~/bin)",
    flagSkipShell: "Skip modifying shell config files",
    requirements: "Работает на 64-битных Linux, macOS, Windows с 512 МБ ОЗУ.",
    fullDocsLink: "Full CLI installer docs",
    fullServerDocsLink: "Full server installation guide",
    dockerGuideLink: "Docker setup guide",
    githubReleases: "Download binary from GitHub Releases",
  },
  platforms: {
    title: "Нативные приложения, не веб-обертки",
    subtitle:
      "Настоящие нативные приложения - React на web, Kotlin на Android, Swift на iOS, Rust на десктопе, Go на сервере. Без Electron, без Cordova, без компромиссов.",
    web: { title: "Web", tech: "React + TypeScript" },
    android: { title: "Android", tech: "Kotlin + Compose" },
    ios: { title: "iOS", tech: "Swift + SwiftUI" },
    desktop: { title: "Десктоп", tech: "Rust + Slint" },
    server: { title: "Сервер", tech: "Go + WebRTC" },
    bots: { title: "Боты", tech: "Python SDK" },
    status: "В продакшене",
  },
  openSource: {
    title: "Читайте исходники. Управляйте процессом.",
    subtitle:
      "Каждая строка кода публична. Изучайте, проверяйте, вносите вклад или форкайте и стройте свое. Лицензия Apache 2.0 - используйте коммерчески или как угодно.",
    license: "Apache 2.0",
    github: "Смотреть на GitHub",
    docs: "Читать документацию",
  },
  cta: {
    title: "Хватит арендовать встречи",
    subtitle:
      "Установите на VPS за $5 за 60 секунд. Без карты, без привязки к вендору, без чужих серверов.",
    installNow: "Развернуть сервер",
    getStarted: "Читать Quickstart",
    readDocs: "Смотреть Quickstart",
    starGithub: "Звезда на GitHub",
    copied: "Скопировано!",
  },
  faq: {
    title: "Часто задаваемые вопросы",
    subtitle: "Прямые ответы на вопросы разработчиков.",
    serverPower: {
      question: "Насколько мощным должен быть сервер?",
      answer:
        "VPS за $5/мес с 1 ГБ ОЗУ достаточно. Bedrud использует 512 МБ ОЗУ. Для 50+ пользователей берите 2 ГБ.",
    },
    installCommand: {
      question: "Что делает команда установки?",
      answer:
        "Скачивает бинарник в /usr/local/bin. Без Docker и скрытых зависимостей.",
    },
    recordingScreenSharing: {
      question: "Поддерживается ли запись и демонстрация экрана?",
      answer:
        "Да. Встроено. Записи сохраняются на вашем сервере. Боты могут транскрибировать встречи.",
    },
    migrate: {
      question: "Можно перейти с Zoom или Teams?",
      answer:
        "Да. Bedrud работает параллельно с вашими текущими инструментами. Импортируйте команду, настройте SSO и начинайте миграцию встреч в своём темпе. Никакой привязки данных, никогда.",
    },
    pricing: {
      question: "Это действительно бесплатно?",
      answer:
        "Полностью. Лицензия Apache 2.0, никаких ограничений функций, никаких кнопок 'Связаться с отделом продаж'. Исходный код открыт. Размещайте самостоятельно и платите только за сервер — обычно $5/мес.",
    },
    mobile: {
      question: "Есть мобильные приложения?",
      answer:
        "Да. Нативные приложения для Android (Kotlin) и iOS (Swift), а также десктопные приложения на Rust. Не веб-обёртки — настоящая нативная производительность.",
    },
  },
  footer: {
    brand: "Bedrud",
    tagline:
      "Видеовстречи для команд, ценящих приватность. Self-hosted или облако.",
    platform: "Платформа",
    features: "Возможности",
    compare: "Сравнение",
    demo: "Живое демо",
    docs: "Документация",
    api: "Справочник API",
    install: "Установка",
    download: "Скачать",
    about: "О нас",
    resources: "Ресурсы",
    blog: "Блог",
    changelog: "История изменений",
    contribute: "Внести вклад",
    reportIssue: "Сообщить о проблеме",
    contact: "Контакты",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    social: {
      github: "GitHub",
      twitter: "X (Twitter)",
    },
  },
  featuresPage: {
    meta: {
      title: "Возможности - Bedrud",
      description:
        "Видеовстречи на вашем сервере: WebRTC, TURN, E2E шифрование, боты и 5 нативных платформ в одном бинарнике.",
    },
    title: "Вся инфраструктура встреч. Один бинарник.",
    subtitle:
      "API-сервер, веб-UI, WebRTC медиасервер, TURN-ретранслятор и база данных - в одном пакете. Ноль исходящих запросов после скачивания.",
    sectionTitle: "Всё необходимое, ничего лишнего",
    sectionSubtitle:
      "Инфраструктура видеовстреч в одном бинарнике. Без внешних зависимостей, оплаты за пользователя и привязки к вендору.",
    groups: {
      infra: "Развертывание и Инфраструктура",
      media: "Встречи и Медиа",
      access: "Доступ и Контроль",
      extend: "Расширения",
    },
    learnMore: "Узнать больше",
    stats: {
      ram: "512 МБ ОЗУ",
      binary: "1 бинарник",
      auth: "6 методов авторизации",
      platforms: "5 платформ",
    },
    guestJoin: {
      pain: "Устали заставлять гостей создавать аккаунты?",
      title: "Гостевой вход",
      description:
        "Поделитесь ссылкой, они кликают - и внутри. Без регистраций.",
    },
    singleBinary: {
      pain: "Настройка видеоинфраструктуры - это боль.",
      title: "Один бинарник",
      description: "Без Docker, Redis, Node.js. Скачайте и запустите.",
      snippet: "$ curl -sSL bedrud.dev/install.sh | sh",
    },
    webrtc: {
      pain: "Лагающее видео рушит встречи.",
      title: "WebRTC со встроенным TURN",
      description:
        "Субсекундная задержка. Встроенный TURN обрабатывает подключения без внешней инфраструктуры.",
    },
    passkeys: {
      pain: "Пароли утекают.",
      title: "6 методов авторизации",
      description:
        "FIDO2 passkeys, OAuth (Google/GitHub/Twitter) и гостевой доступ. JWT токены.",
    },
    admin: {
      pain: "Управлять платформой без хороших инструментов сложно.",
      title: "Панель администратора",
      description: "Управление пользователями, комнатами, кик, мут из веб-UI.",
    },
    audio: {
      pain: "Фоновый шум отвлекает.",
      title: "Встроенное шумоподавление",
      description: "Подавление шума RNNoise и опциональный Krisp AI.",
    },
    bots: {
      pain: "Рутинные задачи на встречах тратят время.",
      title: "Боты-агенты",
      description:
        "Стриминг музыки, транскрипция, CRM интеграции через Python SDK.",
    },
    multiPlatform: {
      pain: "Разные устройства в команде.",
      title: "5 нативных платформ",
      description:
        "Web (React), Android (Kotlin), iOS (SwiftUI), Desktop (Rust).",
    },
    e2eEncryption: {
      pain: "Контент должен оставаться приватным.",
      title: "E2E шифрование",
      description:
        "Опциональное E2E шифрование. Сервер только ретранслирует зашифрованные данные.",
    },
    autoTls: {
      pain: "SSL-сертификаты требуют настройки.",
      title: "Авто-TLS и HTTPS",
      description:
        "Автоматическое получение Let's Encrypt или самоподписанные сертификаты.",
    },
    airGapped: {
      pain: "Серверы без доступа в интернет?",
      title: "Air-Gapped и офлайн",
      description:
        "Ноль исходящих запросов. Встроенный SQLite. Работает в изолированных сетях.",
    },
  },
  demoPage: {
    meta: {
      title: "Живое демо - Bedrud",
      description:
        "Попробуйте Bedrud без установки. Присоединяйтесь к демо-встрече прямо сейчас.",
    },
    hero: {
      headline: "Попробуйте Bedrud прямо сейчас",
      subtitle: "Встреча в браузере. Без аккаунта и загрузок.",
    },
    cta: {
      tryNow: "Открыть демо",
      noInstall: "Без установки и регистрации. Кликните и общайтесь.",
    },
    preview: {
      caption: "Что вы увидите при подключении",
    },
    features: {
      instantJoin: {
        title: "Мгновенное подключение",
        description:
          "Кликните по ссылке - и вы внутри. Без форм регистрации, подтверждения email и установки приложений. Работает в любом современном браузере.",
      },
      noAccount: {
        title: "Без аккаунта",
        description:
          "Выберите отображаемое имя и начинайте общаться. Закройте вкладку - ничего не останется.",
      },
      webrtc: {
        title: "Настоящее WebRTC качество",
        description:
          "Демо работает на том же движке, что и self-hosted Bedrud. Субсекундная задержка, адаптивный битрейт, кристально чистый звук.",
      },
      e2e: {
        title: "E2E шифрование",
        description:
          "Включите E2E шифрование в настройках комнаты. Ваше видео и аудио шифруются до того, как покинут браузер.",
      },
    },
    faq: {
      whatHappens: {
        question: "Что происходит в демо?",
        answer:
          "Вы подключаетесь к общей комнате с полным стеком Bedrud. Тестируйте видео, аудио, демонстрацию экрана, чат и управление встречей - то же самое, что и self-hosted.",
      },
      dataSaved: {
        question: "Мои данные сохраняются?",
        answer:
          "Нет. Демо ничего не сохраняет. Когда вы уходите, сессия исчезает. Никаких записей, никаких логов чата.",
      },
      duration: {
        question: "Как долго я могу использовать демо?",
        answer:
          "Без ограничений по времени. Пользуйтесь, пока не оцените Bedrud. Когда захотите постоянное решение - self-hosting занимает 60 секунд.",
      },
      inviteOthers: {
        question: "Могу ли я пригласить других?",
        answer:
          "Да. Поделитесь ссылкой демо с коллегами - все попадут в одну комнату. Отличный способ протестировать Bedrud с командой перед развертыванием.",
      },
    },
    selfHost: {
      text: "Предпочитаете свой сервер?",
      cta: "Руководство по установке",
    },
  },
  changelogPage: {
    meta: {
      title: "История изменений - Bedrud",
      description: "История релизов и обновления Bedrud.",
    },
    title: "История изменений",
    subtitle: "Что нового в Bedrud.",
    viewOnGithub: "Смотреть на GitHub",
    noReleases: "Пока нет релизов.",
    error: "Не удалось загрузить релизы.",
    viewRelease: "Смотреть на GitHub \u2192",
  },
  contributorsPage: {
    meta: {
      title: "Контрибьюторы - Bedrud",
      description: "Люди, создающие Bedrud.",
    },
    title: "Контрибьюторы",
    subtitle: "Bedrud создается сообществом.",
    joinThem: "Присоединяйтесь",
    joinCta: "Внести вклад на GitHub",
    contributions: "коммитов",
    error: "Не удалось загрузить контрибьюторов.",
  },
  contactPage: {
    meta: {
      title: "Контакты - Bedrud",
      description: "Свяжитесь с командой Bedrud.",
    },
    title: "Контакты",
    subtitle: "Свяжитесь с нами через любой из каналов.",
    github: {
      title: "Issues на GitHub",
      description: "Баг-репорты, запросы фич и код.",
      cta: "Открыть Issue",
    },
    discord: {
      title: "Чат сообщества",
      description: "Вопросы, идеи и помощь от сообщества.",
      cta: "Присоединиться к Discord",
    },
    email: {
      title: "Email",
      description: "Партнерство, вопросы безопасности или приватные обращения.",
      cta: "Отправить Email",
    },
  },
  privacy: {
    meta: {
      title: "Политика конфиденциальности - Bedrud",
      description: "Как Bedrud обрабатывает данные.",
    },
    title: "Политика конфиденциальности",
    lastUpdated: "Обновлено: 17 апреля 2026 г.",
    intro:
      "Bedrud - open-source ПО для видеовстреч. При self-hosted ваши данные никогда не касаются наших серверов. Эта политика касается сайта bedrud.org и публичного демо. Если вы разворачиваете Bedrud сами - вы контролируете свои данные.",
    dataCollection: {
      title: "Что мы собираем",
      content:
        "На сайте (bedrud.org): ничего. Ни куки, ни трекеров, ни аналитики. В публичном демо: ваше отображаемое имя и IP, пока вы подключены. И всё. Ни email, ни телефона, ни личных данных. При self-hosted все данные остаются на вашей инфраструктуре. Мы их не видим.",
    },
    dataUsage: {
      title: "Как мы используем данные",
      content:
        "Данные подключения демо нужны только для маршрутизации видео и аудио в реальном времени. Мы не логируем, не храним и не анализируем их. Не строим профили, не показываем рекламу, не продаем данные.",
    },
    dataStorage: {
      title: "Хранение данных",
      content:
        "Публичное демо не сохраняет данные. Отключились - сессия исчезла. Никаких записей, никакой истории чата. Self-hosted экземпляры хранят данные в SQLite на вашем сервере. Вы выбираете стратегию бэкапов и хранения. У нас нет доступа.",
    },
    thirdParties: {
      title: "Сторонние сервисы",
      content:
        "Никаких. Bedrud делает ноль исходящих запросов после скачивания. Никакой аналитики, крэш-репортеров или телеметрии. Сайт не загружает сторонние скрипты. Проверьте сами - исходники на GitHub.",
    },
    cookies: {
      title: "Cookies",
      content:
        "Сайт использует localStorage для настройки темы (темная/светлая) и выбора языка. Всё. Никаких трекинговых куки. Демо использует сессионную куки, которая удаляется при закрытии вкладки.",
    },
    yourRights: {
      title: "Ваши права",
      content:
        "Мы не собираем персональные данные - поэтому нечего запрашивать, исправлять или удалять. Закройте вкладку демо, и данных уже нет. Self-hosted пользователи полностью контролируют свои данные - экспорт, бэкап, удаление, что угодно.",
    },
    changes: {
      title: "Изменения политики",
      content:
        "Мы обновим эту страницу, если практики обработки данных изменятся. Учитывая, что мы почти ничего не собираем, изменения маловероятны. Дата наверху отражает последнюю редакцию.",
    },
    contact: {
      title: "Контакты",
      content:
        "Вопросы? Откройте issue на GitHub или напишите на privacy@bedrud.com. Мы также в Discord, если предпочитаете живой чат.",
    },
  },
  terms: {
    meta: {
      title: "Условия использования - Bedrud",
      description:
        "Условия использования сайта. Self-hosted по лицензии Apache 2.0.",
    },
    title: "Условия использования",
    lastUpdated: "Обновлено: 17 апреля 2026 г.",
    intro: "Условия для сайта bedrud.org и демо.",
    acceptance: {
      title: "Согласие",
      content: "Использование сайта означает согласие.",
    },
    services: {
      title: "Услуги",
      content: "Предоставляем документацию и демо. ПО доступно под Apache 2.0.",
    },
    accounts: {
      title: "Аккаунты",
      content: "Сайт и демо не требуют аккаунтов.",
    },
    acceptableUse: {
      title: "Использование",
      content: "Не злоупотребляйте публичным демо.",
    },
    intellectualProperty: {
      title: "Лицензия",
      content: "Bedrud лицензирован под Apache 2.0.",
    },
    termination: {
      title: "Доступ",
      content: "Можем закрыть доступ к демо за нарушения.",
    },
    liability: {
      title: "Без гарантий",
      content: "Предоставляется 'как есть'.",
    },
    governingLaw: {
      title: "Право",
      content: "Регулируется применимым законодательством.",
    },
    changes: {
      title: "Обновления",
      content: "Мы можем обновлять условия.",
    },
    contact: {
      title: "Контакты",
      content: "legal@bedrud.com или GitHub.",
    },
  },
  docs: {
    documentation: "Документация",
    onThisPage: "На этой странице",
    previous: "Назад",
    next: "Вперед",
    backToHome: "На главную",
    searchPlaceholder: "Поиск по документации\u2026",
    searchButton: "Найти",
    noResults: "Ничего не найдено",
    loading: "Загрузка\u2026",
    pressShortcut: "Нажмите",
    clearSearch: "Очистить поиск",
    searchDocs: "Искать в документации",
    notFound: "Документ не найден",
    searchError: "Ошибка поиска.",
    titleSuffix: " - Bedrud",
    diagramError: "Ошибка диаграммы",
    toggleMenu: "Меню",
    sections: {
      gettingStarted: "С чего начать",
      architecture: "Архитектура",
      backend: "Бэкенд",
      api: "API",
      guides: "Руководства",
      contributing: "Участие",
    },
    mdx: {
      systemdServices: {
        title: "Сервисы Systemd",
        description: "Установщик создает два сервиса:",
        headerService: "Сервис",
        headerCommand: "Команда",
        headerPurpose: "Назначение",
        purposeApi: "API + web",
        purposeMedia: "Медиасервер",
      },
      createAdmin: {
        title: "Выдать права администратора",
        registerViaWeb: "Зарегистрируйтесь через веб-UI, затем выдайте права:",
        createDirectly: "Или создайте админа напрямую:",
      },
      installerSteps: {
        title: "Что делает установщик",
        description: "При установке происходит следующее:",
        headerStep: "Шаг",
        headerAction: "Действие",
        step1Action: "Создает директории:",
        step2Action: "Копирует бинарник в",
        step3Action: "Генерирует config.yaml",
        step4Action: "Генерирует livekit.yaml",
        step5Action: "Создает сервисы systemd:",
        step6Action: "Включает и запускает сервисы",
        step7Action: "Инициализирует SQLite и сертификаты",
      },
    },
    sidebarItems: {
      "getting-started/quickstart": "Быстрый старт",
      "getting-started/cli-installer": "CLI Installer",
      "getting-started/installation": "Установка сервера",
      "getting-started/clients": "Установка клиентов",
      "getting-started/configuration": "Конфигурация",
      "getting-started/cli-reference": "Справочник CLI",
      "architecture/overview": "Обзор архитектуры",
      "architecture/server": "Архитектура сервера",
      "architecture/web": "Веб-фронтенд",
      "architecture/android": "Приложение Android",
      "architecture/ios": "Приложение iOS",
      "architecture/desktop": "Десктопное приложение",
      "architecture/agents": "Боты-агенты",
      "architecture/webrtc-connectivity": "Подключение WebRTC",
      "architecture/turn-server": "TURN-сервер",
      "backend/overview": "Документация бэкенда",
      "backend/structure": "Структура кода",
      "backend/database": "База данных",
      "backend/authentication": "Аутентификация",
      "backend/api-handlers": "API обработчики",
      "backend/livekit": "Интеграция LiveKit",
      "backend/deployment": "Развертывание",
      "backend/advanced": "Продвинутые темы",
      "api/authentication": "API аутентификации",
      "api/rooms": "API комнат",
      "api/admin": "API администратора",
      "api/passkeys": "API Passkeys",
      "guides/development": "Разработка",
      "guides/deployment": "Руководство по развертыванию",
      "guides/docker": "Руководство по Docker",
      "guides/internal-tls": "Внутренний TLS",
      "guides/makefile": "Справочник Makefile",
      "guides/packages": "Установка пакетов",
      "guides/appliance": "Режим Appliance",
      contributing: "Участие в разработке",
    },
  },
  installPage: {
    meta: {
      title: "Установка Bedrud Server - Развертывание одной командой",
      description: "Разверните Bedrud менее чем за минуту. Один бинарник.",
    },
    title: "Установка Bedrud Server",
    subtitle:
      "Разверните self-hosted сервер на вашем сервере менее чем за минуту.",
  },
  downloadPage: {
    meta: {
      title: "Скачать Bedrud",
      description: "Скачайте Bedrud для Linux, macOS, Windows, Android, iOS.",
    },
    title: "Скачать Bedrud",
    subtitle:
      "Нативные приложения для каждой платформы. Или используйте браузер.",
    noInstall:
      "Установка не требуется. Скачайте, сделайте исполняемым, запустите.",
    flathub: "Установить из Flathub",
    brew: "Установить через Homebrew",
    winget: "Установить через Winget",
    installer: "Установщик",
    portable: "Портативная",
    repoSetup: "Требуется настройка репозитория",
    appleSilicon: "Apple Silicon",
    intel: "Intel",
    githubReleases: "Релизы GitHub",
    playStore: "Google Play",
    appStore: "App Store",
    sideload: "Скачать APK/IPA",
    browserZero: "Без установки",
    browserDesc: "Откройте ссылку на встречу в Chrome, Firefox, Edge, Safari.",
    tryDemo: "Живое демо",
    otherPlatforms: "Смотреть все платформы",
    server: "Установка сервера",
    serverDesc: "Разверните сервер Bedrud на своем оборудовании.",
    serverGuide: "Руководство по серверу",
    quickInstall: "Quick install",
    heroClientTitle: "Клиент",
    heroClientDesc: "Нативные десктопные и мобильные приложения.",
    heroServerTitle: "Сервер",
    heroServerDesc: "Разверните сервер Bedrud.",
    heroAllPlatforms: "Смотреть все платформы",
    dmgAppleSilicon: "Apple Silicon (.dmg)",
    dmgIntel: "Intel (.dmg)",
    serverDocker: "Docker",
    serverDockerDesc: "Запустить в контейнере Docker.",
    serverBinary: "Бинарник Linux",
    serverBinaryDesc: "Готовые бинарники для Linux.",
    serverQuickInstall: "Быстрая установка",
    serverQuickInstallDesc: "Одна команда. Менее минуты.",
    serverHelm: "Kubernetes (Helm)",
    serverHelmDesc: "Развернуть с помощью Helm.",
    resourcesTitle: "Ресурсы",
    resourcesDocs: "Документация",
    resourcesDocsDesc: "Руководства, API, инструкции.",
    resourcesCommunity: "Сообщество",
    resourcesCommunityDesc: "Помощь и отзывы.",
    resourcesChangelog: "История изменений",
    resourcesChangelogDesc: "Последние релизы.",
    platform: {
      linux: "Linux",
      mac: "macOS",
      windows: "Windows",
      android: "Android",
      ios: "iOS",
      browser: "Браузер",
    },
  },
  aboutPage: {
    meta: {
      title: "О Bedrud",
      description:
        "Команда и миссия Bedrud - open-source видеовстречи для всех.",
    },
    title: "О Bedrud",
    subtitle:
      "Open-source видеовстречи от людей, которые верят, что приватность должна быть по умолчанию.",
    mission: {
      title: "Наша миссия",
      text: "Bedrud существует, потому что видеовстречи не должны требовать передачи данных Big Tech. Мы верим, что один бинарник, дешевый VPS и open-source код могут заменить миллионные SaaS-контракты - без потери качества и функций. Приватность - не фича. Это фундамент.",
    },
    team: {
      title: "Основная команда",
      subtitle: "Люди, создающие Bedrud.",
    },
    error: "Ошибка загрузки участников команды.",
  },
  blog: {
    meta: {
      title: "Блог - Bedrud",
      description: "Обновления, инженерные разборы и руководства.",
    },
    title: "Блог",
    subtitle: "Обновления и руководства от команды Bedrud.",
    noPosts: "Пока нет постов.",
    backToBlog: "Вернуться в блог",
    titleSuffix: " - Блог Bedrud",
    defaultAuthor: "Команда Bedrud",
  },
  skipToContent: "Перейти к контенту",
  a11y: {
    toggleTheme: "Переключить тему",
    breadcrumb: "Навигация",
    articleNav: "Навигация по статье",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    navigationMenu: "Меню навигации",
    changeLanguage: "Сменить язык",
    discordCommunity: "Сообщество Discord",
  },
  whyBedrud: {
    title: "Почему Bedrud?",
    subtitle: "Self-hosted встречи без компромиссов.",
    noLockIn: {
      title: "Нет привязки к вендору",
      description:
        "Данные остаются на вашем сервере. Никаких проприетарных форматов, никаких принудительных миграций. Экспортируйте всё в любой момент.",
    },
    singleBinary: {
      title: "Простота одного бинарника",
      description:
        "Один файл. Без Docker, Redis и конфиг-ада. Скачали, запустили, готово.",
    },
    noPerSeat: {
      title: "Нет платы за пользователя",
      description:
        "Безлимитно пользователей на вашем железе. Ваш VPS за $5, ваши правила. Масштабируйтесь без разрешения.",
    },
  },
  notFound: {
    title: "Страница не найдена",
    description: "Страница не существует.",
    backToHome: "На главную",
  },
  mobileNav: {
    navigation: "Навигация",
    language: "Язык",
    getStarted: "Начать",
    github: "GitHub",
  },
  mockups: {
    terminal: {
      title: "Терминал",
      downloading: "✓ Скачивание bedrud v0.12.3...",
      installing: "✓ Установка в /usr/local/bin...",
      ready: "✓ Bedrud готов! (512 МБ ОЗУ)",
    },
    invite: {
      shareLink: "Поделиться ссылкой",
      sendEmail: "Отправить по Email",
      copyLink: "Скопировать ссылку",
      or: "ИЛИ",
      meetingTitle: "Командный стендап",
      today: "Сегодня, 14:00",
      duration: "30 мин",
      participants: "5 участников",
      noAccount: "Аккаунт не требуется",
      anyBrowser: "Работает в любом браузере",
    },
    meeting: {
      title: "Командный стендап",
      micOn: "Включить микрофон",
      cameraOn: "Включить камеру",
      shareScreen: "Демонстрация экрана",
      raiseHand: "Поднять руку",
      chat: "Чат",
      leaveCall: "Покинуть звонок",
    },
    preview: {
      title: "Командный стендап",
      you: "Вы",
      chat: "Чат",
      messagePlaceholder: "Сообщение...",
      chatMsg1: "Делюсь презентацией за Q4",
      chatMsg2: "Выглядит отлично!",
      chatMsg3: "Можем посмотреть слайд 4?",
    },
    scale: {
      overview: "Обзор",
      last30Days: "За 30 дней",
      meetings: "встреч",
      uptime: "аптайм",
      availability: "доступность",
      activeUsers: "Активные пользователи",
      unlimitedUsers: "Безлимитно пользователей",
      noPerSeat: "Нет платы за пользователя",
      costPerSeat: "Цена за пользователя:",
      costFree: "$0.00",
    },
  },
};
