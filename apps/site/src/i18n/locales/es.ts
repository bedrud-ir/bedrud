export default {
  meta: {
    title: "Bedrud - Videollamadas a tu manera",
    description:
      "Bedrud es una plataforma de videollamadas de código abierto. Alójala tú mismo o usa nuestra nube - un solo binario que empaqueta interfaz web, API REST y servidor de medios WebRTC.",
  },
  nav: {
    home: "Inicio",
    features: "Características",
    compare: "Comparación",
    platforms: "Plataformas",
    openSource: "Código Abierto",
    docs: "Documentación",
    community: "Comunidad",
    demo: "Demo",
    install: "Instalar",
    download: "Descargar",
    blog: "Blog",
    getStarted: "Comenzar",
  },
  hero: {
    badge: "Código Abierto · Apache 2.0",
    kicker: "Alternativa open source a Zoom. Funciona en un VPS de $5.",
    headline: "Tus reuniones. Tu servidor. Tus reglas.",
    subheadline:
      "Videoconferencias autohospedadas en tu propio hardware. Un solo binario, 512 MB de RAM, despliegue en 60 segundos. Desde llamadas privadas hasta transmisiones con miles de espectadores.",
    trustBar:
      "Confiable por más de 10,000 desarrolladores y equipos preocupados por la privacidad en todo el mundo.",
    installMicrocopy: "Pega en tu terminal. Desplegado en 60 segundos.",
    tryDemo: "Probar sin instalar",
    installNow: "Copiar comando de instalación",
    objectionBullets: {
      screenSharing: "Compartir pantalla y grabación",
      sso: "Integración SSO y OIDC",
      webrtc: "Basado en WebRTC, latencia inferior a un segundo",
    },
    getStarted: "Comenzar",
    viewOnGithub: "Ver en GitHub",
    copied: "¡Copiado!",
    stars: "1.2k",
    starsLabel: "Estrellas en GitHub",
    contributorsLabel: "colaboradores",
    license: "Licenciado Apache 2.0",
  },
  journey: {
    title: "De cero a reunir en minutos",
    subtitle: "Instala. Comparte un enlace. Empieza a hablar. Así de simple.",
    install: {
      title: "Instalar",
      description:
        "Descarga un solo binario o tira una imagen de Docker. Un comando, cero dependencias. Funciona en menos de un minuto.",
    },
    invite: {
      title: "Invitar",
      description:
        "Comparte un enlace. Sin registros, sin descargas, sin fricción. Los invitados se unen instantáneamente desde cualquier navegador.",
    },
    host: {
      title: "Reunirse",
      description:
        "Video y audio WebRTC cristalinos con cancelación de ruido incorporada. Compartir pantalla, grabación y chat incluidos.",
    },
  },
  whyBedrud: {
    title: "Construido diferente",
    subtitle: "Sin lock-in. Sin exceso. Sin sorpresas en la factura.",
    noLockIn: {
      title: "Sin bloqueo de proveedor",
      description:
        "Tu infraestructura. Tus datos. Tus reglas. Despliega en cualquier servidor, migra cuando quieras. Sin formatos propietarios, sin tarifas de salida, sin dependencia de la nube.",
    },
    singleBinary: {
      title: "Binario único",
      description:
        "Un archivo. Un comando. Cero dependencias. Sin Docker, sin Kubernetes, sin pesadillas de despliegue los viernes por la tarde.",
    },
    noPerSeat: {
      title: "Sin precios por asiento",
      description:
        "5 usuarios o 5.000. El precio es el mismo: cero. Sin claves de licencia, sin contadores de usuarios, sin botones de 'contactar ventas'.",
    },
  },
  problem: {
    title: "Tus reuniones no deberían costar tanto",
    subtitle:
      "Las plataformas de video empresariales han estado cobrando de más a los equipos durante años. Esto es lo que está mal - y por qué los desarrolladores están cambiando.",
    perSeatPricing: {
      title: "Los precios por asiento son una trampa",
      description:
        "Zoom, Teams, Meet - todos cobran por usuario. Crece de 10 a 100 personas y tu factura se multiplica por 10. Multiplica eso entre departamentos, contratistas e invitados y estás sangrando presupuesto en una herramienta que la gente usa 30 minutos al día.",
    },
    vendorLockIn: {
      title: "El bloqueo de proveedor elimina tu poder de negociación",
      description:
        "Tus grabaciones de reuniones, transcripciones, datos de participantes - todo almacenado en servidores que no controlas. Cuando un proveedor cambia precios, elimina funciones o sufre una brecha, no tienes estrategia de salida.",
    },
    selfHostedNightmare: {
      title: "Las opciones autoalojadas son una pesadilla",
      description:
        "Jitsi necesita 8+ contenedores Docker. BigBlueButton quiere 8GB RAM. Ninguno se instala en menos de una hora, ninguno escala de forma simple, y depurar cualquiera un viernes por la tarde no es como quieres pasar tu semana.",
    },
  },
  comparison: {
    title: "Mira cómo se compara Bedrud",
    subtitle: "Videollamadas autoalojadas sin complejidad.",
    feature: "Característica",
    bedrud: "Bedrud",
    jitsi: "Jitsi Meet",
    bbb: "BigBlueButton",
    sections: {
      deployment: "Despliegue",
      features: "Características",
      integrations: "Integraciones y Escala",
      licensing: "Licencia y Comunidad",
    },
    rows: {
      deploy: "Complejidad de despliegue",
      deployBedrud: "Binario único",
      deployJitsi: "Docker Compose (8+ contenedores)",
      deployBbb: "Servidor mínimo 8GB RAM",
      ram: "Uso de RAM",
      ramBedrud: "512MB",
      ramJitsi: "~2GB",
      ramBbb: "~4GB+",
      install: "Tiempo de instalación",
      installBedrud: "< 1 minuto",
      installJitsi: "~15 minutos",
      installBbb: "~30 minutos + config",
      nativeClients: "Clientes nativos",
      nativeClientsBedrud: "Web, Android, iOS",
      nativeClientsJitsi: "Web, Android, iOS",
      nativeClientsBbb: "Solo Web",
      guestJoin: "Invitado (Sin cuenta)",
      guestJoinBedrud: "Sí",
      guestJoinJitsi: "Sí",
      guestJoinBbb: "Sí (aprobación moderador)",
      audioProcessing: "Procesamiento de audio (Cancelación ruido)",
      audioProcessingBedrud: "RNNoise / Krisp",
      audioProcessingJitsi: "Básico",
      audioProcessingBbb: "Básico",
      screenShare: "Compartir pantalla",
      screenShareBedrud: "Integrado",
      screenShareJitsi: "Integrado",
      screenShareBbb: "Integrado",
      recording: "Grabación",
      recordingBedrud: "Grabación del lado del servidor",
      recordingJitsi: "Via Jibri (configuración adicional)",
      recordingBbb: "Integrado + exportación de notas",
      sipIntegration: "SIP / Marcación telefónica",
      sipIntegrationBedrud: "No",
      sipIntegrationJitsi: "Gateway SIP/Jibri",
      sipIntegrationBbb: "Gateway SIP",
      whiteboard: "Pizarra",
      whiteboardBedrud: "No",
      whiteboardJitsi: "No",
      whiteboardBbb: "Pizarra integrada",
      maxUsers: "Usuarios concurrentes máx.",
      maxUsersBedrud: "50+ por sala",
      maxUsersJitsi: "100+ con ajustes",
      maxUsersBbb: "300+ por sala",
      license: "Licencia",
      licenseBedrud: "Apache 2.0",
      licenseJitsi: "Apache 2.0",
      licenseBbb: "LGPL 3.0",
      communitySize: "Comunidad y Ecosistema",
      communitySizeBedrud: "Creciendo",
      communitySizeJitsi: "Grande, maduro",
      communitySizeBbb: "Grande, académico",
    },
  },
  features: {
    title: "Todo incluido",
    subtitle:
      "Video, audio, autenticación, bots - todo incluido. Sin arquitectura de microservicios.",
    oneCommandDeploy: {
      title: "Despliegue en un comando",
      description:
        "Binario único, cero dependencias. Pega una línea en tu terminal y Bedrud está funcionando en 60 segundos. Sin Docker, sin Kubernetes, sin equipo de ops necesario.",
    },
    fiveDollarVps: {
      title: "Funciona en un VPS de $5",
      description:
        "~200MB RAM en reposo (512MB mínimo). Despliega en cualquier VPS económico - Hetzner, DigitalOcean, AWS Lightsail, tu propio hardware. Mismas funciones, fracción del costo.",
    },
    webrtcLatency: {
      title: "Latencia WebRTC sub-segundo",
      description:
        "Servidor de medios WebRTC incorporado con bitrate adaptativo. Video y audio cristalinos incluso en conexiones inestables. Sin proxy a través de servidores de terceros.",
    },
    enterpriseSso: {
      title: "SSO empresarial y OIDC",
      description:
        "Conecta tu proveedor de identidad en minutos. Passkeys, OAuth 2.0, OIDC - todo soportado de fábrica. Sin bases de datos de contraseñas que puedan ser comprometidas.",
    },
    guestJoin: {
      title: "Acceso de invitado — Sin cuenta",
      description:
        "Comparte un enlace, hacen clic, entran. Sin formularios de registro, sin contraseñas, sin instalar apps. Funciona en cualquier navegador moderno.",
    },
    recording: {
      title: "Grabación y compartir pantalla integradas",
      description:
        "Graba reuniones y comparte tu pantalla. Las grabaciones se guardan en tu servidor — no en la nube de alguien más.",
    },
  },
  install: {
    title: "Un comando. Listo.",
    subtitle: "Copia. Pega. Funcionando. Eso es todo.",
    command: "curl -fsSL https://get.bedrud.org | bash",
    powershellCommand: "irm https://get.bedrud.org/install.ps1 | iex",
    dockerCommand: "docker pull ghcr.io/bedrud-ir/bedrud:latest",
    or: "o",
    whatItDoes:
      "Downloads the Bedrud CLI binary to ~/bin and adds it to your PATH.",
    flagsTitle: "Key Flags",
    flagsDesc: "Description",
    flagVersion: "Install a specific version (e.g. 0.12.0)",
    flagInstallDir: "Custom install directory (default: ~/bin)",
    flagSkipShell: "Skip modifying shell config files",
    requirements:
      "Funciona en cualquier Linux de 64 bits, macOS o Windows con 512MB RAM (~200MB idle).",
    fullDocsLink: "Full CLI installer docs",
    fullServerDocsLink: "Full server installation guide",
    dockerGuideLink: "Docker setup guide",
    githubReleases: "Download binary from GitHub Releases",
  },
  platforms: {
    title: "Apps nativas, no wrappers",
    subtitle:
      "Apps nativas de verdad - React en web, Kotlin en Android, Swift en iOS, Rust en el escritorio, Go en el servidor. Sin Electron, sin Cordova.",
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
      title: "Servidor",
      tech: "Go + WebRTC",
    },
    bots: {
      title: "Bots",
      tech: "Python SDK",
    },
    status: "Producción",
  },
  openSource: {
    title: "Lee el código fuente. Toma el control.",
    subtitle:
      "Cada línea de código es pública. Inspecciona, audita, contribuye o haz un fork. Licencia Apache 2.0 - uso comercial o personal.",
    license: "Apache 2.0",
    github: "Ver en GitHub",
    docs: "Leer la documentación",
  },
  cta: {
    title: "Deja de alquilar tus reuniones",
    subtitle:
      "Despliega en cualquier VPS de $5 en 60 segundos. Sin tarjeta de crédito, sin bloqueo de proveedor, sin servidores de terceros.",
    installNow: "Desplegar tu servidor",
    getStarted: "Leer el Quickstart",
    readDocs: "Leer documentación",
    starGithub: "Estrella en GitHub",
    copied: "¡Copiado!",
  },
  faq: {
    title: "Preguntas frecuentes",
    subtitle: "Preguntas técnicas, respondidas directamente.",
    serverPower: {
      question: "¿Qué tan potente necesita ser mi servidor?",
      answer:
        "Un VPS de $5/mes con 1GB RAM es suficiente para empezar. Bedrud usa 512MB RAM y escala con tu hardware. Para 50+ usuarios concurrentes, sube a 2GB. No se requiere GPU.",
    },
    installCommand: {
      question: "¿Qué hace realmente el comando de instalación?",
      answer:
        "Descarga el binario de Bedrud para tu plataforma y lo coloca en /usr/local/bin. Sin Docker, sin gestores de paquetes, sin dependencias ocultas. Puedes inspeccionar el script antes de ejecutarlo.",
    },
    recordingScreenSharing: {
      question: "¿Soporta grabación y compartir pantalla?",
      answer:
        "Sí. Compartir pantalla y grabación de reuniones están incluidos. Las grabaciones se guardan en tu servidor - no en la nube de alguien más. Los agentes bot también pueden transcribir reuniones en tiempo real.",
    },
    migrate: {
      question: "¿Puedo cambiar de Zoom o Teams?",
      answer:
        "Sí. Bedrud funciona junto con tus herramientas existentes. Importa tu equipo, configura SSO y empieza a migrar reuniones a tu ritmo. Sin bloqueo de datos, nunca.",
    },
    pricing: {
      question: "¿Es realmente gratis?",
      answer:
        "Completamente. Licencia Apache 2.0, sin límites de funciones, sin botones de 'contactar ventas'. El código fuente es público. Aloja tú mismo y paga solo tu servidor — típicamente $5/mes.",
    },
    mobile: {
      question: "¿Tienen apps móviles?",
      answer:
        "Sí. Apps nativas para Android (Kotlin) y iOS (Swift), además de apps de escritorio en Rust. No son wrappers web — rendimiento nativo real.",
    },
  },
  footer: {
    brand: "Bedrud",
    tagline:
      "Videollamadas para equipos que valoran la privacidad. Autoalojado o en la nube.",
    install: "Instalar",
    platform: "Plataforma",
    features: "Características",
    compare: "Comparación",
    demo: "Demo en vivo",
    docs: "Documentación",
    api: "Referencia de API",
    download: "Descargar",
    about: "Acerca de",
    resources: "Recursos",
    blog: "Blog",
    changelog: "Registro de cambios",
    contribute: "Contribuir",
    reportIssue: "Reportar un problema",
    contact: "Contacto",
    privacy: "Política de privacidad",
    terms: "Términos de servicio",
    social: {
      github: "GitHub",
      twitter: "X (Twitter)",
    },
  },
  privacy: {
    meta: {
      title: "Política de privacidad - Bedrud",
      description:
        "Cómo maneja Bedrud tus datos. Versión corta: autoalojado significa que tus datos permanecen en tu servidor.",
    },
    title: "Política de privacidad",
    lastUpdated: "Última actualización: 17 de abril de 2026",
    intro:
      "Bedrud es software de videoconferencia de código abierto. Cuando lo autoalojas, tus datos nunca tocan nuestros servidores. Esta política cubre el sitio bedrud.org y la instancia de demo pública. Si autoalojas Bedrud, tú controlas tus propios datos.",
    dataCollection: {
      title: "Qué recopilamos",
      content:
        "En el sitio web (bedrud.org): nada. Sin cookies, sin rastreadores, sin analytics. En la demo pública: tu nombre para mostrar y tu dirección IP mientras estás conectado. Eso es todo. Sin email, sin teléfono, sin datos personales. Cuando autoalojas Bedrud, todos los datos permanecen en tu infraestructura. Nunca los vemos.",
    },
    dataUsage: {
      title: "Cómo usamos los datos",
      content:
        "Los datos de conexión de la demo se usan solo para enrutar tu video y audio en tiempo real. No se registran, almacenan ni analizan. No construimos perfiles de usuario, no servimos publicidad dirigida, ni vendemos datos. Nunca.",
    },
    dataStorage: {
      title: "Almacenamiento de datos",
      content:
        "La demo pública no persiste datos. Al desconectarte, tu sesión desaparece - sin grabaciones, sin historial de chat. Las instancias autoalojadas almacenan datos en SQLite en tu servidor. Tú eliges la estrategia de respaldo y retención. No tenemos acceso.",
    },
    thirdParties: {
      title: "Servicios de terceros",
      content:
        "Ninguno. Bedrud no hace solicitudes salientes después de la descarga. Sin analytics, sin reportes de errores, sin telemetría. El sitio no carga scripts de terceros. Verifícalo tú mismo - el código fuente está en GitHub.",
    },
    cookies: {
      title: "Cookies y almacenamiento local",
      content:
        "El sitio usa localStorage para tu preferencia de tema (oscuro/claro) y selección de idioma. Eso es todo. Sin cookies de rastreo, sin IDs publicitarios. La demo usa una cookie de sesión que expira al cerrar la pestaña.",
    },
    yourRights: {
      title: "Tus derechos",
      content:
        "Dado que no recopilamos datos personales, no hay nada a lo que acceder, corregir o eliminar de nuestra parte. Cierra la pestaña de la demo y tus datos de sesión ya desaparecieron. Los usuarios autoalojados tienen control total sobre todos los datos en sus servidores - exportar, respaldar, eliminar, lo que necesites.",
    },
    changes: {
      title: "Cambios a esta política",
      content:
        "Actualizaremos esta página si cambian nuestras prácticas de datos. Dado que casi no recopilamos nada, los cambios son improbables. La fecha al inicio de la página refleja la revisión más reciente.",
    },
    contact: {
      title: "Contacto",
      content:
        "¿Preguntas? Abre un issue en GitHub o escribe a privacy@bedrud.com. También estamos en Discord si prefieres chat en tiempo real.",
    },
  },
  terms: {
    meta: {
      title: "Términos de servicio - Bedrud",
      description:
        "Términos para el sitio bedrud.org y la demo pública. Los usuarios autoalojados se rigen por la licencia Apache 2.0.",
    },
    title: "Términos de servicio",
    lastUpdated: "Última actualización: 17 de abril de 2026",
    intro:
      "Estos términos cubren el sitio bedrud.org y la instancia de demo pública en bedrud.xyz. Si descargas y autoalojas Bedrud, la licencia Apache 2.0 rige tu uso del software.",
    acceptance: {
      title: "Usar Bedrud significa que aceptas estos términos",
      content:
        "Al visitar bedrud.org o usar la demo pública, aceptas estos términos. Si no estás de acuerdo, no uses la demo. Así de simple.",
    },
    services: {
      title: "Qué ofrece Bedrud",
      content:
        "Ofrecemos este sitio con documentación y enlaces de descarga, y una instancia de demo pública para evaluar el software. El software de videoconferencia propiamente dicho es de código abierto bajo la licencia Apache 2.0. Descárgalo, modíficalo, ejecútalo tú mismo.",
    },
    accounts: {
      title: "Cuentas",
      content:
        "El sitio no requiere cuentas. La demo no requiere cuentas. Las instancias autoalojadas pueden tener su propio sistema de cuentas - eso es tu decisión, ya que tú administras el servidor.",
    },
    acceptableUse: {
      title: "No abuses de la demo",
      content:
        "No uses la demo pública para contenido ilegal, spam, acoso o cualquier cosa que degrade la experiencia de otros. Nos reservamos el derecho de expulsar usuarios abusivos de la sala de demo. Esto no aplica a instancias autoalojadas - tú estableces tus propias reglas.",
    },
    intellectualProperty: {
      title: "Licencia de código abierto",
      content:
        "Bedrud está bajo licencia Apache 2.0. Úsalo, modifícalo, distribúyelo - incluyendo comercialmente. El nombre y logo de Bedrud son marcas de theMadOrg. Puedes usarlos para referirte al software, pero no para tergiversar tu relación con el proyecto.",
    },
    termination: {
      title: "Acceso",
      content:
        "Podemos revocar el acceso a la demo pública en cualquier momento por abuso. Podemos sacar el sitio si es necesario. Pero una vez descargado el binario, es tuyo bajo la licencia Apache 2.0. No podemos revocar eso.",
    },
    liability: {
      title: "Sin garantía",
      content:
        "Bedrud se proporciona tal cual. No garantizamos que funcione perfectamente en todos los entornos. No somos responsables de caídas, pérdida de datos o cualquier daño del uso del software. Consulta la licencia Apache 2.0 para el texto legal completo.",
    },
    governingLaw: {
      title: "Ley aplicable",
      content:
        "Estos términos se rigen por la ley aplicable. Para disputas, preferimos resolverlas a través de issues de GitHub o comunicación directa antes de involucrar abogados.",
    },
    changes: {
      title: "Actualizaciones",
      content:
        "Podemos actualizar estos términos. Si lo hacemos, cambiaremos la fecha en esta página. El uso continuo de la demo o el sitio después de los cambios significa que los aceptas.",
    },
    contact: {
      title: "Contacto",
      content:
        "¿Preguntas sobre estos términos? Escribe a legal@bedrud.com o abre un issue en GitHub.",
    },
  },
  docs: {
    documentation: "Documentación",
    onThisPage: "En esta página",
    previous: "Anterior",
    next: "Siguiente",
    backToHome: "Volver al inicio",
    searchPlaceholder: "Buscar docs…",
    searchButton: "Buscar",
    noResults: "Sin resultados",
    loading: "Cargando…",
    searchError: "La búsqueda falló. Intenta de nuevo.",
    pressShortcut: "Presione",
    clearSearch: "Borrar búsqueda",
    searchDocs: "Buscar documentación",
    notFound: "Documento no encontrado",
    sections: {
      gettingStarted: "Primeros pasos",
      architecture: "Arquitectura",
      backend: "Backend",
      api: "API",
      guides: "Guías",
      contributing: "Contribuir",
    },
    titleSuffix: " - Bedrud",
    diagramError: "Error al renderizar diagrama",
    sidebarItems: {
      "getting-started/quickstart": "Inicio rápido",
      "getting-started/cli-installer": "CLI Installer",
      "getting-started/installation": "Instalación del servidor",
      "getting-started/clients": "Instalación de clientes",
      "getting-started/configuration": "Configuración",
      "getting-started/cli-reference": "Referencia CLI",
      "architecture/overview": "Vista general de arquitectura",
      "architecture/server": "Arquitectura del servidor",
      "architecture/web": "Frontend Web",
      "architecture/android": "App Android",
      "architecture/ios": "App iOS",
      "architecture/desktop": "App de escritorio",
      "architecture/agents": "Agentes bot",
      "architecture/webrtc-connectivity": "Conectividad WebRTC",
      "architecture/turn-server": "Servidor TURN",
      "backend/overview": "Documentación del backend",
      "backend/structure": "Estructura del código",
      "backend/database": "Base de datos y modelos",
      "backend/authentication": "Autenticación",
      "backend/api-handlers": "Handlers de API",
      "backend/livekit": "Integración LiveKit",
      "backend/deployment": "Despliegue",
      "backend/advanced": "Temas avanzados",
      "api/authentication": "API de autenticación",
      "api/rooms": "API de salas",
      "api/admin": "API de administración",
      "api/passkeys": "API de passkeys",
      "guides/development": "Flujo de desarrollo",
      "guides/deployment": "Guía de despliegue",
      "guides/docker": "Guía de Docker",
      "guides/internal-tls": "TLS interno",
      "guides/makefile": "Referencia del Makefile",
      "guides/packages": "Instalación de paquetes",
      "guides/appliance": "Modo appliance",
      contributing: "Contribuir",
    },
  },
  installPage: {
    meta: {
      title: "Instalar Bedrud Server - Despliegue en un comando",
      description:
        "Despliega Bedrud en tu servidor en menos de un minuto. Un solo binario, 512MB RAM, sin Docker.",
    },
    title: "Instalar Bedrud Server",
    subtitle:
      "Despliega el servidor self-hosted en tu servidor en menos de un minuto. Un binario, cero dependencias.",
  },
  downloadPage: {
    meta: {
      title: "Descargar Bedrud - Aplicaciones de Escritorio y Móvil",
      description:
        "Descarga Bedrud para Linux, macOS, Windows, Android o iOS. Aplicaciones nativas o acceso por navegador sin instalación.",
    },
    title: "Descargar Bedrud",
    subtitle:
      "Aplicaciones nativas para cada plataforma. O simplemente abre un enlace de reunión en tu navegador.",
    noInstall: "Sin instalación necesaria. Descarga, haz ejecutable, ejecuta.",
    flathub: "Instalar desde Flathub",
    brew: "Instalar vía Homebrew",
    winget: "Instalar vía Windows Package Manager",
    installer: "Instalador",
    portable: "Portable",
    playStore: "Disponible en Google Play",
    appStore: "Disponible en la App Store",
    sideload: "Descargar APK/IPA desde GitHub Releases",
    browserZero: "Sin instalación",
    browserDesc:
      "Abre cualquier enlace de reunión en Chrome, Firefox, Edge o Safari. Sin descarga necesaria.",
    tryDemo: "Probar demo en vivo",
    otherPlatforms: "Ver todas las plataformas y gestores de paquetes",
    server: "Instalación del servidor",
    serverDesc: "Despliega el servidor Bedrud en tu propio hardware.",
    serverGuide: "Guía de instalación del servidor",
    quickInstall: "Quick install",
    heroClientTitle: "Versión de cliente",
    heroClientDesc:
      "Aplicaciones nativas de escritorio y móvil para cada plataforma.",
    heroServerTitle: "Versión de servidor",
    heroServerDesc: "Despliega el servidor Bedrud en tu propio hardware.",
    heroAllPlatforms: "Ver todas las plataformas",
    dmgAppleSilicon: "Apple Silicon (.dmg)",
    dmgIntel: "Intel (.dmg)",
    serverDocker: "Docker",
    serverDockerDesc: "Ejecuta en un contenedor con Docker.",
    serverBinary: "Binario de Linux",
    serverBinaryDesc: "Descarga binarios precompilados para Linux.",
    serverQuickInstall: "Instalación rápida",
    serverQuickInstallDesc: "Un comando. Menos de un minuto.",
    serverHelm: "Kubernetes (Helm)",
    serverHelmDesc: "Despliega en Kubernetes con Helm.",
    resourcesTitle: "Recursos",
    resourcesDocs: "Documentación",
    resourcesDocsDesc:
      "Guías de configuración, referencia de API y tutoriales.",
    resourcesCommunity: "Comunidad",
    resourcesCommunityDesc: "Obtén ayuda y comparte comentarios.",
    resourcesChangelog: "Registro de cambios",
    resourcesChangelogDesc: "Últimas versiones y cambios.",
    repoSetup: "Configuración de repo requerida",
    appleSilicon: "Apple Silicon",
    intel: "Intel",
    githubReleases: "GitHub Releases",
    platform: {
      linux: "Linux",
      mac: "macOS",
      windows: "Windows",
      android: "Android",
      ios: "iOS",
      browser: "Navegador",
    },
  },
  aboutPage: {
    meta: {
      title: "Acerca de Bedrud",
      description:
        "Conoce al equipo y la misión detrás de Bedrud - videoconferencias de código abierto para todos.",
    },
    title: "Acerca de Bedrud",
    subtitle:
      "Videoconferencias de código abierto creadas por personas que creen que la privacidad debería ser lo predeterminado.",
    mission: {
      title: "Nuestra misión",
      text: "Bedrud existe porque las videoconferencias no deberían requerir entregar tus datos a Big Tech. Creemos que un solo binario, un VPS barato y código abierto pueden reemplazar contratos SaaS de millones - sin sacrificar calidad ni funcionalidades. La privacidad no es una característica. Es el fundamento.",
    },
    team: {
      title: "Equipo principal",
      subtitle: "Las personas detrás de Bedrud.",
    },
    error: "Error al cargar miembros del equipo.",
  },
  blog: {
    meta: {
      title: "Blog - Bedrud",
      description:
        "Actualizaciones, análisis técnicos y guías del equipo de Bedrud.",
    },
    title: "Blog",
    subtitle:
      "Actualizaciones, análisis técnicos y guías del equipo de Bedrud.",
    noPosts: "Sin artículos aún. ¡Vuelve pronto!",
    backToBlog: "Volver al Blog",
    titleSuffix: " - Bedrud Blog",
    defaultAuthor: "Bedrud Team",
  },
  skipToContent: "Saltar al contenido",
  mobileNav: {
    navigation: "Navegación",
    language: "Idioma",
    getStarted: "Comenzar",
    github: "GitHub",
  },
  featuresPage: {
    meta: {
      title: "Características - Bedrud",
      description:
        "Explora las características de Bedrud: binario único, calidad WebRTC, acceso de invitados, passkeys, controles de admin, procesamiento de audio, agentes bot y soporte multiplataforma.",
    },
    title: "Características",
    subtitle: "Cada característica resuelve un problema real.",
    sectionTitle: "Todo lo que necesitas, nada que no",
    sectionSubtitle:
      "Infraestructura de videoconferencias en un solo binario. Sin dependencias externas, sin precios por asiento, sin bloqueo de proveedor.",
    groups: {
      infra: "Despliegue & Infraestructura",
      media: "Reuniones & Medios",
      access: "Acceso & Control",
      extend: "Extender",
    },
    learnMore: "Más información",
    stats: {
      ram: "512MB RAM",
      binary: "1 Binario",
      auth: "6 Métodos de auth",
      platforms: "5 Plataformas",
    },
    guestJoin: {
      pain: "¿Cansado de forzar a los invitados a crear cuentas solo para una llamada de 15 minutos?",
      title: "Invitado - Sin cuenta necesaria",
      description:
        "Comparte un enlace, hacen clic, entran. Sin formularios de registro, sin contraseñas, sin fricción. Código de acceso opcional para seguridad.",
    },
    singleBinary: {
      pain: "Configurar infraestructura de video no debería requerir un título en DevOps.",
      title: "Despliegue binario único",
      description:
        "Una descarga, un comando, ejecutándose. Sin Docker Compose, sin manifiestos de Kubernetes, sin guías de 12 pasos. Solo un binario que funciona.",
      snippet: "$ curl -sSL bedrud.dev/install.sh | sh",
    },
    webrtc: {
      pain: "Las videollamadas que se retrasan, congelan o se cortan arruinan las reuniones.",
      title: "Calidad WebRTC",
      description:
        "Servidor de medios WebRTC incorporado con velocidad de bits adaptativa, simulcast y SVC. Video y audio cristalinos en cualquier conexión.",
    },
    passkeys: {
      pain: "Las contraseñas se filtran. Los tokens MFA son phisheados.",
      title: "Passkeys + OAuth",
      description:
        "Passkeys FIDO2 para autenticación sin contraseña. OAuth 2.0 / OIDC para SSO con tu proveedor de identidad existente. Sin bases de datos de contraseñas para comprometer.",
    },
    admin: {
      pain: "Gestionar una plataforma de reuniones sin buenas herramientas es doloroso.",
      title: "Panel de administración",
      description:
        "Gestión de salas, usuarios, análisis de uso y configuración - todo desde una interfaz web limpia. Sin adivinanzas de CLI.",
    },
    audio: {
      pain: "El ruido de fondo en las reuniones es distraído y poco profesional.",
      title: "Procesamiento de audio",
      description:
        "Supresión de ruido incorporada impulsada por RNNoise. Integración opcional de Krisp para supresión de ruido de IA premium. Audio limpio, cada llamada.",
    },
    bots: {
      pain: "Las tareas manuales de reuniones desperdician tiempo - grabación, transcripción, notas.",
      title: "Agentes bot",
      description:
        "Bots programables se unen a reuniones a través del Go SDK. Automatiza transcripción, traducción, grabación, integraciones CRM y flujos de trabajo personalizados.",
    },
    multiPlatform: {
      pain: "Tu equipo usa diferentes dispositivos. Tu plataforma de reuniones también debería.",
      title: "Multiplataforma",
      description:
        "Aplicaciones nativas para Web (React), Android (Kotlin) y iOS (Swift). Experiencia consistente, rendimiento nativo de la plataforma.",
    },
    e2eEncryption: {
      pain: "El contenido de reuniones que pasa por tu servidor debería mantenerse privado.",
      title: "Cifrado de extremo a extremo",
      description:
        "Cifrado E2E opcional para salas. El servidor retransmite medios cifrados - solo los participantes pueden descifrar.",
    },
    autoTls: {
      pain: "Los certificados SSL no deberían requerir un tutorial.",
      title: "TLS automático y HTTPS",
      description:
        "Provisión y renovación automática de Let's Encrypt. Certificados auto-firmados para redes internas.",
    },
    airGapped: {
      pain: "¿Y si tus servidores no pueden acceder a internet?",
      title: "Preparado para redes aisladas",
      description:
        "Cero peticiones salientes después de la descarga. SQLite integrado. Funciona en infraestructura que nunca toca el internet público.",
    },
  },
  demoPage: {
    meta: {
      title: "Demo en vivo - Bedrud",
      description:
        "Prueba Bedrud sin instalar nada. Únete a una reunión demo en vivo ahora.",
    },
    hero: {
      headline: "Prueba Bedrud ahora mismo",
      subtitle:
        "Únete a una reunión en vivo en tu navegador. Sin cuenta, sin descarga, sin espera.",
    },
    cta: {
      tryNow: "Abrir demo en vivo",
      noInstall:
        "Sin instalación. Sin cuenta. Sin compromiso. Haz clic y únete.",
    },
    preview: {
      caption: "Lo que verás al unirte a la demo",
    },
    features: {
      instantJoin: {
        title: "Acceso instantáneo",
        description:
          "Haz clic en el enlace y ya estás dentro. Sin formularios de registro, sin verificación de email, sin instalar nada. Funciona en cualquier navegador moderno.",
      },
      noAccount: {
        title: "No necesitas cuenta",
        description:
          "Elige un nombre para mostrar y empieza a hablar. Cuando termines, cierra la pestaña. Nada permanece.",
      },
      webrtc: {
        title: "Calidad WebRTC real",
        description:
          "La demo usa el mismo motor que Bedrud autoalojado. Latencia sub-segundo, bitrate adaptativo, audio cristalino.",
      },
      e2e: {
        title: "Cifrado de extremo a extremo",
        description:
          "Activa el cifrado E2E en la configuración de la sala. Tu video y audio se cifran antes de salir de tu navegador.",
      },
    },
    faq: {
      whatHappens: {
        question: "¿Qué pasa en la demo?",
        answer:
          "Te unes a una sala de reunión compartida ejecutando el stack completo de Bedrud. Prueba video, audio, compartir pantalla, chat y controles de reunión - igual que una instancia autoalojada.",
      },
      dataSaved: {
        question: "¿Se guardan mis datos?",
        answer:
          "No. La demo no persiste datos. Cuando te vas, tu sesión desaparece - sin grabaciones, sin historial de chat, nada almacenado.",
      },
      duration: {
        question: "¿Cuánto tiempo puedo usar la demo?",
        answer:
          "Sin límite de tiempo. Usa la demo todo lo que necesites para evaluar Bedrud. Cuando quieras un setup permanente, el autoalojamiento toma 60 segundos.",
      },
      inviteOthers: {
        question: "¿Puedo invitar a otros a la demo?",
        answer:
          "Sí. Comparte el enlace de la demo con compañeros de equipo y todos se unen a la misma sala. Ideal para probar Bedrud con tu equipo antes de desplegar.",
      },
    },
    selfHost: {
      text: "¿Prefieres ejecutar tu propio servidor?",
      cta: "Leer la guía de instalación",
    },
  },
  changelogPage: {
    meta: {
      title: "Registro de cambios - Bedrud",
      description: "Historial de versiones y actualizaciones de Bedrud.",
    },
    title: "Registro de cambios",
    subtitle: "Qué hay de nuevo en Bedrud. Actividad = confianza.",
    viewOnGithub: "Ver en GitHub",
    noReleases: "Sin releases aún. ¡Vuelve pronto!",
    error: "Error al cargar releases.",
    viewRelease: "Ver en GitHub →",
  },
  contributorsPage: {
    meta: {
      title: "Colaboradores - Bedrud",
      description: "Conoce a las personas que construyen Bedrud.",
    },
    title: "Colaboradores",
    subtitle: "Bedrud es construido por la comunidad.",
    joinThem: "Únete a ellos",
    joinCta: "Contribuir en GitHub",
    contributions: "contribuciones",
    error: "Error al cargar colaboradores.",
  },
  contactPage: {
    meta: {
      title: "Contacto - Bedrud",
      description: "Ponte en contacto con el equipo de Bedrud.",
    },
    title: "Contacto",
    subtitle: "Ponte en contacto a través de cualquiera de estos canales.",
    github: {
      title: "Issues de GitHub",
      description:
        "Reportes de errores, solicitudes de características y contribuciones de código.",
      cta: "Abrir un issue",
    },
    discord: {
      title: "Chat de comunidad",
      description:
        "Haz preguntas, comparte ideas y obtén ayuda de la comunidad.",
      cta: "Unirse a Discord",
    },
    email: {
      title: "Email",
      description:
        "Para colaboraciones, problemas de seguridad o consultas privadas.",
      cta: "Enviar email",
    },
  },
  notFound: {
    title: "Página no encontrada",
    description: "La página que buscas no existe o ha sido movida.",
    backToHome: "Volver al inicio",
  },
  a11y: {
    toggleTheme: "Cambiar tema",
    breadcrumb: "Ruta de navegación",
    articleNav: "Navegación de artículo",
  },
  mockups: {
    terminal: {
      title: "Terminal",
      downloading: "✓ Descargando bedrud v0.12.3...",
      installing: "✓ Instalando en /usr/local/bin...",
      ready: "✓ Bedrud listo! (512MB RAM)",
    },
    invite: {
      shareLink: "Compartir enlace de reunión",
      sendEmail: "Enviar por email",
      copyLink: "Copiar enlace",
      or: "O",
      meetingTitle: "Standup de equipo",
      today: "Hoy, 2:00 PM",
      duration: "30 min",
      participants: "5 participantes",
      noAccount: "Sin cuenta necesaria",
      anyBrowser: "Funciona en cualquier navegador",
    },
    meeting: {
      title: "Standup de equipo",
      micOn: "Micrófono activado",
      cameraOn: "Cámara activada",
      shareScreen: "Compartir pantalla",
      raiseHand: "Levantar mano",
      chat: "Chat",
      leaveCall: "Salir de la llamada",
    },
    preview: {
      title: "Standup de equipo",
      you: "Tú",
      chat: "Chat",
      messagePlaceholder: "Mensaje...",
      chatMsg1: "Compartiendo el deck de Q4 ahora",
      chatMsg2: "¡Se ve genial!",
      chatMsg3: "¿Podemos ver la diapositiva 4?",
    },
    scale: {
      overview: "Resumen",
      last30Days: "Últimos 30 días",
      meetings: "reuniones",
      uptime: "uptime",
      availability: "disponibilidad",
      activeUsers: "Usuarios activos",
      unlimitedUsers: "Usuarios ilimitados",
      noPerSeat: "Sin precios por asiento",
      costPerSeat: "Costo por asiento:",
      costFree: "$0.00",
    },
  },
};
