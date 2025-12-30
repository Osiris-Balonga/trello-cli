export default {
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
  },

  // Auth command
  auth: {
    title: 'Authentification API Key Trello',
    instructions: {
      intro: 'Pour obtenir votre clé API et votre token :',
      step1: '1. Ouvrez : https://trello.com/app-key',
      step2: '2. Copiez votre clé API',
      step3: '3. Cliquez sur "Token" pour générer un token',
      step4: "4. Autorisez l'accès",
      step5: '5. Copiez le token généré',
    },
    prompts: {
      apiKey: 'Entrez votre clé API :',
      token: 'Entrez votre token :',
    },
    validation: {
      apiKeyRequired: 'La clé API est requise',
      tokenRequired: 'Le token est requis',
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
      title: 'Authentification OAuth (pour équipes)',
      apiKeyExplanation:
        'OAuth nécessite la clé API de votre organisation (fournie par l\'admin).',
      enterOrgApiKey: 'Entrez la clé API de l\'organisation :',
      invalidApiKey: 'Format de clé API invalide (minimum 32 caractères)',
      usingStoredApiKey: 'Utilisation de la clé API stockée : {{key}}...',
      instructions:
        '1. Ouvrez l\'URL ci-dessous dans votre navigateur\n2. Cliquez sur "Autoriser" pour autoriser Trello CLI\n3. Copiez le token affiché sur la page',
      openBrowser: 'Ouvrir le navigateur automatiquement ?',
      enterToken: 'Collez le token ici :',
      invalidToken: 'Format de token invalide (64 caractères hexadécimaux attendus)',
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
