# @osirisbalonga/trello-cli

[![npm version](https://img.shields.io/npm/v/@osirisbalonga/trello-cli.svg)](https://www.npmjs.com/package/@osirisbalonga/trello-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)](https://nodejs.org/)

Manage your Trello cards from the terminal. Create, move, and track tasks without leaving your development environment.

![Demo](./assets/demo.gif)

## Features

- **Fast card management** - Create, move, update cards in seconds
- **Git integration** - Auto-suggest card titles from branch names
- **Interactive mode** - Arrow key navigation, no cryptic IDs
- **Local cache** - Works offline, syncs when needed
- **Multi-language** - English and French supported
- **Secure** - Credentials stored safely, no IDs exposed

## Quick Start

```bash
# Install globally
npm install -g @osirisbalonga/trello-cli

# Authenticate with Trello
tt auth apikey

# Initialize your project
tt init

# Start managing cards
tt                          # List all cards
tt create "Fix login bug"   # Create a card
tt move 3 doing             # Move card #3 to Doing
```

## Installation

### npm

```bash
npm install -g @osirisbalonga/trello-cli
```

### pnpm

```bash
pnpm add -g @osirisbalonga/trello-cli
```

### yarn

```bash
yarn global add @osirisbalonga/trello-cli
```

After installation, the CLI is available as `tt` or `trello-cli`.

## Authentication

### Get your Trello credentials

1. Go to [trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Create a new Power-Up (or use an existing one)
3. Generate an API Key
4. Generate a Token with the "Generate Token" link

### Configure the CLI

```bash
tt auth apikey
```

You'll be prompted to enter your API Key and Token. Credentials are stored securely in `~/.config/trello-cli/config.json`.

### Verify authentication

```bash
tt auth status
```

## Commands Reference

### `tt` / `tt list`

List all cards from the configured board, grouped by list.

```bash
tt              # Quick dashboard
tt list         # Same as above
```

### `tt init`

Initialize Trello for the current project. Creates `.trello-cli.json` in the project root.

```bash
cd my-project
tt init
# Select your board interactively
# Map your lists (To Do, Doing, Done)
```

### `tt create`

Create a new card.

```bash
# Basic
tt create "Task title"

# With options
tt create "Fix auth bug" --desc "Session expires too fast" --due 2025-02-15

# With labels and members
tt create "New feature" --labels "feature,urgent" --members "@john,@jane"

# Specify target list
tt create "Done task" --list done
```

**Options:**
| Option | Description |
|--------|-------------|
| `-d, --desc <text>` | Card description |
| `--due <date>` | Due date (YYYY-MM-DD) |
| `-l, --labels <names>` | Comma-separated label names |
| `-m, --members <usernames>` | Comma-separated usernames |
| `--list <alias>` | Target list: `todo`, `doing`, `done` (default: `todo`) |

### `tt move`

Move a card to another list.

```bash
# With list argument
tt move 3 doing      # Move card #3 to Doing
tt move 5 done       # Move card #5 to Done

# Interactive mode
tt move 3            # Select list with arrow keys
```

### `tt show`

Display card details.

```bash
tt show 3            # Show details for card #3
```

Displays: title, list, due date, labels, members, description, and URL.

### `tt update`

Update an existing card.

```bash
# Update title
tt update 3 --name "New title"

# Update description
tt update 3 --desc "Updated description"

# Update due date
tt update 3 --due 2025-03-01
tt update 3 --due clear        # Remove due date

# Update labels and members
tt update 3 --labels "bug,urgent"
tt update 3 --members "@john"

# Archive/unarchive
tt update 3 --archive
tt update 3 --unarchive

# Interactive mode (no options)
tt update 3
```

**Options:**
| Option | Description |
|--------|-------------|
| `-n, --name <title>` | New card title |
| `-d, --desc <text>` | New description |
| `--due <date>` | Due date (YYYY-MM-DD or "clear") |
| `-l, --labels <names>` | Comma-separated label names |
| `-m, --members <usernames>` | Comma-separated usernames |
| `--archive` | Archive the card |
| `--unarchive` | Unarchive the card |

### `tt members`

Manage board members.

```bash
tt members list              # List all members
tt members list --refresh    # Refresh from Trello
```

### `tt labels`

Manage board labels.

```bash
tt labels list               # List all labels
tt labels list --refresh     # Refresh from Trello
```

### `tt config`

Manage CLI configuration.

```bash
tt config list               # Show all settings
tt config get language       # Get specific setting
tt config set language fr    # Set language to French
```

**Configurable keys:**
- `language` - Interface language (`en`, `fr`)

### `tt auth`

Manage authentication.

```bash
tt auth apikey     # Configure API key authentication (personal use)
tt auth oauth      # OAuth flow for teams (shared org API key)
tt auth status     # Check authentication status
```

#### OAuth for Teams

OAuth is ideal for enterprise/team environments where you cannot distribute API tokens to everyone:

1. **Admin** creates a Power-Up on [trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. **Admin** shares only the API Key with team members
3. **Each user** runs `tt auth oauth` and authorizes with their own Trello account

This way, each user gets their own scoped token tied to their account, which can be revoked individually.

## Configuration

### Global config

Located at `~/.config/trello-cli/config.json`:

```json
{
  "language": "en",
  "authMode": "apikey"
}
```

### Project config

Created by `tt init` at `.trello-cli.json`:

```json
{
  "boardId": "abc123",
  "boardName": "My Project",
  "lists": {
    "todo": { "id": "list1", "name": "To Do" },
    "doing": { "id": "list2", "name": "In Progress" },
    "done": { "id": "list3", "name": "Done" }
  },
  "members": { ... },
  "labels": { ... },
  "lastSync": "2025-01-15T10:00:00Z"
}
```

> **Note:** Add `.trello-cli.json` to your `.gitignore` - it contains board-specific IDs.

## Git Integration

When creating cards without a title, the CLI suggests a title based on your current Git branch:

```bash
# On branch: feature/PROJ-123-add-user-auth
tt create
# Suggests: "[PROJ-123] Add user auth"
```

Branch patterns supported:
- `feature/add-login` → "Add login"
- `bugfix/PROJ-123-fix-crash` → "[Bug] [PROJ-123] Fix crash"
- `hotfix/urgent-patch` → "[Hotfix] Urgent patch"

## Internationalization

The CLI automatically detects your system language. Supported languages:

- English (`en`) - default
- French (`fr`)

Change manually:

```bash
tt config set language fr
```

## Local Development

```bash
# Clone the repository
git clone https://github.com/osirisbalonga/trello-cli.git
cd trello-cli

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Install globally for testing
pnpm local:install

# Uninstall
pnpm local:uninstall
```

### Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Watch mode |
| `pnpm build` | Production build |
| `pnpm test` | Run tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Lint code |
| `pnpm typecheck` | Type check |

## Requirements

- Node.js >= 20.0.0
- pnpm >= 9.0.0 (for development)

## License

MIT - see [LICENSE](./LICENSE)

## Author

**Osiris Balonga** - [@osirisbalonga](https://github.com/osirisbalonga)

---

Made with love for developers who live in the terminal.
