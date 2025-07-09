# Chess MCP

[![npm version](https://badge.fury.io/js/@makimoto%2Fchess-mcp.svg)](https://badge.fury.io/js/@makimoto%2Fchess-mcp)
[![CI/CD](https://github.com/makimoto/chess-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/makimoto/chess-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@makimoto/chess-mcp.svg)](https://nodejs.org/)

A Model Context Protocol (MCP) server for chess games between LLM agents and human players. This server provides a comprehensive chess game management system with support for game creation, move execution, draw detection, and game state management.

## Features

- **Complete Chess Game Management**: Create, manage, and play chess games
- **MCP Integration**: Seamlessly integrate with Claude and other LLM agents
- **Advanced Draw Detection**: Automatic detection of stalemate, insufficient material, fifty-move rule, and threefold repetition
- **Multiple Storage Options**: In-memory and SQLite storage adapters
- **Comprehensive Game State**: Track game history, player information, and game status
- **PGN Import/Export**: Import and export games in standard PGN format
- **Move Validation**: Comprehensive move validation with detailed error messages
- **Game Controls**: Pause/resume, resign, and draw offers

## Quick Start

Get Chess MCP running in under 5 minutes:

```bash
# 1. Install Chess MCP globally
npm install -g @makimoto/chess-mcp

# 2. The server is automatically configured for Claude
# Just restart Claude Desktop

# 3. Start using chess commands in Claude!
```

**Try these commands with Claude:**
- "Create a chess game between Alice and Bob"
- "Show me the board"
- "Move e2 to e4"
- "What moves can I make?"

That's it! You're ready to play chess with Claude. For more detailed setup instructions, see the [Installation](#installation) section below.

## Installation

### For Claude MCP Users

```bash
claude mcp add @makimoto/chess-mcp
```

### Manual Installation

```bash
npm install -g @makimoto/chess-mcp
```

## Configuration

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn package manager

### Automatic Configuration

When you install Chess MCP via npm, it automatically configures itself for Claude MCP:

```bash
npm install -g @makimoto/chess-mcp
# Automatically adds configuration to ~/.claude/claude_desktop_config.json
```

### Manual Configuration

If automatic configuration doesn't work, you can manually add Chess MCP to your Claude configuration:

1. **Locate your Claude configuration file:**
   - macOS/Linux: `~/.claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\.claude\claude_desktop_config.json`

2. **Add Chess MCP server configuration:**

```json
{
  "mcpServers": {
    "chess-mcp": {
      "command": "node",
      "args": ["/path/to/global/node_modules/@makimoto/chess-mcp/dist/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

3. **Find the correct path to the server:**

```bash
# Find where npm installed the package globally
npm list -g @makimoto/chess-mcp

# Or use npm root to find the global modules directory
npm root -g
```

### Configuration Options

You can customize the Chess MCP server behavior using environment variables:

```json
{
  "mcpServers": {
    "chess-mcp": {
      "command": "node",
      "args": ["/path/to/chess-mcp/dist/server.js"],
      "env": {
        "NODE_ENV": "production",
        "STORAGE_TYPE": "sqlite",
        "DATABASE_PATH": "./chess-games.db",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Available Environment Variables:**

- `NODE_ENV`: Set to "production" for optimal performance
- `STORAGE_TYPE`: Choose between "memory" (default) or "sqlite"
- `DATABASE_PATH`: Path to SQLite database file (when using sqlite storage)
- `LOG_LEVEL`: Logging verbosity ("error", "warn", "info", "debug")

### Verification

After configuration, restart Claude and verify the installation:

1. **Check if Chess MCP is loaded:**
   - Look for chess-related tools in Claude's available functions
   - Try creating a game: "Create a new chess game between Alice and Bob"

2. **Test basic functionality:**
   - Create a game
   - Make a few moves
   - Check game status
   - List games

### Troubleshooting

**Common Issues:**

1. **"command not found" error:**
   ```bash
   # Verify global installation
   npm list -g @makimoto/chess-mcp
   
   # Reinstall if necessary
   npm uninstall -g @makimoto/chess-mcp
   npm install -g @makimoto/chess-mcp
   ```

2. **Permission errors on Unix systems:**
   ```bash
   # Use sudo for global installation
   sudo npm install -g @makimoto/chess-mcp
   
   # Or configure npm to use a different directory
   npm config set prefix ~/.npm-global
   export PATH=~/.npm-global/bin:$PATH
   ```

3. **Claude doesn't recognize chess tools:**
   - Ensure the path in configuration is correct
   - Check that Node.js version is >= 18.0.0
   - Restart Claude Desktop completely
   - Check Claude's console/logs for error messages

4. **Manual uninstallation:**
   ```bash
   # Remove from Claude configuration
   npm run mcp:remove
   
   # Uninstall package
   npm uninstall -g @makimoto/chess-mcp
   ```

## Usage

### With Claude MCP

After installation, the chess MCP server will be available to Claude with the following tools:

- `create_game` - Create a new chess game
- `get_game_status` - Get current game status and board position
- `make_move` - Make a move in the game
- `list_games` - List all games with optional filtering
- `resign_game` - Resign from a game
- `offer_draw` - Offer a draw
- `accept_draw` - Accept a draw offer
- `decline_draw` - Decline a draw offer
- `get_legal_moves` - Get legal moves for current position
- `get_board_state` - Get board state in various formats
- `validate_move` - Validate a move without executing it
- `get_move_history` - Get move history in various formats
- `export_game` - Export game in PGN or FEN format
- `import_game` - Import game from PGN format
- `pause_game` - Pause an active game
- `resume_game` - Resume a paused game

### Manual Usage

```bash
# Start the MCP server
chess-mcp

# Or run from source
npm start
```

## MCP Tools Reference

### Game Management

#### `create_game`
Create a new chess game between two players.

**Parameters:**
- `whitePlayerId` (string): ID of the white player
- `blackPlayerId` (string): ID of the black player

**Returns:**
- `gameId` (string): Unique game identifier
- `status` (string): Game status
- `whitePlayer` (string): White player ID
- `blackPlayer` (string): Black player ID
- `currentTurn` (string): Current player's turn
- `fen` (string): Current board position in FEN notation

#### `get_game_status`
Get the current status of a chess game.

**Parameters:**
- `gameId` (string): Game identifier

**Returns:**
- Complete game state including board position, move history, and game status

#### `make_move`
Make a move in a chess game.

**Parameters:**
- `gameId` (string): Game identifier
- `move` (string): Move in algebraic notation (e.g., "e2e4", "Nf3")
- `playerId` (string): ID of the player making the move

**Returns:**
- Updated game state after the move

### Board Analysis

#### `get_board_state`
Get the current board state in various formats.

**Parameters:**
- `gameId` (string): Game identifier
- `format` (string): Format type ("visual", "FEN", "PGN")

**Returns:**
- Board representation in requested format

#### `get_legal_moves`
Get all legal moves for the current position.

**Parameters:**
- `gameId` (string): Game identifier
- `square` (string, optional): Specific square to get moves from

**Returns:**
- Array of legal moves

#### `validate_move`
Validate a move without executing it.

**Parameters:**
- `gameId` (string): Game identifier
- `move` (string): Move to validate

**Returns:**
- Validation result with detailed feedback

### Game History

#### `get_move_history`
Get the move history of a game.

**Parameters:**
- `gameId` (string): Game identifier
- `format` (string): Format type ("algebraic", "UCI", "verbose", "with_fen", "detailed")

**Returns:**
- Move history in requested format

#### `export_game`
Export a game in PGN or FEN format.

**Parameters:**
- `gameId` (string): Game identifier
- `format` (string): Export format ("PGN", "FEN")

**Returns:**
- Game data in requested format

#### `import_game`
Import a game from PGN format.

**Parameters:**
- `pgn` (string): PGN string to import
- `metadata` (object, optional): Additional metadata

**Returns:**
- Imported game information

### Game Controls

#### `resign_game`
Resign from a chess game.

**Parameters:**
- `gameId` (string): Game identifier
- `playerId` (string): ID of the player resigning

#### `offer_draw`
Offer a draw in a chess game.

**Parameters:**
- `gameId` (string): Game identifier
- `playerId` (string): ID of the player offering draw

#### `accept_draw` / `decline_draw`
Accept or decline a draw offer.

**Parameters:**
- `gameId` (string): Game identifier
- `playerId` (string): ID of the player responding

#### `pause_game` / `resume_game`
Pause or resume a chess game.

**Parameters:**
- `gameId` (string): Game identifier
- `playerId` (string): ID of the player (for pause only)

### Game Listing

#### `list_games`
List games with optional filtering.

**Parameters:**
- `playerId` (string, optional): Filter by player ID
- `status` (string, optional): Filter by status ("active", "completed", "paused")

**Returns:**
- Array of games matching the criteria

## Examples

### Basic Game Flow

```javascript
// Create a new game
const game = await createGame("alice", "bob");

// Make moves
await makeMove(game.gameId, "e2e4", "alice");
await makeMove(game.gameId, "e7e5", "bob");

// Get current board state
const boardState = await getBoardState(game.gameId, "visual");

// Get legal moves
const legalMoves = await getLegalMoves(game.gameId);

// Export game
const pgn = await exportGame(game.gameId, "PGN");
```

### Advanced Features

```javascript
// Import a game from PGN
const imported = await importGame(`
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7
`);

// Check game status with draw detection
const status = await getGameStatus(game.gameId);
console.log(status.drawStatus); // null, or draw information

// Pause and resume games
await pauseGame(game.gameId, "alice");
await resumeGame(game.gameId);
```

### Configuration Examples

#### Basic Claude MCP Configuration

```json
{
  "mcpServers": {
    "chess-mcp": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/@makimoto/chess-mcp/dist/server.js"]
    }
  }
}
```

#### Advanced Configuration with Multiple Options

```json
{
  "mcpServers": {
    "chess-mcp": {
      "command": "node",
      "args": ["/path/to/chess-mcp/dist/server.js"],
      "env": {
        "NODE_ENV": "production",
        "STORAGE_TYPE": "sqlite",
        "DATABASE_PATH": "/var/lib/chess-mcp/games.db",
        "LOG_LEVEL": "info"
      }
    },
    "other-mcp-server": {
      "command": "python",
      "args": ["/path/to/other/server.py"]
    }
  }
}
```

#### Development Configuration

```json
{
  "mcpServers": {
    "chess-mcp-dev": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/path/to/chess-mcp-development",
      "env": {
        "NODE_ENV": "development",
        "STORAGE_TYPE": "memory",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

#### Docker-based Configuration

```json
{
  "mcpServers": {
    "chess-mcp": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "chess-mcp:latest"],
      "env": {
        "STORAGE_TYPE": "sqlite",
        "DATABASE_PATH": "/data/chess.db"
      }
    }
  }
}
```

### Usage Patterns with Claude

#### Starting a Chess Game

**User:** "Create a new chess game between me and the AI"

**Claude:** "I'll create a new chess game for you. Let me set that up."

```
Tool: create_game
Parameters: {"whitePlayerId": "human", "blackPlayerId": "claude"}
```

#### Making Moves

**User:** "I want to move my pawn from e2 to e4"

**Claude:** "I'll make that move for you."

```
Tool: make_move
Parameters: {"gameId": "game-123", "move": "e2e4", "playerId": "human"}
```

#### Analyzing Position

**User:** "Show me the current board and what moves I can make"

**Claude:** "Here's the current position and your available moves."

```
Tool: get_board_state
Parameters: {"gameId": "game-123", "format": "visual"}

Tool: get_legal_moves
Parameters: {"gameId": "game-123"}
```

#### Game Analysis

**User:** "Import this PGN and analyze the game: 1.e4 e5 2.Nf3 Nc6 3.Bb5"

**Claude:** "I'll import this game and provide analysis."

```
Tool: import_game
Parameters: {"pgn": "1.e4 e5 2.Nf3 Nc6 3.Bb5"}

Tool: get_move_history
Parameters: {"gameId": "imported-game-id", "format": "detailed"}
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/makimoto/chess-mcp.git
cd chess-mcp

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Start development server
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run typecheck
```

## Architecture

The Chess MCP server is built with a modular architecture:

- **MCP Layer**: Handles Model Context Protocol communication
- **Game Management**: Core game logic and state management
- **Chess Engine**: Chess rule validation and move execution
- **Storage Layer**: Pluggable storage adapters (In-memory, SQLite)
- **Types**: Comprehensive TypeScript type definitions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/makimoto/chess-mcp/issues)
- **Documentation**: [GitHub Wiki](https://github.com/makimoto/chess-mcp/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/makimoto/chess-mcp/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

Made with ❤️ by [Shimpei Makimoto](https://github.com/makimoto)