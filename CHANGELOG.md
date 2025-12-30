# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **OAuth Authentication**
  - OAuth Manual PIN flow for team/enterprise environments
  - Organization API Key sharing (admin distributes key, users authorize individually)
  - Scoped tokens per user, individually revocable

## [1.0.0] - 2025-12-30

### Added

- **Authentication**
  - API Key authentication with secure credential storage
  - Authentication status command

- **Board Management**
  - Project initialization with interactive board selection
  - List mapping (To Do, Doing, Done)
  - Local cache for offline access

- **Card Operations**
  - Create cards with title, description, due date, labels, and members
  - Move cards between lists (interactive or direct)
  - Show card details
  - Update card properties (title, description, due date, labels, members)
  - Archive and unarchive cards

- **Git Integration**
  - Auto-suggest card titles from branch names
  - Support for feature, bugfix, and hotfix branch patterns
  - Ticket ID extraction (JIRA-style)

- **Members & Labels**
  - List board members
  - List board labels
  - Assign members and labels by name (no IDs exposed)

- **Configuration**
  - Language configuration (English, French)
  - Per-project board configuration

- **Internationalization**
  - English (default)
  - French

- **Developer Experience**
  - Interactive prompts with arrow key navigation
  - Spinner feedback for API operations
  - Colored output with chalk
  - Comprehensive error handling

### Security

- Credentials stored in user config directory
- Trello IDs never exposed to users
- Username and label name resolution handled internally

[1.0.0]: https://github.com/osirisbalonga/trello-cli/releases/tag/v1.0.0
