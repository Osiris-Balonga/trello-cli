export default {
  // CLI descriptions
  cli: {
    description: 'Trello CLI - Manage your Trello cards from the terminal',
    version: 'Output the version number',
    help: 'Display help for command',
    helpCommand: 'Display help for command',
    usage: 'Usage:',
    optionsTitle: 'Options:',
    commandsTitle: 'Commands:',
    argumentsTitle: 'Arguments:',
    commands: {
      auth: 'Authenticate with Trello API',
      init: 'Initialize Trello board for this project',
      list: 'List all cards from the board',
      create: 'Create a new card',
      move: 'Move a card to another list',
      show: 'Show card details',
      update: 'Update a card',
      members: 'Manage board members',
      labels: 'Manage board labels',
      config: 'Manage CLI configuration',
      sync: 'Sync local cache with Trello',
      search: 'Search cards by keyword',
      due: 'List cards with due dates',
      board: 'Board management commands',
      delete: 'Delete a card permanently',
      archive: 'Archive a card (shortcut for update --archive)',
      comment: 'Add or list comments on a card',
      watch: 'Watch a card for changes in real-time',
      export: 'Export cards to various formats',
      stats: 'Display board statistics',
      template: 'Manage card templates',
      batch: 'Perform bulk operations on multiple cards',
    },
    subcommands: {
      auth: {
        apikey: 'Authenticate with API Key and Token',
        oauth: 'Authenticate via browser (interactive)',
        status: 'Show authentication status',
        logout: 'Remove stored credentials',
      },
      members: {
        list: 'List all board members',
      },
      labels: {
        list: 'List all board labels',
      },
      config: {
        get: 'Get a configuration value',
        set: 'Set a configuration value',
        list: 'List all configuration values',
      },
      board: {
        info: 'Display board information and statistics',
      },
      template: {
        create: 'Create a new card template',
        list: 'List all templates',
        show: 'Show template details',
        delete: 'Delete a template',
      },
      batch: {
        move: 'Move multiple cards to a list',
        archive: 'Archive multiple cards',
        unarchive: 'Unarchive multiple cards',
        label: 'Add a label to multiple cards',
        unlabel: 'Remove a label from multiple cards',
        assign: 'Assign a member to multiple cards',
        unassign: 'Unassign a member from multiple cards',
      },
    },
    options: {
      description: 'Card description',
      due: 'Due date (YYYY-MM-DD)',
      labels: 'Labels (comma-separated)',
      members: 'Members (comma-separated)',
      list: 'Target list',
      force: 'Skip confirmation',
      unarchive: 'Unarchive the card',
      archive: 'Archive the card',
      listComments: 'List comments instead of adding',
      interval: 'Refresh interval in seconds',
      output: 'Output file path',
      period: 'Analysis period in days',
      member: 'Filter by member',
      parallel: 'Run operations in parallel',
      dryRun: 'Preview changes without applying',
      cards: 'Card numbers (comma-separated)',
      query: 'Search query',
      archived: 'Include archived cards',
      overdue: 'Show only overdue cards',
      today: 'Show only cards due today',
      week: 'Show cards due this week',
      month: 'Show cards due this month',
      template: 'Use a template',
      refresh: 'Refresh data from Trello',
      inTitle: 'Search in titles only',
      inDesc: 'Search in descriptions only',
      listFilter: 'Filter by list (todo/doing/done)',
    },
    arguments: {
      cardNumber: 'Card number from list',
      title: 'Card title',
      list: 'Target list alias (todo/doing/done)',
      format: 'Export format (json, csv, md, html)',
      configKey: 'Configuration key (language, authMode)',
      configValue: 'Configuration value',
      text: 'Comment text (interactive if omitted)',
      templateName: 'Template name',
      labelName: 'Label name',
      username: 'Member username',
      cards: 'Card numbers',
      name: 'New card title',
    },
  },

  // Common
  common: {
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    cancel: 'Cancel',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    none: 'None',
    notSet: 'Not set',
    unknown: 'Unknown',
    url: 'URL:',
    card: 'Card:',
    total: 'Total:',
    configFile: 'Config file:',
  },

  // Auth command
  auth: {
    title: 'Trello API Key Authentication',
    instructions: {
      intro: 'Get your API Key from:',
      tokenSteps:
        '1. Open the URL below in your browser\n2. Click "Allow" to authorize Trello CLI\n3. Copy the token displayed',
    },
    prompts: {
      apiKey: 'Enter your API Key:',
      pasteToken: 'Paste the token here:',
      openBrowser: 'Open browser automatically?',
    },
    validation: {
      apiKeyInvalid: 'Invalid API Key format (minimum 32 characters)',
      tokenInvalid: 'Invalid token format',
    },
    success: 'API Key configured successfully',
    configSaved: 'Config saved to: {{path}}',
    status: {
      title: 'Authentication Status',
      authenticated: 'Authenticated',
      notAuthenticated: 'Not authenticated',
      runAuth: 'Run: tt auth apikey',
      mode: 'Mode: {{mode}}',
      apiKey: 'API Key: {{key}}...',
      orgApiKey: 'Org API Key: {{key}}...',
      token: 'Token: {{token}}...',
      config: 'Config: {{path}}',
    },
    oauth: {
      title: 'Browser Authentication',
      apiKeyExplanation:
        'This method opens Trello in your browser to authorize the CLI.\nYou need an API Key (get yours at trello.com/power-ups/admin).',
      enterOrgApiKey: 'Enter your API Key:',
      invalidApiKey: 'Invalid API Key format (minimum 32 characters)',
      usingStoredApiKey: 'Using stored API Key: {{key}}...',
      instructions:
        '1. Open the URL below in your browser\n2. Click "Allow" to authorize Trello CLI\n3. Copy the token displayed on the page',
      openBrowser: 'Open browser automatically?',
      enterToken: 'Paste the token here:',
      invalidToken: 'Invalid token format',
      success: 'OAuth authentication configured!',
    },
    logout: {
      confirm: 'Are you sure you want to logout?',
      cancelled: 'Logout cancelled.',
      success: 'Logged out successfully. Credentials removed.',
      notAuthenticated: 'You are not logged in.',
    },
  },

  // Init command
  init: {
    fetching: 'Fetching your Trello boards...',
    loaded: 'Boards loaded',
    selectBoard: 'Select a board:',
    fetchingData: 'Fetching board data...',
    lessLists: 'Less than 3 lists found',
    lessListsWarning:
      'You need at least 3 lists (To Do, Doing, Done) for optimal workflow.',
    selectTodo: 'Select "To Do" list:',
    selectDoing: 'Select "Doing" list:',
    selectDone: 'Select "Done" list:',
    success: 'Board "{{name}}" configured for this project',
    configSaved: 'Config saved to: {{path}}',
    membersCached: 'Members cached: {{count}}',
    labelsCached: 'Labels cached: {{count}}',
    failed: 'Failed to initialize',
    errors: {
      noBoards: 'No boards found. Create a board on Trello first.',
      boardNotFound: 'Board not found (ID: {{id}})',
    },
  },

  // List command
  list: {
    loading: 'Loading cards...',
    loaded: 'Cards loaded',
    failed: 'Failed to load cards',
    errors: {
      boardNotFound: 'Board ID not found in cache',
    },
  },

  // Create command
  create: {
    prompts: {
      title: 'Card title:',
      description: 'Description (optional):',
    },
    validation: {
      titleRequired: 'Title required',
      titleTooLong: 'Title too long (max 500 characters)',
      invalidOptions: 'Invalid options:',
    },
    git: {
      useBranchTitle: 'Use branch name as title? "{{title}}"',
      usingBranchTitle: 'Using title from branch name',
    },
    creating: 'Creating card...',
    success: 'Card created: {{name}}',
    url: 'URL: {{url}}',
    labels: 'Labels: {{labels}}',
    members: 'Members: {{members}}',
    errors: {
      listNotFound:
        'List "{{list}}" not found in cache. Run "tt init" to refresh.',
    },
  },

  // Move command
  move: {
    loading: 'Loading cards...',
    prompt: 'Move "{{name}}" to:',
    moving: 'Moving to {{list}}...',
    success: '"{{name}}" → {{list}}',
    lists: {
      todo: 'To Do',
      doing: 'Doing',
      done: 'Done',
    },
    errors: {
      notInitialized: 'No board configured. Run "tt init" first.',
      invalidCard: 'Invalid card number. Must be between 1 and {{max}}.',
      listNotFound:
        'List "{{list}}" not found in cache. Run "tt init" to refresh.',
    },
  },

  // Show command
  show: {
    loading: 'Loading card...',
    fields: {
      list: 'List:',
      due: 'Due:',
      labels: 'Labels:',
      members: 'Members:',
      description: 'Description:',
      noDescription: 'No description',
      lastActivity: 'Last activity: {{date}}',
    },
    due: {
      overdue: '{{date}} (OVERDUE)',
      today: '{{date}} (TODAY)',
    },
    errors: {
      notInitialized: 'No board configured. Run "tt init" first.',
      invalidCard: 'Invalid card number. Must be between 1 and {{max}}.',
    },
  },

  // Update command
  update: {
    title: 'Updating: {{name}}',
    prompts: {
      newTitle: 'New title (leave empty to keep):',
      newDesc: 'New description (leave empty to keep):',
    },
    validation: {
      titleTooLong: 'Title too long (max 500 characters)',
      descTooLong: 'Description too long (max 16384 characters)',
      invalidDate: 'Invalid date format. Use YYYY-MM-DD.',
    },
    noChanges: 'No changes made.',
    noChangesToApply: 'No changes to apply.',
    updating: 'Updating card...',
    success: 'Card updated: {{name}}',
    changes: {
      title: 'title',
      description: 'description',
      dueDate: 'due date',
      dueDateCleared: 'due date cleared',
      labels: 'labels',
      members: 'members',
      archived: 'archived',
      unarchived: 'unarchived',
    },
    changed: 'Changed: {{changes}}',
    errors: {
      notInitialized: 'No board configured. Run "tt init" first.',
      invalidCard: 'Invalid card number. Must be between 1 and {{max}}.',
    },
  },

  // Members command
  members: {
    title: 'Board Members ({{count}})',
    fetching: 'Fetching members from Trello...',
    refreshed: 'Members refreshed',
    noMembers: 'No members found on this board.',
    table: {
      number: '#',
      username: 'Username',
      fullName: 'Full Name',
    },
    errors: {
      notInitialized: 'No board configured. Run "tt init" first.',
    },
  },

  // Labels command
  labels: {
    title: 'Board Labels ({{count}})',
    fetching: 'Fetching labels from Trello...',
    refreshed: 'Labels refreshed',
    noLabels: 'No labels found on this board.',
    noColor: 'No color',
    availableColors: 'Available colors:',
    table: {
      number: '#',
      name: 'Name',
      color: 'Color',
    },
    errors: {
      notInitialized: 'No board configured. Run "tt init" first.',
    },
  },

  // Sync command
  sync: {
    syncing: 'Syncing with Trello...',
    success: 'Synced {{members}} members, {{labels}} labels, {{lists}} lists',
    failed: 'Sync failed',
    lastSync: 'Last sync: {{date}}',
  },

  // Search command
  search: {
    searching: 'Searching...',
    found: 'Found {{count}} cards matching "{{query}}":',
    noResults: 'No cards found matching "{{query}}"',
    failed: 'Search failed',
    total: 'Total: {{count}} cards',
    due: 'Due:',
    overdue: 'OVERDUE',
    today: 'TODAY',
  },

  // Delete command
  delete: {
    warning: 'Warning: This will permanently delete the card!',
    confirm: 'Are you sure you want to delete this card?',
    cancelled: 'Deletion cancelled.',
    deleting: 'Deleting card...',
    success: 'Card deleted: "{{name}}"',
    failed: 'Failed to delete card',
    invalidCard: 'Invalid card number. Must be between 1 and {{max}}.',
    cardLabel: 'Card:',
    listLabel: 'List:',
  },

  // Archive command
  archive: {
    archiving: 'Archiving card...',
    unarchiving: 'Unarchiving card...',
    archiveSuccess: 'Card archived: "{{name}}"',
    unarchiveSuccess: 'Card unarchived: "{{name}}"',
    archiveFailed: 'Failed to archive card',
    unarchiveFailed: 'Failed to unarchive card',
    invalidCard: 'Invalid card number. Must be between 1 and {{max}}.',
  },

  // Comment command
  comment: {
    title: 'Comments on "{{name}}"',
    enterText: 'Enter your comment:',
    adding: 'Adding comment...',
    loading: 'Loading comments...',
    success: 'Comment added successfully',
    failed: 'Failed to add comment',
    empty: 'Comment cannot be empty',
    noComments: 'No comments on this card',
    invalidCard: 'Invalid card number. Must be between 1 and {{max}}.',
  },

  // Watch command
  watch: {
    watching: 'Watching',
    pressCtrlC: 'Press Ctrl+C to stop',
    changed: 'Card changed!',
    refreshing: 'Refreshing in {{seconds}}s',
    stopped: 'Watch stopped',
    error: 'Error refreshing card',
    status: 'Status',
    due: 'Due',
    members: 'Members',
    comments: 'Comments',
    recentComments: 'Recent comments',
    lastUpdated: 'Last updated',
    invalidCard: 'Invalid card number. Must be between 1 and {{max}}.',
  },

  // Export command
  export: {
    exporting: 'Exporting cards...',
    success: 'Exported to {{file}}',
    failed: 'Export failed',
    invalidFormat: 'Invalid format. Supported formats: {{formats}}',
    invalidList: 'Invalid list: {{list}}',
  },

  // Stats command
  stats: {
    loading: 'Loading statistics...',
    failed: 'Failed to load statistics',
    memberNotFound: 'Member not found: @{{username}}',
    title: 'Board Statistics - {{name}}',
    period: 'Period: Last {{days}} days',
    member: 'Member: @{{member}}',
    cardsSection: 'Cards',
    total: 'Total',
    created: 'Created',
    completed: 'Completed',
    archived: 'Archived',
    inProgress: 'In Progress',
    velocitySection: 'Velocity',
    avgCompletion: 'Avg. completion',
    cardsPerWeek: 'cards/week',
    avgCycleTime: 'Avg. cycle time',
    days: 'days',
    cards: 'cards',
    membersSection: 'Members Activity',
    labelsSection: 'Labels Distribution',
    trendsSection: 'Trends',
    productivityVsLastPeriod: 'productivity vs last period',
    completionRate: 'completion rate',
  },

  // Template command
  template: {
    creating: 'Creating template "{{name}}"',
    promptName: 'Template display name:',
    promptDescription: 'Description template:',
    promptLabels: 'Default labels:',
    promptList: 'Default list:',
    created: 'Template "{{name}}" created',
    alreadyExists: 'Template "{{name}}" already exists',
    notFound: 'Template "{{name}}" not found',
    deleted: 'Template "{{name}}" deleted',
    listTitle: 'Available Templates',
    noTemplates: 'No templates found',
    createHint: 'Create one with: tt template create <name>',
    usageHint: 'Usage: tt create --template <name> "Card title"',
    showTitle: 'Template: {{name}}',
    showName: 'Name:',
    showLabels: 'Labels:',
    showList: 'Default list:',
    showDescription: 'Description template:',
  },

  // Batch command
  batch: {
    dryRun: 'Dry run (no changes)',
    moving: 'Moving {{count}} cards...',
    moveComplete: 'Moved {{success}} cards ({{failed}} failed)',
    archiving: 'Archiving {{count}} cards...',
    archiveComplete: 'Archived {{success}} cards ({{failed}} failed)',
    unarchiving: 'Unarchiving {{count}} cards...',
    unarchiveComplete: 'Unarchived {{success}} cards ({{failed}} failed)',
    labeling: 'Updating labels on {{count}} cards...',
    labelComplete: '{{action}}ed label on {{success}} cards ({{failed}} failed)',
    assigning: 'Updating assignments on {{count}} cards...',
    assignComplete: '{{action}}ed member on {{success}} cards ({{failed}} failed)',
    invalidCards: 'Invalid card numbers: {{cards}}',
    listNotFound: 'List not found: {{list}}',
    labelNotFound: 'Label not found: {{label}}',
    memberNotFound: 'Member not found: {{member}}',
  },

  // Board command
  board: {
    info: {
      title: 'Board Information',
      description: 'Description:',
      statistics: 'Statistics:',
      lists: 'Lists:',
      members: 'Members:',
      labels: 'Labels:',
      cards: 'Cards:',
      overdue: 'Overdue:',
      lastSync: 'Last sync:',
    },
  },

  // Due command
  due: {
    title: 'Cards with Due Dates',
    overdue: 'OVERDUE',
    today: 'TODAY',
    thisWeek: 'THIS WEEK',
    thisMonth: 'THIS MONTH',
    later: 'LATER',
    noCards: 'No cards with due dates',
    daysAgo: '{{days}} days ago',
    daysLeft: 'in {{days}} days',
    total: 'Total: {{count}} cards with due dates',
  },

  // Config command
  config: {
    get: {
      language: 'Language: {{lang}}',
      authMode: 'Auth mode: {{mode}}',
      unknown: 'Unknown config key: {{key}}',
    },
    set: {
      languageUpdated: 'Language updated to: {{lang}}',
      invalidLanguage: 'Invalid language. Supported: {{languages}}',
      unknown: 'Unknown config key: {{key}}',
    },
    list: {
      title: 'Current Configuration',
    },
  },

  // Errors
  errors: {
    notAuthenticated:
      'Not authenticated. Run "tt auth apikey" to authenticate.',
    networkError: 'Network error. Check your internet connection.',
    apiError: 'Trello API error: {{message}}',
    unknownError: 'An unexpected error occurred.',
    cacheNotFound:
      'Project not initialized. Run "tt init" in your project directory.',
    auth: {
      title: 'Authentication error',
    },
    network: {
      timeout: 'Request timed out',
      offline: 'No internet connection',
      retryHint: 'Check your connection and try again.',
      checkConnection: 'Check your internet connection.',
    },
    rateLimit: {
      title: 'API rate limit exceeded',
      hint: 'Wait a few seconds and try again.',
    },
    validation: {
      title: 'Validation error',
      field: 'Field',
    },
    notFound: {
      configHint: 'Check your configuration with: tt config',
      syncHint: 'Or refresh the cache with: tt init',
    },
    api: {
      title: 'Trello API error',
    },
    unexpected: {
      title: 'Unexpected error',
      debugHint: 'Set DEBUG=true for more details.',
    },
  },
} as const;
