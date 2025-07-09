# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Placeholder for future changes

## [0.1.0] - 2024-07-09

### Added
- Initial release of Chess MCP Server
- Complete chess game management system
- Model Context Protocol (MCP) integration for Claude and other LLM agents
- 16 MCP tools for comprehensive chess functionality:
  - `create_game` - Create new chess games
  - `get_game_status` - Get current game status and board position
  - `make_move` - Execute chess moves with validation
  - `list_games` - List and filter games
  - `resign_game` - Resign from games
  - `offer_draw` - Offer draws
  - `accept_draw` - Accept draw offers
  - `decline_draw` - Decline draw offers
  - `get_legal_moves` - Get legal moves for current position
  - `get_board_state` - Get board state in various formats (visual, FEN, PGN)
  - `validate_move` - Validate moves without executing
  - `get_move_history` - Get move history in multiple formats
  - `export_game` - Export games in PGN or FEN format
  - `import_game` - Import games from PGN format
  - `pause_game` - Pause active games
  - `resume_game` - Resume paused games
- Advanced chess engine features:
  - Complete move validation using chess.js
  - Automatic draw detection (stalemate, insufficient material, fifty-move rule, threefold repetition)
  - Support for all chess rules including castling, en passant, and promotion
  - Comprehensive game state tracking
- Multiple storage options:
  - In-memory storage (default) for development and testing
  - SQLite storage for persistent game data
- PGN import/export functionality:
  - Full PGN parsing and generation
  - Game metadata support
  - Import from standard PGN format
  - Export with proper chess notation
- Robust error handling and validation:
  - Move validation with detailed error messages
  - Player authentication for game actions
  - Game state validation
  - Input sanitization and type checking
- TypeScript implementation:
  - Full type safety with comprehensive type definitions
  - Extensive unit and integration test coverage (283 tests)
  - Clean, maintainable code architecture
- Automatic Claude MCP integration:
  - Automatic configuration during npm installation
  - Manual configuration support for advanced setups
  - Environment variable configuration options
- Comprehensive documentation:
  - Quick start guide (5-minute setup)
  - Detailed installation and configuration instructions
  - Usage examples and patterns
  - API reference for all MCP tools
  - Troubleshooting guide

### Technical Details
- Built with TypeScript 5.6.3
- Uses chess.js 1.4.0 for chess engine functionality
- SQLite3 5.1.7 for optional persistent storage
- Model Context Protocol SDK 1.15.0 for MCP integration
- Comprehensive test suite with Jest
- ESLint and Prettier for code quality
- Node.js >= 18.0.0 required

### Compatibility
- Compatible with Claude Desktop and other MCP-enabled clients
- Cross-platform support (Windows, macOS, Linux)
- MIT License - commercial and open source friendly

[Unreleased]: https://github.com/makimoto/chess-mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/makimoto/chess-mcp/releases/tag/v0.1.0