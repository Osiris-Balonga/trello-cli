export default {
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
  },

  // Auth command
  auth: {
    title: 'Trello API Key Authentication',
    instructions: {
      intro: 'To obtain your API Key and Token:',
      step1: '1. Open: https://trello.com/app-key',
      step2: '2. Copy your API Key',
      step3: '3. Click on "Token" to generate a token',
      step4: '4. Authorize access',
      step5: '5. Copy the generated token',
    },
    prompts: {
      apiKey: 'Enter your API Key:',
      token: 'Enter your Token:',
    },
    validation: {
      apiKeyRequired: 'API Key is required',
      tokenRequired: 'Token is required',
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
      title: 'OAuth Authentication (for teams)',
      apiKeyExplanation:
        'OAuth requires your organization\'s API Key (shared by admin).',
      enterOrgApiKey: 'Enter organization API Key:',
      invalidApiKey: 'Invalid API Key format (minimum 32 characters)',
      usingStoredApiKey: 'Using stored API Key: {{key}}...',
      instructions:
        '1. Open the URL below in your browser\n2. Click "Allow" to authorize Trello CLI\n3. Copy the token displayed on the page',
      openBrowser: 'Open browser automatically?',
      enterToken: 'Paste the token here:',
      invalidToken: 'Invalid token format (expected 64 hex characters)',
      success: 'OAuth authentication configured!',
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
