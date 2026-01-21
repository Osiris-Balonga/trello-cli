# @osirisbalonga/trello-cli

[![npm version](https://img.shields.io/npm/v/@osirisbalonga/trello-cli.svg)](https://www.npmjs.com/package/@osirisbalonga/trello-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)](https://nodejs.org/)

A modern CLI for managing tasks from your terminal. Currently supports **Trello**, with GitHub Issues and Linear coming soon.

![Demo](./assets/demo.gif)

## Features

- **Multi-provider support** - Trello now, GitHub Issues & Linear coming soon
- **Fast task management** - Create, move, update tasks in seconds
- **Git integration** - Auto-suggest titles from branch names
- **Interactive mode** - Arrow key navigation, no cryptic IDs
- **Local cache** - Works offline, syncs when needed
- **Multi-language** - English and French supported
- **Secure** - Credentials stored safely, no IDs exposed

## Quick Start

```bash
# Install globally
npm install -g @osirisbalonga/trello-cli

# Authenticate
tt auth trello apikey

# Initialize your project (select provider interactively)
tt init

# Start managing tasks
tt                          # List all tasks
tt create "Fix login bug"   # Create a task
tt move 3 doing             # Move task #3 to Doing
```

## Supported Providers

| Provider | Status | Auth Methods |
|----------|--------|--------------|
| Trello | Available | API Key, OAuth |
| GitHub Issues | Coming soon | - |
| Linear | Coming soon | - |

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

### Trello

#### API Key (Personal Use)

```bash
tt auth trello apikey
# or (shortcut)
tt auth apikey
```

1. Go to [trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Create a new Power-Up (or use an existing one)
3. Generate an API Key
4. Generate a Token with the "Generate Token" link

#### OAuth (Teams)

```bash
tt auth trello oauth
# or (shortcut)
tt auth oauth
```

OAuth is ideal for enterprise/team environments:
1. **Admin** creates a Power-Up and shares the API Key
2. **Each user** runs `tt auth oauth` and authorizes with their own account
3. Each user gets their own scoped token (can be revoked individually)

#### Verify Authentication

```bash
tt auth status
```

## Project Setup

Initialize the CLI for your project:

```bash
cd my-project
tt init
# 1. Select a provider (Trello, GitHub Issues, Linear)
# 2. Select your board/project
# 3. Configuration saved to .taskpilot.json
```

## Commands Reference

### `tt` / `tt list`

List all tasks from the configured board, grouped by column.

```bash
tt                    # Quick dashboard
tt list               # Same as above
tt list --mine        # Only my tasks
tt list --table       # Table format
tt list --member @john  # Filter by member
```

### `tt create`

Create a new task.

```bash
# Basic
tt create "Task title"

# With options
tt create "Fix auth bug" --desc "Session expires too fast" --due 2025-02-15

# With labels and members
tt create "New feature" --labels "feature,urgent" --members "@john,@jane"

# Specify target column
tt create "Done task" --list done
```

**Options:**

| Option | Description |
|--------|-------------|
| `-d, --desc <text>` | Task description |
| `--due <date>` | Due date (YYYY-MM-DD) |
| `-l, --labels <names>` | Comma-separated label names |
| `-m, --members <usernames>` | Comma-separated usernames |
| `--list <alias>` | Target column: `todo`, `doing`, `done` |

### `tt move`

Move a task to another column.

```bash
tt move 3 doing      # Move task #3 to Doing
tt move 5 done       # Move task #5 to Done
tt move 3            # Interactive mode (arrow keys)
```

### `tt show`

Display task details.

```bash
tt show 3            # Show details for task #3
```

### `tt update`

Update an existing task.

```bash
tt update 3 --name "New title"
tt update 3 --desc "Updated description"
tt update 3 --due 2025-03-01
tt update 3 --due clear        # Remove due date
tt update 3 --labels "bug,urgent"
tt update 3 --archive
tt update 3                    # Interactive mode
```

### `tt sync`

Sync local cache with remote provider.

```bash
tt sync              # Refresh members, labels, columns
```

### `tt search`

Search tasks by keyword.

```bash
tt search "login"
tt search "bug" --list todo
```

### `tt due`

List tasks by due date.

```bash
tt due               # Tasks due soon
tt due --overdue     # Overdue tasks only
tt due --week        # Due this week
```

### `tt members` / `tt labels`

Manage board members and labels.

```bash
tt members list
tt labels list
tt labels list --refresh
```

### `tt config`

Manage CLI configuration.

```bash
tt config list               # Show all settings
tt config get language       # Get specific setting
tt config set language fr    # Set language to French
```

### `tt auth`

Manage authentication.

```bash
tt auth trello apikey   # Trello API key auth
tt auth trello oauth    # Trello OAuth flow
tt auth status          # Check auth status
tt auth logout          # Clear credentials
```

## Configuration

### Global Config

Located at `~/.config/trello-cli/config.json`:

```json
{
  "language": "en",
  "authMode": "apikey"
}
```

### Project Config

Created by `tt init` at `.taskpilot.json`:

```json
{
  "provider": "trello",
  "boardId": "abc123",
  "boardName": "My Project",
  "columns": [...],
  "members": [...],
  "labels": [...],
  "lastSync": "2025-01-15T10:00:00Z"
}
```

> **Note:** Add `.taskpilot.json` to your `.gitignore` - it contains board-specific IDs.

## Git Integration

When creating tasks, the CLI suggests titles based on your Git branch:

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

The CLI automatically detects your system language. Supported:

- English (`en`) - default
- French (`fr`)

Change manually:

```bash
tt config set language fr
```

## Architecture

The CLI uses a provider abstraction layer for multi-provider support:

```
Commands (tt create, tt move, etc.)
       ↓
   Provider Interface
       ↓
┌──────┴──────┐
│   Trello    │  GitHub  │  Linear
│  Provider   │ (coming) │ (coming)
└─────────────┘
```

### Unified Data Models

| Model | Trello | GitHub | Linear |
|-------|--------|--------|--------|
| Task | Card | Issue | Issue |
| Column | List | Project Column | State |
| Board | Board | Repository/Project | Team/Project |
| Label | Label | Label | Label |
| Member | Member | Collaborator | User |

## Local Development

```bash
git clone https://github.com/osirisbalonga/trello-cli.git
cd trello-cli
pnpm install
pnpm build
pnpm test
pnpm local:install    # Install globally for testing
```

### Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Watch mode |
| `pnpm build` | Production build |
| `pnpm test` | Run tests |
| `pnpm test:coverage` | Tests with coverage |
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
