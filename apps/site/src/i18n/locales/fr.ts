export default {
  meta: {
    title: "Bedrud - Visioconférences, à votre façon",
    description:
      "Bedrud est une plateforme de visioconférence open source. Auto-hébergez-la ou utilisez notre cloud - un seul binaire incluant l'interface web, l'API REST et le serveur multimédia WebRTC.",
  },
  nav: {
    home: "Accueil",
    features: "Fonctionnalités",
    compare: "Comparaison",
    platforms: "Plateformes",
    openSource: "Open Source",
    docs: "Documentation",
    community: "Communauté",
    demo: "Démo",
    install: "Installer",
    download: "Télécharger",
    blog: "Blog",
    getStarted: "Commencer",
  },
  hero: {
    badge: "Open Source · Apache 2.0",
    kicker: "Alternative open source à Zoom. Tourne sur un VPS à 5€.",
    headline: "Vos réunions. Votre serveur. Vos règles.",
    subheadline:
      "Visioconférences auto-hébergées sur votre propre matériel. Un seul binaire, 512 Mo RAM, déploiement en 60 secondes. Des appels privés aux diffusions avec des milliers de spectateurs.",
    trustBar:
      "Approuvé par plus de 10 000 développeurs et équipes soucieux de leur confidentialité dans le monde entier.",
    installMicrocopy: "Collez dans votre terminal. Déployé en 60 secondes.",
    tryDemo: "Essayer sans installer",
    installNow: "Copier la commande d'installation",
    objectionBullets: {
      screenSharing: "Partage d'écran et enregistrement",
      sso: "Intégration SSO et OIDC",
      webrtc: "Propulsé par WebRTC, latence inférieure à une seconde",
    },
    getStarted: "Commencer",
    viewOnGithub: "Voir sur GitHub",
    copied: "Copié!",
    stars: "1.2k",
    starsLabel: "étoiles GitHub",
    contributorsLabel: "contributeurs",
    license: "Sous licence Apache 2.0",
  },
  journey: {
    title: "De zéro à la réunion en quelques minutes",
    subtitle:
      "Installez. Partagez un lien. Commencez à parler. Voici comment ça se passe.",
    install: {
      title: "Installer",
      description:
        "Téléchargez un seul binaire ou tirez une image Docker. Une commande, zéro dépendance. Fonctionne en moins d'une minute.",
    },
    invite: {
      title: "Inviter",
      description:
        "Partagez un lien. Aucune inscription, aucun téléchargement, aucune friction. Les invités rejoignent instantanément depuis n'importe quel navigateur.",
    },
    host: {
      title: "Rencontrer",
      description:
        "Vidéo et audio WebRTC cristallins avec suppression de bruit intégrée. Partage d'écran, enregistrement et chat inclus.",
    },
  },
  whyBedrud: {
    title: "Conçu autrement",
    subtitle:
      "Pas de verrouillage. Pas de surcharge. Pas de surprises sur la facture.",
    noLockIn: {
      title: "Pas de verrouillage fournisseur",
      description:
        "Votre infrastructure. Vos données. Vos règles. Déployez sur n'importe quel serveur, migrez quand vous voulez. Pas de formats propriétaires, pas de frais de sortie, pas de dépendance cloud.",
    },
    singleBinary: {
      title: "Binaire unique",
      description:
        "Un fichier. Une commande. Zéro dépendance. Pas de Docker, pas de Kubernetes, pas de cauchemars de déploiement le vendredi après-midi.",
    },
    noPerSeat: {
      title: "Pas de tarification par siège",
      description:
        "5 utilisateurs ou 5 000. Le prix est le même : zéro. Pas de clés de licence, pas de compteurs de sièges, pas de boutons 'contacter les ventes'.",
    },
  },
  problem: {
    title: "Vos réunions ne devraient pas coûter si cher",
    subtitle:
      "Les plateformes vidéo d'entreprise surfacturent les équipes depuis des années. Voici ce qui cloche - et pourquoi les développeurs changent.",
    perSeatPricing: {
      title: "La tarification par siège est un piège",
      description:
        "Zoom, Teams, Meet - tous facturent par utilisateur. Passez de 10 à 100 personnes et votre facture décuple. Multipliez ça entre départements, prestataires et invités, et vous videz votre budget sur un outil utilisé 30 minutes par jour.",
    },
    vendorLockIn: {
      title: "Le verrouillage fournisseur détruit votre liberté",
      description:
        "Vos enregistrements de réunion, vos transcriptions, les données des participants - tout est stocké sur des serveurs que vous ne contrôlez pas. Quand un fournisseur change ses prix, supprime des fonctionnalités ou subit une faille, vous n'avez pas de porte de sortie.",
    },
    selfHostedNightmare: {
      title: "Les options auto-hébergées sont un cauchemar",
      description:
        "Jitsi nécessite 8+ conteneurs Docker. BigBlueButton exige 8 Go de RAM. Aucun ne s'installe en moins d'une heure, aucun ne scale simplement, et débugger l'un ou l'autre un vendredi après-midi n'est pas la façon dont vous voulez passer votre semaine.",
    },
  },
  comparison: {
    title: "Comparez Bedrud aux alternatives",
    subtitle: "Visioconférences auto-hébergées sans complexité.",
    feature: "Fonctionnalité",
    bedrud: "Bedrud",
    jitsi: "Jitsi Meet",
    bbb: "BigBlueButton",
    sections: {
      deployment: "Déploiement",
      features: "Fonctionnalités",
      integrations: "Intégrations & Évolutivité",
      licensing: "Licence & Communauté",
    },
    rows: {
      deploy: "Complexité de déploiement",
      deployBedrud: "Binaire unique",
      deployJitsi: "Docker Compose (8+ conteneurs)",
      deployBbb: "Serveur minimum 8 Go RAM",
      ram: "Utilisation RAM",
      ramBedrud: "512 Mo",
      ramJitsi: "~2Go",
      ramBbb: "~4Go+",
      install: "Temps d'installation",
      installBedrud: "< 1 minute",
      installJitsi: "~15 minutes",
      installBbb: "~30 minutes + config",
      nativeClients: "Clients natifs",
      nativeClientsBedrud: "Web, Android, iOS",
      nativeClientsJitsi: "Web, Android, iOS",
      nativeClientsBbb: "Web uniquement",
      guestJoin: "Invité (Sans compte)",
      guestJoinBedrud: "Oui",
      guestJoinJitsi: "Oui",
      guestJoinBbb: "Oui (approbation modérateur)",
      audioProcessing: "Traitement audio (Suppression bruit)",
      audioProcessingBedrud: "RNNoise / Krisp",
      audioProcessingJitsi: "Basique",
      audioProcessingBbb: "Basique",
      screenShare: "Partage d'écran",
      screenShareBedrud: "Intégré",
      screenShareJitsi: "Intégré",
      screenShareBbb: "Intégré",
      recording: "Enregistrement",
      recordingBedrud: "Enregistrement côté serveur",
      recordingJitsi: "Via Jibri (configuration supplémentaire)",
      recordingBbb: "Intégré + export de notes",
      sipIntegration: "SIP / Appel téléphonique",
      sipIntegrationBedrud: "Non",
      sipIntegrationJitsi: "Passerelle SIP/Jibri",
      sipIntegrationBbb: "Passerelle SIP",
      whiteboard: "Tableau blanc",
      whiteboardBedrud: "Non",
      whiteboardJitsi: "Non",
      whiteboardBbb: "Tableau blanc intégré",
      maxUsers: "Utilisateurs simultanés max",
      maxUsersBedrud: "50+ par salle",
      maxUsersJitsi: "100+ avec optimisation",
      maxUsersBbb: "300+ par salle",
      license: "Licence",
      licenseBedrud: "Apache 2.0",
      licenseJitsi: "Apache 2.0",
      licenseBbb: "LGPL 3.0",
      communitySize: "Communauté & Écosystème",
      communitySizeBedrud: "En croissance",
      communitySizeJitsi: "Grande, mature",
      communitySizeBbb: "Grande, académique",
    },
  },
  features: {
    title: "Tout est inclus",
    subtitle:
      "Vidéo, audio, auth, bots - tout est inclus. Pas besoin d'architecture microservices.",
    oneCommandDeploy: {
      title: "Déploiement en une commande",
      description:
        "Binaire unique, zéro dépendance. Collez une ligne dans votre terminal et Bedrud tourne en 60 secondes. Pas de Docker, pas de Kubernetes, pas d'équipe ops requise.",
    },
    fiveDollarVps: {
      title: "Fonctionne sur un VPS à 5$",
      description:
        "~200 Mo de RAM au repos (512 Mo min). Déployez sur n'importe quel VPS pas cher - Hetzner, DigitalOcean, AWS Lightsail, votre propre matériel. Mêmes fonctionnalités, fraction du coût.",
    },
    webrtcLatency: {
      title: "Latence WebRTC sub-seconde",
      description:
        "Serveur média WebRTC intégré avec débit adaptatif. Vidéo et audio cristallins même sur les connexions instables. Pas de proxy par des serveurs tiers.",
    },
    enterpriseSso: {
      title: "SSO entreprise & OIDC",
      description:
        "Connectez-vous à votre fournisseur d'identité en quelques minutes. Passkeys, OAuth 2.0, OIDC - tout pris en charge nativement. Pas de bases de mots de passe à compromettre.",
    },
    guestJoin: {
      title: "Accès invité — Sans compte",
      description:
        "Partagez un lien, ils cliquent, ils entrent. Pas de formulaires d'inscription, pas de mots de passe, pas d'installation. Fonctionne dans tous les navigateurs modernes.",
    },
    recording: {
      title: "Enregistrement et partage d'écran intégrés",
      description:
        "Enregistrez les réunions et partagez votre écran. Les enregistrements sont sauvegardés sur votre serveur — pas sur le cloud de quelqu'un d'autre.",
    },
  },
  install: {
    title: "Une commande. Terminé.",
    subtitle: "Copiez. Collez. Ça tourne. C'est tout.",
    command: "curl -fsSL https://get.bedrud.org | bash",
    powershellCommand: "irm https://get.bedrud.org/install.ps1 | iex",
    dockerCommand: "docker pull ghcr.io/bedrud-ir/bedrud:latest",
    or: "ou",
    whatItDoes:
      "Downloads the Bedrud CLI binary to ~/bin and adds it to your PATH.",
    flagsTitle: "Key Flags",
    flagsDesc: "Description",
    flagVersion: "Install a specific version (e.g. 0.12.0)",
    flagInstallDir: "Custom install directory (default: ~/bin)",
    flagSkipShell: "Skip modifying shell config files",
    requirements:
      "Fonctionne sur n'importe quel Linux 64 bits, macOS ou Windows avec 512 Mo de RAM (~200 Mo au repos).",
    fullDocsLink: "Full CLI installer docs",
    fullServerDocsLink: "Full server installation guide",
    dockerGuideLink: "Docker setup guide",
    githubReleases: "Download binary from GitHub Releases",
  },
  platforms: {
    title: "Des apps natives, pas des wrappers web",
    subtitle:
      "De vraies apps natives - React sur le web, Kotlin sur Android, Swift sur iOS, Rust sur le bureau, Go sur le serveur. Pas d'Electron, pas de Cordova.",
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
      title: "Serveur",
      tech: "Go + WebRTC",
    },
    bots: {
      title: "Bots",
      tech: "Python SDK",
    },
    status: "Production",
  },
  openSource: {
    title: "Lisez le code source. Prenez le contrôle.",
    subtitle:
      "Chaque ligne de code est publique. Inspectez, auditez, contribuez ou forkez. Licence Apache 2.0 - utilisation commerciale ou autre.",
    license: "Apache 2.0",
    github: "Voir sur GitHub",
    docs: "Lire la documentation",
  },
  cta: {
    title: "Arrêtez de louer vos réunions",
    subtitle:
      "Déployez sur n'importe quel VPS à 5$ en 60 secondes. Sans carte bancaire, sans verrou fournisseur, sans serveurs tiers.",
    installNow: "Déployer votre serveur",
    getStarted: "Lire le Quickstart",
    readDocs: "Voir le Quickstart",
    starGithub: "Étoile sur GitHub",
    copied: "Copié !",
  },
  faq: {
    title: "Questions fréquentes",
    subtitle: "Des questions techniques, des réponses directes.",
    serverPower: {
      question: "Quelle puissance de serveur est nécessaire ?",
      answer:
        "Un VPS à 5$/mois avec 1 Go de RAM suffit pour commencer. Bedrud utilise 512 Mo de RAM et s'adapte à votre matériel. Pour 50+ utilisateurs simultanés, passez à 2 Go. Pas de GPU requis.",
    },
    installCommand: {
      question: "Que fait réellement la commande d'installation ?",
      answer:
        "Elle télécharge le binaire Bedrud pour votre plateforme et le place dans /usr/local/bin. Pas de Docker, pas de gestionnaire de paquets, pas de dépendances cachées. Vous pouvez inspecter le script avant de l'exécuter.",
    },
    recordingScreenSharing: {
      question:
        "L'enregistrement et le partage d'écran sont-ils pris en charge ?",
      answer:
        "Oui. Le partage d'écran et l'enregistrement de réunion sont inclus. Les enregistrements sont sauvegardés sur votre serveur - pas sur le cloud de quelqu'un d'autre. Les agents bots peuvent aussi transcrire les réunions en temps réel.",
    },
    migrate: {
      question: "Puis-je passer de Zoom ou Teams ?",
      answer:
        "Oui. Bedrud fonctionne alongside vos outils existants. Importez votre équipe, configurez le SSO et commencez la migration à votre rythme. Pas de verrouillage des données, jamais.",
    },
    pricing: {
      question: "Est-ce vraiment gratuit ?",
      answer:
        "Entièrement. Sous licence Apache 2.0, pas de fonctionnalités limitées, pas de bouton 'Contacter les ventes'. Le code source est public. Hébergez-le vous-même et payez uniquement votre serveur — généralement 5$/mois.",
    },
    mobile: {
      question: "Y a-t-il des applications mobiles ?",
      answer:
        "Oui. Applications natives pour Android (Kotlin) et iOS (Swift), plus des applications de bureau en Rust. Pas de web wrappers — de vraies performances natives.",
    },
  },
  footer: {
    brand: "Bedrud",
    tagline:
      "Visioconférences pour les équipes qui se soucient de la confidentialité. Auto-hébergé ou cloud.",
    platform: "Plateforme",
    features: "Fonctionnalités",
    compare: "Comparaison",
    demo: "Démo en direct",
    docs: "Documentation",
    api: "Référence API",
    download: "Télécharger",
    about: "À propos",
    resources: "Ressources",
    blog: "Blog",
    changelog: "Journal des modifications",
    contribute: "Contribuer",
    reportIssue: "Signaler un problème",
    contact: "Contact",
    install: "Installer",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
    social: {
      github: "GitHub",
      twitter: "X (Twitter)",
    },
  },
  privacy: {
    meta: {
      title: "Politique de confidentialité - Bedrud",
      description:
        "Comment Bedrud gère vos données. Version courte : auto-hébergé signifie que vos données restent sur votre serveur.",
    },
    title: "Politique de confidentialité",
    lastUpdated: "Dernière mise à jour : 17 avril 2026",
    intro:
      "Bedrud est un logiciel open source de visioconférence. Quand vous l'auto-hébergez, vos données ne touchent jamais nos serveurs. Cette politique couvre le site bedrud.org et l'instance de démo publique. Si vous auto-hébergez Bedrud, vous contrôlez vos propres données.",
    dataCollection: {
      title: "Ce que nous collectons",
      content:
        "Sur le site web (bedrud.org) : rien. Pas de cookies, pas de traqueurs, pas d'analytics. Sur la démo publique : votre nom d'affichage et votre adresse IP tant que vous êtes connecté. C'est tout. Pas d'e-mail, pas de téléphone, pas de données personnelles. Quand vous auto-hébergez Bedrud, toutes les données restent sur votre infrastructure. Nous ne les voyons jamais.",
    },
    dataUsage: {
      title: "Comment nous utilisons les données",
      content:
        "Les données de connexion à la démo servent uniquement à acheminer votre vidéo et audio en temps réel. Elles ne sont ni enregistrées, ni stockées, ni analysées. Nous ne construisons pas de profils utilisateurs, ne servons pas de publicité ciblée, et ne vendons pas de données. Jamais.",
    },
    dataStorage: {
      title: "Stockage des données",
      content:
        "La démo publique ne persiste aucune donnée. Déconnectez-vous et votre session disparaît - pas d'enregistrements, pas d'historique de chat. Les instances auto-hébergées stockent les données dans SQLite sur votre serveur. Vous choisissez la stratégie de sauvegarde et de rétention. Nous n'avons aucun accès.",
    },
    thirdParties: {
      title: "Services tiers",
      content:
        "Aucun. Bedrud n'envoie aucune requête sortante après le téléchargement. Pas d'analytics, pas de rapports de crash, pas de télémétrie. Le site ne charge aucun script tiers. Vérifiez par vous-même - le code source est sur GitHub.",
    },
    cookies: {
      title: "Cookies et stockage local",
      content:
        "Le site utilise localStorage pour votre préférence de thème (sombre/clair) et votre choix de langue. C'est tout. Pas de cookies de suivi, pas d'identifiants publicitaires. La démo utilise un cookie de session qui expire quand vous fermez l'onglet.",
    },
    yourRights: {
      title: "Vos droits",
      content:
        "Puisque nous ne collectons pas de données personnelles, il n'y a rien à consulter, corriger ou supprimer de notre côté. Fermez l'onglet de la démo et vos données de session ont déjà disparu. Les utilisateurs auto-hébergés ont un contrôle total sur toutes les données de leurs serveurs - export, sauvegarde, suppression, ce dont vous avez besoin.",
    },
    changes: {
      title: "Modifications de cette politique",
      content:
        "Nous mettrons à jour cette page si nos pratiques de données changent. Étant donné que nous collectons presque rien, des modifications sont improbables. La date en haut de la page reflète la révision la plus récente.",
    },
    contact: {
      title: "Contact",
      content:
        "Des questions ? Ouvrez un ticket sur GitHub ou écrivez à privacy@bedrud.com. Nous sommes aussi sur Discord si vous préférez le chat en direct.",
    },
  },
  terms: {
    meta: {
      title: "Conditions d'utilisation - Bedrud",
      description:
        "Conditions d'utilisation du site bedrud.org et de la démo publique. Les utilisateurs auto-hébergés sont soumis à la licence Apache 2.0.",
    },
    title: "Conditions d'utilisation",
    lastUpdated: "Dernière mise à jour : 17 avril 2026",
    intro:
      "Ces conditions couvrent le site bedrud.org et l'instance de démo publique à bedrud.xyz. Si vous téléchargez et auto-hébergez Bedrud, la licence Apache 2.0 régit votre utilisation du logiciel.",
    acceptance: {
      title: "Utiliser Bedrud signifie que vous acceptez ces conditions",
      content:
        "En visitant bedrud.org ou en utilisant la démo publique, vous acceptez ces conditions. Si vous n'êtes pas d'accord, n'utilisez pas la démo. C'est simple.",
    },
    services: {
      title: "Ce que Bedrud propose",
      content:
        "Nous proposons ce site avec de la documentation et des liens de téléchargement, ainsi qu'une instance de démo publique pour évaluer le logiciel. Le logiciel de visioconférence proprement dit est open source sous licence Apache 2.0. Téléchargez-le, modifiez-le, faites-le tourner vous-même.",
    },
    accounts: {
      title: "Comptes",
      content:
        "Le site ne nécessite pas de compte. La démo ne nécessite pas de compte. Les instances auto-hébergées peuvent avoir leur propre système de comptes - c'est votre choix, puisque c'est vous qui gérez le serveur.",
    },
    acceptableUse: {
      title: "N'abusez pas de la démo",
      content:
        "N'utilisez pas la démo publique pour du contenu illégal, du spam, du harcèlement ou quoi que ce soit qui dégrade l'expérience des autres. Nous nous réservons le droit d'exclure les utilisateurs abusifs du salon de démo. Cela ne s'applique pas aux instances auto-hébergées - vous fixez vos propres règles.",
    },
    intellectualProperty: {
      title: "Licence open source",
      content:
        "Bedrud est sous licence Apache 2.0. Utilisez-le, modifiez-le, distribuez-le - y compris commercialement. Le nom et le logo Bedrud sont des marques de theMadOrg. Vous pouvez les utiliser pour faire référence au logiciel, mais pas pour tromper sur votre relation avec le projet.",
    },
    termination: {
      title: "Accès",
      content:
        "Nous pouvons révoquer l'accès à la démo publique à tout moment en cas d'abus. Nous pouvons mettre hors ligne le site si nécessaire. Mais une fois le binaire téléchargé, il est vôtre sous la licence Apache 2.0. Nous ne pouvons pas révoquer cela.",
    },
    liability: {
      title: "Pas de garantie",
      content:
        "Bedrud est fourni tel quel. Nous ne garantissons pas qu'il fonctionne parfaitement dans tous les environnements. Nous ne sommes pas responsables des temps d'arrêt, des pertes de données ou de tout dommage lié à l'utilisation du logiciel. Consultez la licence Apache 2.0 pour le texte juridique complet.",
    },
    governingLaw: {
      title: "Droit applicable",
      content:
        "Ces conditions sont régies par le droit applicable. En cas de litige, nous préférons résoudre les choses via les issues GitHub ou une communication directe avant de faire appel aux avocats.",
    },
    changes: {
      title: "Mises à jour",
      content:
        "Nous pouvons mettre à jour ces conditions. Si oui, nous modifierons la date sur cette page. L'utilisation continue de la démo ou du site après les modifications signifie que vous les acceptez.",
    },
    contact: {
      title: "Contact",
      content:
        "Des questions sur ces conditions ? Écrivez à legal@bedrud.com ou ouvrez un ticket sur GitHub.",
    },
  },
  docs: {
    documentation: "Documentation",
    onThisPage: "Sur cette page",
    previous: "Précédent",
    next: "Suivant",
    backToHome: "Retour à l'accueil",
    searchPlaceholder: "Rechercher…",
    searchButton: "Rechercher",
    noResults: "Aucun résultat",
    loading: "Chargement…",
    pressShortcut: "Appuyez sur",
    clearSearch: "Effacer",
    searchDocs: "Rechercher dans la documentation",
    notFound: "Document non trouvé",
    searchError: "La recherche a échoué. Veuillez réessayer.",
    titleSuffix: " - Bedrud",
    diagramError: "Échec du rendu du diagramme",
    sections: {
      gettingStarted: "Premiers pas",
      architecture: "Architecture",
      backend: "Backend",
      api: "API",
      guides: "Guides",
      contributing: "Contribution",
    },
    sidebarItems: {
      "getting-started/quickstart": "Démarrage rapide",
      "getting-started/cli-installer": "CLI Installer",
      "getting-started/installation": "Installation du serveur",
      "getting-started/clients": "Installation du client",
      "getting-started/configuration": "Configuration",
      "getting-started/cli-reference": "Référence CLI",
      "architecture/overview": "Vue d'ensemble de l'architecture",
      "architecture/server": "Architecture du serveur",
      "architecture/web": "Frontend web",
      "architecture/android": "Application Android",
      "architecture/ios": "Application iOS",
      "architecture/desktop": "Application bureau",
      "architecture/agents": "Agents bots",
      "architecture/webrtc-connectivity": "Connectivité WebRTC",
      "architecture/turn-server": "Serveur TURN",
      "backend/overview": "Documentation du backend",
      "backend/structure": "Structure du code",
      "backend/database": "Base de données & modèles",
      "backend/authentication": "Authentification",
      "backend/api-handlers": "Gestionnaires d'API",
      "backend/livekit": "Intégration LiveKit",
      "backend/deployment": "Déploiement",
      "backend/advanced": "Sujets avancés",
      "api/authentication": "API d'authentification",
      "api/rooms": "API des salles",
      "api/admin": "API d'administration",
      "api/passkeys": "API Passkeys",
      "guides/development": "Flux de développement",
      "guides/deployment": "Guide de déploiement",
      "guides/docker": "Guide Docker",
      "guides/internal-tls": "TLS interne",
      "guides/makefile": "Référence Makefile",
      "guides/packages": "Installation des paquets",
      "guides/appliance": "Mode appliance",
      contributing: "Contribution",
    },
  },
  installPage: {
    meta: {
      title: "Installer Bedrud Server - Déploiement en une commande",
      description:
        "Déployez Bedrud sur votre serveur en moins d'une minute. Binaire unique, 512 Mo de RAM, sans Docker.",
    },
    title: "Installer Bedrud Server",
    subtitle:
      "Déployez le serveur self-hosté sur votre serveur en moins d'une minute. Un binaire, zéro dépendance.",
  },
  downloadPage: {
    meta: {
      title: "Télécharger Bedrud - Applications Desktop & Mobile",
      description:
        "Téléchargez Bedrud pour Linux, macOS, Windows, Android ou iOS. Applications natives ou accès navigateur sans installation.",
    },
    title: "Télécharger Bedrud",
    subtitle:
      "Applications natives pour chaque plateforme. Ou ouvrez simplement un lien de réunion dans votre navigateur.",
    noInstall:
      "Aucune installation nécessaire. Téléchargez, rendez exécutable, lancez.",
    flathub: "Installer depuis Flathub",
    brew: "Installer via Homebrew",
    winget: "Installer via le gestionnaire de paquets Windows",
    installer: "Installateur",
    portable: "Portable",
    playStore: "Disponible sur Google Play",
    appStore: "Disponible sur l'App Store",
    sideload: "Télécharger APK/IPA depuis GitHub Releases",
    browserZero: "Sans installation",
    browserDesc:
      "Ouvrez n'importe quel lien de réunion dans Chrome, Firefox, Edge ou Safari. Aucun téléchargement requis.",
    tryDemo: "Essayer la démo en direct",
    otherPlatforms: "Voir toutes les plateformes et gestionnaires de paquets",
    server: "Installation du serveur",
    serverDesc: "Déployez le serveur Bedrud sur votre propre matériel.",
    serverGuide: "Guide d'installation du serveur",
    quickInstall: "Quick install",
    heroClientTitle: "Version client",
    heroClientDesc:
      "Applications bureau et mobile natives pour chaque plateforme.",
    heroServerTitle: "Version serveur",
    heroServerDesc: "Déployez le serveur Bedrud sur votre propre matériel.",
    heroAllPlatforms: "Voir toutes les plateformes",
    dmgAppleSilicon: "Apple Silicon (.dmg)",
    dmgIntel: "Intel (.dmg)",
    serverDocker: "Docker",
    serverDockerDesc: "Exécuter dans un conteneur avec Docker.",
    serverBinary: "Binaire Linux",
    serverBinaryDesc: "Télécharger les binaires précompilés pour Linux.",
    serverQuickInstall: "Installation rapide",
    serverQuickInstallDesc: "Une commande. Moins d'une minute.",
    serverHelm: "Kubernetes (Helm)",
    serverHelmDesc: "Déployer sur Kubernetes avec Helm.",
    resourcesTitle: "Ressources",
    resourcesDocs: "Documentation",
    resourcesDocsDesc: "Guides d'installation, référence API et tutoriels.",
    resourcesCommunity: "Communauté",
    resourcesCommunityDesc: "Obtenir de l'aide et partager des retours.",
    resourcesChangelog: "Journal des modifications",
    resourcesChangelogDesc: "Dernières versions et changements.",
    repoSetup: "Configuration du dépôt requise",
    appleSilicon: "Apple Silicon",
    intel: "Intel",
    githubReleases: "Versions GitHub",
    platform: {
      linux: "Linux",
      mac: "macOS",
      windows: "Windows",
      android: "Android",
      ios: "iOS",
      browser: "Navigateur",
    },
  },
  aboutPage: {
    meta: {
      title: "À propos de Bedrud",
      description:
        "Découvrez l'équipe et la mission derrière Bedrud - visioconférence open source pour tous.",
    },
    title: "À propos de Bedrud",
    subtitle:
      "Visioconférence open source créée par des personnes qui croient que la confidentialité devrait être la norme.",
    mission: {
      title: "Notre mission",
      text: "Bedrud existe car les visioconférences ne devraient pas nécessiter de confier vos données à la Big Tech. Nous croyons qu'un seul binaire, un VPS abordable et du code open source peuvent remplacer des contrats SaaS à des millions - sans sacrifier la qualité ni les fonctionnalités. La confidentialité n'est pas une fonctionnalité. C'est le fondement.",
    },
    team: {
      title: "Équipe principale",
      subtitle: "Les personnes derrière Bedrud.",
    },
    error: "Impossible de charger les membres de l'équipe.",
  },
  blog: {
    meta: {
      title: "Blog - Bedrud",
      description:
        "Mises à jour, analyses techniques et guides de l'équipe Bedrud.",
    },
    title: "Blog",
    subtitle: "Mises à jour, analyses techniques et guides de l'équipe Bedrud.",
    noPosts: "Pas encore d'articles. Revenez bientôt!",
    backToBlog: "Retour au Blog",
    titleSuffix: " - Bedrud Blog",
    defaultAuthor: "Bedrud Team",
  },
  skipToContent: "Aller au contenu",
  mobileNav: {
    navigation: "Navigation",
    language: "Langue",
    getStarted: "Commencer",
    github: "GitHub",
  },
  featuresPage: {
    meta: {
      title: "Fonctionnalités - Bedrud",
      description:
        "Découvrez les fonctionnalités de Bedrud : binaire unique, qualité WebRTC, accès invité, passkeys, contrôle admin, traitement audio, agents bots et support multiplateforme.",
    },
    title: "Fonctionnalités",
    subtitle: "Chaque fonction résout un problème réel.",
    sectionTitle: "Tout ce dont vous avez besoin, rien de superflu",
    sectionSubtitle:
      "L'infrastructure de visioconférence en un seul binaire. Pas de dépendances externes, pas de tarification par siège, pas de verrouillage fournisseur.",
    groups: {
      infra: "Déploiement & Infrastructure",
      media: "Réunions & Médias",
      access: "Accès & Contrôle",
      extend: "Étendre",
    },
    learnMore: "En savoir plus",
    stats: {
      ram: "512 Mo RAM",
      binary: "1 Binaire",
      auth: "6 Méthodes d'auth",
      platforms: "5 Plateformes",
    },
    guestJoin: {
      pain: "Fatigué de forcer les invités à créer des comptes juste pour un appel de 15 minutes?",
      title: "Invité - Pas de compte nécessaire",
      description:
        "Partagez un lien, ils cliquent, ils entrent. Pas de formulaires d'inscription, pas de mots de passe, pas de friction. Code d'accès facultatif pour la sécurité.",
    },
    singleBinary: {
      pain: "L'installation de l'infrastructure vidéo ne devrait pas nécessiter un diplôme en DevOps.",
      title: "Déploiement binaire unique",
      description:
        "Un téléchargement, une commande, en cours d'exécution. Pas de Docker Compose, pas de manifests Kubernetes, pas de guides en 12 étapes. Juste un binaire qui fonctionne.",
      snippet: "$ curl -sSL bedrud.dev/install.sh | sh",
    },
    webrtc: {
      pain: "Les appels vidéo qui laguent, gèlent ou se coupent ruinent les réunions.",
      title: "Qualité WebRTC",
      description:
        "Serveur média WebRTC intégré avec débit binaire adaptatif, simulcast et SVC. Vidéo et audio cristallins sur n'importe quelle connexion.",
    },
    passkeys: {
      pain: "Les mots de passe fuient. Les jetons MFA sont phishés.",
      title: "Passkeys + OAuth",
      description:
        "Passkeys FIDO2 pour l'authentification sans mot de passe. OAuth 2.0 / OIDC pour SSO avec votre fournisseur d'identité existant. Pas de bases de données de mots de passe à compromettre.",
    },
    admin: {
      pain: "Gérer une plateforme de réunion sans bons outils est douloureux.",
      title: "Tableau de bord admin",
      description:
        "Gestion des salles, des utilisateurs, des analyses d'utilisation et de la configuration - le tout depuis une interface web propre. Pas de devinage CLI.",
    },
    audio: {
      pain: "Le bruit de fond dans les réunions est distrayant et non professionnel.",
      title: "Traitement audio",
      description:
        "Suppression de bruit intégrée propulsée par RNNoise. Intégration Krisp facultative pour la suppression de bruit IA premium. Audio propre, chaque appel.",
    },
    bots: {
      pain: "Les tâches manuelles de réunion gaspillent du temps - enregistrement, transcription, notes.",
      title: "Agents bots",
      description:
        "Bots programmables rejoignent les réunions via le Go SDK. Automatisez la transcription, la traduction, l'enregistrement, les intégrations CRM et les workflows personnalisés.",
    },
    multiPlatform: {
      pain: "Votre équipe utilise différents appareils. Votre plateforme de réunion aussi.",
      title: "Multiplateforme",
      description:
        "Applications natives pour Web (React), Android (Kotlin) et iOS (Swift). Expérience cohérente, performance native de la plateforme.",
    },
    e2eEncryption: {
      pain: "Le contenu des réunions transitant par votre serveur doit rester privé.",
      title: "Chiffrement de bout en bout",
      description:
        "Chiffrement E2E optionnel pour les salles. Le serveur relaie les médias chiffrés - seuls les participants peuvent déchiffrer.",
    },
    autoTls: {
      pain: "Les certificats SSL ne devraient pas nécessiter un tutoriel.",
      title: "TLS automatique et HTTPS",
      description:
        "Provisionnement et renouvellement automatiques Let's Encrypt. Certificats auto-signés pour les réseaux internes.",
    },
    airGapped: {
      pain: "Et si vos serveurs ne pouvaient pas accéder à internet?",
      title: "Prêt pour l'air-gap et le hors-ligne",
      description:
        "Aucune requête sortante après le téléchargement. SQLite intégré. Fonctionne sur une infrastructure qui ne touche jamais l'internet public.",
    },
  },
  demoPage: {
    meta: {
      title: "Démo en direct - Bedrud",
      description:
        "Essayez Bedrud sans rien installer. Rejoignez une réunion démo en direct maintenant.",
    },
    hero: {
      headline: "Essayez Bedrud maintenant",
      subtitle:
        "Rejoignez une réunion en direct dans votre navigateur. Pas de compte, pas de téléchargement, pas d'attente.",
    },
    cta: {
      tryNow: "Ouvrir la démo en direct",
      noInstall:
        "Pas d'installation. Pas de compte. Pas d'engagement. Cliquez et rejoignez.",
    },
    preview: {
      caption: "Ce que vous verrez en rejoignant la démo",
    },
    features: {
      instantJoin: {
        title: "Rejoindre instantanément",
        description:
          "Cliquez sur le lien et vous êtes dans le salon. Pas de formulaires d'inscription, pas de vérification par e-mail, pas d'app à installer. Fonctionne dans tous les navigateurs modernes.",
      },
      noAccount: {
        title: "Pas de compte requis",
        description:
          "Choisissez un nom d'affichage et commencez à discuter. Quand vous avez terminé, fermez l'onglet. Rien ne persiste.",
      },
      webrtc: {
        title: "Qualité WebRTC réelle",
        description:
          "La démo utilise le même moteur que Bedrud en auto-hébergement. Latence sub-seconde, débit adaptatif, audio cristallin.",
      },
      e2e: {
        title: "Chiffrage de bout en bout",
        description:
          "Activez le chiffrement E2E dans les paramètres du salon. Votre vidéo et audio sont chiffrés avant de quitter votre navigateur.",
      },
    },
    faq: {
      whatHappens: {
        question: "Que se passe-t-il dans la démo ?",
        answer:
          "Vous rejoignez un salon de réunion partagé exécutant la pile Bedrud complète. Testez la vidéo, l'audio, le partage d'écran, le chat et les contrôles de réunion - identique à une instance auto-hébergée.",
      },
      dataSaved: {
        question: "Mes données sont-elles sauvegardées ?",
        answer:
          "Non. La démo ne persiste aucune donnée. Quand vous partez, votre session disparaît - pas d'enregistrements, pas d'historique de chat, rien de stocké.",
      },
      duration: {
        question: "Combien de temps puis-je utiliser la démo ?",
        answer:
          "Pas de limite de temps. Utilisez la démo aussi longtemps que nécessaire pour évaluer Bedrud. Quand vous voulez un setup permanent, l'auto-hébergement prend 60 secondes.",
      },
      inviteOthers: {
        question: "Puis-je inviter d'autres personnes à la démo ?",
        answer:
          "Oui. Partagez le lien de démo avec vos collègues et tout le monde rejoint le même salon. Idéal pour tester Bedrud avec votre équipe avant le déploiement.",
      },
    },
    selfHost: {
      text: "Préférez faire tourner votre propre serveur ?",
      cta: "Lire le guide d'installation",
    },
  },
  changelogPage: {
    meta: {
      title: "Journal des modifications - Bedrud",
      description: "Historique des versions et mises à jour de Bedrud.",
    },
    title: "Journal des modifications",
    subtitle: "Quoi de neuf dans Bedrud. Activité = confiance.",
    viewOnGithub: "Voir sur GitHub",
    noReleases: "Aucune release encore. Revenez bientôt!",
    error: "Impossible de charger les versions.",
    viewRelease: "Voir sur GitHub →",
  },
  contributorsPage: {
    meta: {
      title: "Contributeurs - Bedrud",
      description: "Découvrez les personnes qui construisent Bedrud.",
    },
    title: "Contributeurs",
    subtitle: "Bedrud est construit par la communauté.",
    joinThem: "Rejoignez-les",
    joinCta: "Contribuer sur GitHub",
    contributions: "contributions",
    error: "Impossible de charger les contributeurs.",
  },
  contactPage: {
    meta: {
      title: "Contact - Bedrud",
      description: "Contactez l'équipe Bedrud.",
    },
    title: "Contact",
    subtitle: "Contactez-nous par l'un de ces canaux.",
    github: {
      title: "Issues GitHub",
      description:
        "Rapports de bugs, demandes de fonctionnalités et contributions de code.",
      cta: "Ouvrir une issue",
    },
    discord: {
      title: "Chat communautaire",
      description:
        "Posez des questions, partagez des idées et obtenez de l'aide de la communauté.",
      cta: "Rejoindre Discord",
    },
    email: {
      title: "Email",
      description:
        "Pour les partenariats, problèmes de sécurité ou demandes privées.",
      cta: "Envoyer un email",
    },
  },
  notFound: {
    title: "Page non trouvée",
    description: "La page que vous cherchez n'existe pas ou a été déplacée.",
    backToHome: "Retour à l'accueil",
  },
  a11y: {
    toggleTheme: "Changer de thème",
    breadcrumb: "Fil d'Ariane",
    articleNav: "Navigation dans l'article",
  },
  mockups: {
    terminal: {
      title: "Terminal",
      downloading: "✓ Téléchargement de bedrud v0.12.3…",
      installing: "✓ Installation dans /usr/local/bin…",
      ready: "✓ Bedrud prêt ! (512 Mo RAM)",
    },
    invite: {
      shareLink: "Partager le lien de réunion",
      sendEmail: "Envoyer par email",
      copyLink: "Copier le lien",
      or: "OU",
      meetingTitle: "Point d'équipe",
      today: "Aujourd'hui, 14h00",
      duration: "30 min",
      participants: "5 participants",
      noAccount: "Aucun compte requis",
      anyBrowser: "Fonctionne dans tout navigateur",
    },
    meeting: {
      title: "Point d'équipe",
      micOn: "Microphone activé",
      cameraOn: "Caméra activée",
      shareScreen: "Partager l'écran",
      raiseHand: "Lever la main",
      chat: "Chat",
      leaveCall: "Quitter l'appel",
    },
    preview: {
      title: "Point d'équipe",
      you: "Vous",
      chat: "Chat",
      messagePlaceholder: "Message…",
      chatMsg1: "Je partage le deck Q4 maintenant",
      chatMsg2: "C'est génial !",
      chatMsg3: "On peut revoir la slide 4 ?",
    },
    scale: {
      overview: "Vue d'ensemble",
      last30Days: "30 derniers jours",
      meetings: "réunions",
      uptime: "disponibilité",
      availability: "disponibilité",
      activeUsers: "Utilisateurs actifs",
      unlimitedUsers: "Utilisateurs illimités",
      noPerSeat: "Pas de tarification par siège",
      costPerSeat: "Coût par siège :",
      costFree: "0,00 $",
    },
  },
};
