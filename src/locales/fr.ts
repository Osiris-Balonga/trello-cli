export default {
  // Display messages
  display: {
    totalCards: 'Total : {{count}} cartes',
    totalCardsAssigned: 'Assignées à vous : {{count}} cartes',
    noCardsOnBoard: 'Aucune carte sur ce board',
    noCardsAssigned: 'Aucune carte ne vous est assignée. Utilisez --all pour voir toutes les cartes du board.',
    noCardsAvailable: 'Aucune carte disponible',
    noCardsAvailableAssigned: 'Aucune carte ne vous est assignée. Utilisez --all pour voir toutes les cartes du board.',
    showingAllCards: 'Affichage de toutes les cartes du board',
    showingMyCards: 'Affichage de vos cartes assignées',
  },

  // CLI descriptions
  cli: {
    description: 'Trello CLI - Gérez vos cartes Trello depuis le terminal',
    version: 'Afficher le numéro de version',
    help: 'Afficher l\'aide pour une commande',
    helpCommand: 'Afficher l\'aide pour une commande',
    usage: 'Utilisation :',
    optionsTitle: 'Options :',
    commandsTitle: 'Commandes :',
    argumentsTitle: 'Arguments :',
    commands: {
      auth: "S'authentifier avec l'API Trello",
      init: 'Initialiser le board Trello pour ce projet',
      list: 'Lister toutes les cartes du board',
      create: 'Créer une nouvelle carte',
      move: 'Déplacer une carte vers une autre liste',
      show: 'Afficher les détails d\'une carte',
      update: 'Modifier une carte',
      members: 'Gérer les membres du board',
      labels: 'Gérer les labels du board',
      config: 'Gérer la configuration du CLI',
      sync: 'Synchroniser le cache local avec Trello',
      search: 'Rechercher des cartes par mot-clé',
      due: 'Lister les cartes avec échéances',
      board: 'Commandes de gestion du board',
      delete: 'Supprimer une carte définitivement',
      archive: 'Archiver une carte (raccourci pour update --archive)',
      comment: 'Ajouter ou lister les commentaires d\'une carte',
      watch: 'Surveiller une carte en temps réel',
      export: 'Exporter les cartes dans différents formats',
      stats: 'Afficher les statistiques du board',
      template: 'Gérer les templates de cartes',
      batch: 'Effectuer des opérations groupées sur plusieurs cartes',
    },
    subcommands: {
      auth: {
        apikey: 'S\'authentifier avec une clé API et un token',
        oauth: 'S\'authentifier via navigateur (interactif)',
        status: 'Afficher le statut d\'authentification',
        logout: 'Supprimer les credentials stockés',
      },
      members: {
        list: 'Lister tous les membres du board',
      },
      labels: {
        list: 'Lister tous les labels du board',
      },
      config: {
        get: 'Obtenir une valeur de configuration',
        set: 'Définir une valeur de configuration',
        list: 'Lister toutes les valeurs de configuration',
      },
      board: {
        info: 'Afficher les informations et statistiques du board',
      },
      template: {
        create: 'Créer un nouveau template de carte',
        list: 'Lister tous les templates',
        show: 'Afficher les détails d\'un template',
        delete: 'Supprimer un template',
      },
      batch: {
        move: 'Déplacer plusieurs cartes vers une liste',
        archive: 'Archiver plusieurs cartes',
        unarchive: 'Désarchiver plusieurs cartes',
        label: 'Ajouter un label à plusieurs cartes',
        unlabel: 'Retirer un label de plusieurs cartes',
        assign: 'Assigner un membre à plusieurs cartes',
        unassign: 'Désassigner un membre de plusieurs cartes',
      },
    },
    options: {
      description: 'Description de la carte',
      due: 'Date d\'échéance (AAAA-MM-JJ)',
      labels: 'Labels (séparés par des virgules)',
      members: 'Membres (séparés par des virgules)',
      list: 'Liste cible',
      force: 'Ignorer la confirmation',
      unarchive: 'Désarchiver la carte',
      archive: 'Archiver la carte',
      listComments: 'Lister les commentaires au lieu d\'en ajouter',
      interval: 'Intervalle de rafraîchissement en secondes',
      output: 'Chemin du fichier de sortie',
      period: 'Période d\'analyse en jours',
      member: 'Filtrer par membre',
      parallel: 'Exécuter les opérations en parallèle',
      dryRun: 'Prévisualiser les changements sans les appliquer',
      cards: 'Numéros de cartes (séparés par des virgules)',
      query: 'Requête de recherche',
      archived: 'Inclure les cartes archivées',
      overdue: 'Afficher uniquement les cartes en retard',
      today: 'Afficher uniquement les cartes dues aujourd\'hui',
      week: 'Afficher les cartes dues cette semaine',
      month: 'Afficher les cartes dues ce mois',
      template: 'Utiliser un template',
      refresh: 'Actualiser les données depuis Trello',
      inTitle: 'Rechercher dans les titres uniquement',
      inDesc: 'Rechercher dans les descriptions uniquement',
      listFilter: 'Filtrer par liste (todo/doing/done)',
    },
    arguments: {
      cardNumber: 'Numéro de carte de la liste',
      title: 'Titre de la carte',
      list: 'Alias de la liste cible (todo/doing/done)',
      format: 'Format d\'export (json, csv, md, html)',
      configKey: 'Clé de configuration (language, authMode)',
      configValue: 'Valeur de configuration',
      text: 'Texte du commentaire (interactif si omis)',
      templateName: 'Nom du template',
      labelName: 'Nom du label',
      username: 'Nom d\'utilisateur du membre',
      cards: 'Numéros de cartes',
      name: 'Nouveau titre de la carte',
    },
  },

  // Common
  common: {
    loading: 'Chargement...',
    success: 'Succès',
    error: 'Erreur',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    none: 'Aucun',
    notSet: 'Non défini',
    unknown: 'Inconnu',
    url: 'URL :',
    card: 'Carte :',
    total: 'Total :',
    configFile: 'Fichier de config :',
  },

  // Table headers
  table: {
    title: 'Titre',
    labels: 'Labels',
    members: 'Membres',
    due: 'Échéance',
  },

  // Auth command
  auth: {
    title: 'Authentification API Key Trello',
    instructions: {
      intro: 'Obtenez votre clé API sur :',
      tokenSteps:
        '1. Ouvrez l\'URL ci-dessous dans votre navigateur\n2. Cliquez sur "Autoriser" pour autoriser Trello CLI\n3. Copiez le token affiché',
    },
    prompts: {
      apiKey: 'Entrez votre clé API :',
      pasteToken: 'Collez le token ici :',
      openBrowser: 'Ouvrir le navigateur automatiquement ?',
    },
    validation: {
      apiKeyInvalid: 'Format de clé API invalide (minimum 32 caractères)',
      tokenInvalid: 'Format de token invalide',
    },
    success: 'Clé API configurée avec succès',
    configSaved: 'Configuration sauvegardée dans : {{path}}',
    status: {
      title: 'État de l\'authentification',
      authenticated: 'Authentifié',
      notAuthenticated: 'Non authentifié',
      runAuth: 'Exécutez : tt auth apikey',
      mode: 'Mode : {{mode}}',
      apiKey: 'Clé API : {{key}}...',
      orgApiKey: 'Clé API Org : {{key}}...',
      token: 'Token : {{token}}...',
      config: 'Configuration : {{path}}',
    },
    oauth: {
      title: 'Authentification via navigateur',
      apiKeyExplanation:
        'Cette méthode ouvre Trello dans votre navigateur pour autoriser le CLI.\nVous avez besoin d\'une clé API (obtenez-la sur trello.com/power-ups/admin).',
      enterOrgApiKey: 'Entrez votre clé API :',
      invalidApiKey: 'Format de clé API invalide (minimum 32 caractères)',
      usingStoredApiKey: 'Utilisation de la clé API stockée : {{key}}...',
      instructions:
        '1. Ouvrez l\'URL ci-dessous dans votre navigateur\n2. Cliquez sur "Autoriser" pour autoriser Trello CLI\n3. Copiez le token affiché sur la page',
      openBrowser: 'Ouvrir le navigateur automatiquement ?',
      enterToken: 'Collez le token ici :',
      invalidToken: 'Format de token invalide',
      success: 'Authentification OAuth configurée !',
    },
    logout: {
      confirm: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      cancelled: 'Déconnexion annulée.',
      success: 'Déconnecté avec succès. Credentials supprimés.',
      notAuthenticated: 'Vous n\'êtes pas connecté.',
    },
  },

  // Init command
  init: {
    fetching: 'Récupération de vos boards Trello...',
    loaded: 'Boards chargés',
    selectBoard: 'Sélectionnez un board :',
    fetchingData: 'Récupération des données du board...',
    lessLists: 'Moins de 3 listes trouvées',
    lessListsWarning:
      'Vous avez besoin d\'au moins 3 listes (À faire, En cours, Terminé) pour un workflow optimal.',
    selectTodo: 'Sélectionnez la liste "À faire" :',
    selectDoing: 'Sélectionnez la liste "En cours" :',
    selectDone: 'Sélectionnez la liste "Terminé" :',
    success: 'Board "{{name}}" configuré pour ce projet',
    configSaved: 'Configuration sauvegardée dans : {{path}}',
    membersCached: 'Membres en cache : {{count}}',
    labelsCached: 'Labels en cache : {{count}}',
    failed: "Échec de l'initialisation",
    errors: {
      noBoards: "Aucun board trouvé. Créez d'abord un board sur Trello.",
      boardNotFound: 'Board introuvable (ID : {{id}})',
    },
  },

  // List command
  list: {
    loading: 'Chargement des cartes...',
    loaded: 'Cartes chargées',
    failed: 'Échec du chargement des cartes',
    errors: {
      boardNotFound: 'ID du board non trouvé dans le cache',
    },
  },

  // Create command
  create: {
    prompts: {
      title: 'Titre de la carte :',
      description: 'Description (optionnel) :',
      list: 'Sélectionnez la liste cible :',
    },
    validation: {
      titleRequired: 'Le titre est requis',
      titleTooLong: 'Titre trop long (max 500 caractères)',
      invalidOptions: 'Options invalides :',
    },
    git: {
      useBranchTitle: 'Utiliser le nom de la branche comme titre ? "{{title}}"',
      usingBranchTitle: 'Titre extrait du nom de la branche',
    },
    creating: 'Création de la carte...',
    success: 'Carte créée : {{name}}',
    url: 'URL : {{url}}',
    labels: 'Labels : {{labels}}',
    members: 'Membres : {{members}}',
    errors: {
      listNotFound:
        'Liste "{{list}}" non trouvée dans le cache. Exécutez "tt init" pour actualiser.',
    },
  },

  // Move command
  move: {
    loading: 'Chargement des cartes...',
    prompt: 'Déplacer "{{name}}" vers :',
    moving: 'Déplacement vers {{list}}...',
    success: '"{{name}}" → {{list}}',
    lists: {
      todo: 'À faire',
      doing: 'En cours',
      done: 'Terminé',
    },
    errors: {
      notInitialized:
        "Aucun board configuré. Exécutez d'abord \"tt init\".",
      invalidCard: 'Numéro de carte invalide. Doit être entre 1 et {{max}}.',
      listNotFound:
        'Liste "{{list}}" non trouvée dans le cache. Exécutez "tt init" pour actualiser.',
    },
  },

  // Show command
  show: {
    loading: 'Chargement de la carte...',
    fields: {
      list: 'Liste :',
      due: 'Échéance :',
      labels: 'Labels :',
      members: 'Membres :',
      description: 'Description :',
      noDescription: 'Pas de description',
      lastActivity: 'Dernière activité : {{date}}',
    },
    due: {
      overdue: '{{date}} (EN RETARD)',
      today: "{{date}} (AUJOURD'HUI)",
    },
    errors: {
      notInitialized:
        "Aucun board configuré. Exécutez d'abord \"tt init\".",
      invalidCard: 'Numéro de carte invalide. Doit être entre 1 et {{max}}.',
    },
  },

  // Update command
  update: {
    title: 'Mise à jour : {{name}}',
    prompts: {
      newTitle: 'Nouveau titre (laissez vide pour garder) :',
      newDesc: 'Nouvelle description (laissez vide pour garder) :',
    },
    validation: {
      titleTooLong: 'Titre trop long (max 500 caractères)',
      descTooLong: 'Description trop longue (max 16384 caractères)',
      invalidDate: 'Format de date invalide. Utilisez AAAA-MM-JJ.',
    },
    noChanges: 'Aucune modification effectuée.',
    noChangesToApply: 'Aucune modification à appliquer.',
    updating: 'Mise à jour de la carte...',
    success: 'Carte mise à jour : {{name}}',
    changes: {
      title: 'titre',
      description: 'description',
      dueDate: 'échéance',
      dueDateCleared: 'échéance supprimée',
      labels: 'labels',
      members: 'membres',
      archived: 'archivée',
      unarchived: 'désarchivée',
    },
    changed: 'Modifié : {{changes}}',
    errors: {
      notInitialized:
        "Aucun board configuré. Exécutez d'abord \"tt init\".",
      invalidCard: 'Numéro de carte invalide. Doit être entre 1 et {{max}}.',
    },
  },

  // Members command
  members: {
    title: 'Membres du board ({{count}})',
    fetching: 'Récupération des membres depuis Trello...',
    refreshed: 'Membres actualisés',
    noMembers: 'Aucun membre trouvé sur ce board.',
    table: {
      number: '#',
      username: "Nom d'utilisateur",
      fullName: 'Nom complet',
    },
    errors: {
      notInitialized:
        "Aucun board configuré. Exécutez d'abord \"tt init\".",
    },
  },

  // Labels command
  labels: {
    title: 'Labels du board ({{count}})',
    fetching: 'Récupération des labels depuis Trello...',
    refreshed: 'Labels actualisés',
    noLabels: 'Aucun label trouvé sur ce board.',
    noColor: 'Sans couleur',
    availableColors: 'Couleurs disponibles :',
    table: {
      number: '#',
      name: 'Nom',
      color: 'Couleur',
    },
    errors: {
      notInitialized:
        "Aucun board configuré. Exécutez d'abord \"tt init\".",
    },
  },

  // Sync command
  sync: {
    syncing: 'Synchronisation avec Trello...',
    success: '{{members}} membres, {{labels}} labels, {{lists}} listes synchronisés',
    failed: 'Échec de la synchronisation',
    lastSync: 'Dernière sync : {{date}}',
  },

  // Search command
  search: {
    searching: 'Recherche...',
    found: '{{count}} cartes trouvées pour "{{query}}" :',
    noResults: 'Aucune carte trouvée pour "{{query}}"',
    failed: 'Échec de la recherche',
    total: 'Total : {{count}} cartes',
    due: 'Échéance :',
    overdue: 'EN RETARD',
    today: "AUJOURD'HUI",
  },

  // Delete command
  delete: {
    warning: 'Attention : Cette action supprimera définitivement la carte !',
    confirm: 'Êtes-vous sûr de vouloir supprimer cette carte ?',
    cancelled: 'Suppression annulée.',
    deleting: 'Suppression de la carte...',
    success: 'Carte supprimée : "{{name}}"',
    failed: 'Échec de la suppression',
    invalidCard: 'Numéro de carte invalide. Doit être entre 1 et {{max}}.',
    cardLabel: 'Carte :',
    listLabel: 'Liste :',
  },

  // Archive command
  archive: {
    archiving: 'Archivage de la carte...',
    unarchiving: 'Désarchivage de la carte...',
    archiveSuccess: 'Carte archivée : "{{name}}"',
    unarchiveSuccess: 'Carte désarchivée : "{{name}}"',
    archiveFailed: "Échec de l'archivage",
    unarchiveFailed: 'Échec du désarchivage',
    invalidCard: 'Numéro de carte invalide. Doit être entre 1 et {{max}}.',
  },

  // Comment command
  comment: {
    title: 'Commentaires sur "{{name}}"',
    enterText: 'Entrez votre commentaire :',
    adding: 'Ajout du commentaire...',
    loading: 'Chargement des commentaires...',
    success: 'Commentaire ajouté avec succès',
    failed: "Échec de l'ajout du commentaire",
    empty: 'Le commentaire ne peut pas être vide',
    noComments: 'Aucun commentaire sur cette carte',
    invalidCard: 'Numéro de carte invalide. Doit être entre 1 et {{max}}.',
  },

  // Watch command
  watch: {
    watching: 'Surveillance',
    pressCtrlC: 'Appuyez sur Ctrl+C pour arrêter',
    changed: 'Carte modifiée !',
    refreshing: 'Rafraîchissement dans {{seconds}}s',
    stopped: 'Surveillance arrêtée',
    error: 'Erreur lors du rafraîchissement',
    status: 'Statut',
    due: 'Échéance',
    members: 'Membres',
    comments: 'Commentaires',
    recentComments: 'Commentaires récents',
    lastUpdated: 'Dernière mise à jour',
    invalidCard: 'Numéro de carte invalide. Doit être entre 1 et {{max}}.',
  },

  // Export command
  export: {
    exporting: 'Export des cartes...',
    success: 'Exporté vers {{file}}',
    failed: "Échec de l'export",
    invalidFormat: 'Format invalide. Formats supportés : {{formats}}',
    invalidList: 'Liste invalide : {{list}}',
  },

  // Stats command
  stats: {
    loading: 'Chargement des statistiques...',
    failed: 'Échec du chargement des statistiques',
    memberNotFound: 'Membre non trouvé : @{{username}}',
    title: 'Statistiques du board - {{name}}',
    period: 'Période : {{days}} derniers jours',
    member: 'Membre : @{{member}}',
    cardsSection: 'Cartes',
    total: 'Total',
    created: 'Créées',
    completed: 'Complétées',
    archived: 'Archivées',
    inProgress: 'En cours',
    velocitySection: 'Vélocité',
    avgCompletion: 'Complétion moyenne',
    cardsPerWeek: 'cartes/semaine',
    avgCycleTime: 'Temps de cycle moyen',
    days: 'jours',
    cards: 'cartes',
    membersSection: 'Activité des membres',
    labelsSection: 'Distribution des labels',
    trendsSection: 'Tendances',
    productivityVsLastPeriod: 'productivité vs période précédente',
    completionRate: 'taux de complétion',
  },

  // Template command
  template: {
    creating: 'Création du template "{{name}}"',
    promptName: 'Nom du template :',
    promptDescription: 'Modèle de description :',
    promptLabels: 'Labels par défaut :',
    promptList: 'Liste par défaut :',
    created: 'Template "{{name}}" créé',
    alreadyExists: 'Le template "{{name}}" existe déjà',
    notFound: 'Template "{{name}}" non trouvé',
    deleted: 'Template "{{name}}" supprimé',
    listTitle: 'Templates disponibles',
    noTemplates: 'Aucun template trouvé',
    createHint: 'Créez-en un avec : tt template create <nom>',
    usageHint: 'Usage : tt create --template <nom> "Titre de la carte"',
    showTitle: 'Template : {{name}}',
    showName: 'Nom :',
    showLabels: 'Labels :',
    showList: 'Liste par défaut :',
    showDescription: 'Modèle de description :',
  },

  // Batch command
  batch: {
    dryRun: 'Simulation (aucun changement)',
    moving: 'Déplacement de {{count}} cartes...',
    moveComplete: '{{success}} cartes déplacées ({{failed}} échecs)',
    archiving: 'Archivage de {{count}} cartes...',
    archiveComplete: '{{success}} cartes archivées ({{failed}} échecs)',
    unarchiving: 'Désarchivage de {{count}} cartes...',
    unarchiveComplete: '{{success}} cartes désarchivées ({{failed}} échecs)',
    labeling: 'Mise à jour des labels sur {{count}} cartes...',
    labelComplete: 'Label modifié sur {{success}} cartes ({{failed}} échecs)',
    assigning: 'Mise à jour des assignations sur {{count}} cartes...',
    assignComplete: 'Membre modifié sur {{success}} cartes ({{failed}} échecs)',
    invalidCards: 'Numéros de cartes invalides : {{cards}}',
    listNotFound: 'Liste non trouvée : {{list}}',
    labelNotFound: 'Label non trouvé : {{label}}',
    memberNotFound: 'Membre non trouvé : {{member}}',
  },

  // Board command
  board: {
    info: {
      title: 'Informations du board',
      description: 'Description :',
      statistics: 'Statistiques :',
      lists: 'Listes :',
      members: 'Membres :',
      labels: 'Labels :',
      cards: 'Cartes :',
      overdue: 'En retard :',
      lastSync: 'Dernière sync :',
    },
  },

  // Due command
  due: {
    title: 'Cartes avec échéances',
    overdue: 'EN RETARD',
    today: "AUJOURD'HUI",
    thisWeek: 'CETTE SEMAINE',
    thisMonth: 'CE MOIS',
    later: 'PLUS TARD',
    noCards: 'Aucune carte avec échéance',
    daysAgo: 'il y a {{days}} jours',
    daysLeft: 'dans {{days}} jours',
    total: 'Total : {{count}} cartes avec échéance',
  },

  // Config command
  config: {
    get: {
      language: 'Langue : {{lang}}',
      authMode: "Mode d'authentification : {{mode}}",
      unknown: 'Clé de configuration inconnue : {{key}}',
    },
    set: {
      languageUpdated: 'Langue mise à jour : {{lang}}',
      invalidLanguage: 'Langue invalide. Supportées : {{languages}}',
      unknown: 'Clé de configuration inconnue : {{key}}',
    },
    list: {
      title: 'Configuration actuelle',
    },
  },

  // Errors
  errors: {
    notAuthenticated:
      'Non authentifié. Exécutez "tt auth apikey" pour vous authentifier.',
    networkError: 'Erreur réseau. Vérifiez votre connexion internet.',
    apiError: 'Erreur API Trello : {{message}}',
    unknownError: 'Une erreur inattendue est survenue.',
    cacheNotFound:
      'Projet non initialisé. Exécutez "tt init" dans le répertoire de votre projet.',
    auth: {
      title: "Erreur d'authentification",
    },
    network: {
      timeout: 'Délai de connexion dépassé',
      offline: 'Pas de connexion internet',
      retryHint: 'Vérifiez votre connexion et réessayez.',
      checkConnection: 'Vérifiez votre connexion internet.',
    },
    rateLimit: {
      title: 'Limite API dépassée',
      hint: 'Attendez quelques secondes et réessayez.',
    },
    validation: {
      title: 'Erreur de validation',
      field: 'Champ',
    },
    notFound: {
      configHint: 'Vérifiez votre configuration avec : tt config',
      syncHint: 'Ou actualisez le cache avec : tt init',
    },
    api: {
      title: 'Erreur API Trello',
    },
    unexpected: {
      title: 'Erreur inattendue',
      debugHint: 'Définissez DEBUG=true pour plus de détails.',
    },
  },
} as const;
