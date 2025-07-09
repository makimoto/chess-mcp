#!/usr/bin/env node

/**
 * Chess MCP Server - Entry Point
 *
 * This server implements the Model Context Protocol (MCP) for chess game management.
 * It allows LLM agents and applications to interact with chess games through standardized tools.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { ChessMCPServer } from './mcp/ChessMCPServer.js';
import { GameManager } from './core/game/GameManager.js';
import { InMemoryAdapter } from './core/storage/InMemoryAdapter.js';
import { SQLiteAdapter } from './core/storage/SQLiteAdapter.js';

// Server configuration
const SERVER_NAME = 'chess-mcp-server';
const SERVER_VERSION = '0.1.0';

/**
 * Server configuration options
 */
interface ServerConfig {
  storage: 'memory' | 'sqlite';
  dbPath?: string;
  verbose: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ServerConfig {
  const args = process.argv.slice(2);
  const envDbPath = process.env['CHESS_DB_PATH'];
  const config: ServerConfig = {
    storage:
      (process.env['CHESS_STORAGE_TYPE'] as 'memory' | 'sqlite') || 'memory',
    ...(envDbPath && { dbPath: envDbPath }),
    verbose: process.env['CHESS_VERBOSE'] === 'true',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--storage': {
        const storageType = args[++i];
        if (!storageType) {
          console.error('--storage requires a value');
          process.exit(1);
        }
        if (storageType === 'memory' || storageType === 'sqlite') {
          config.storage = storageType;
        } else {
          console.error(
            `Invalid storage type: ${storageType}. Use 'memory' or 'sqlite'.`
          );
          process.exit(1);
        }
        break;
      }
      case '--db-path': {
        const dbPath = args[++i];
        if (!dbPath) {
          console.error('--db-path requires a value');
          process.exit(1);
        }
        config.dbPath = dbPath;
        break;
      }
      case '--verbose':
        config.verbose = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
      // eslint-disable-next-line no-fallthrough
      default:
        if (arg && arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          printHelp();
          process.exit(1);
        }
        break;
    }
  }

  return config;
}

/**
 * Print help information
 */
function printHelp(): void {
  console.log(`
Chess MCP Server v${SERVER_VERSION}

USAGE:
  chess-mcp-server [OPTIONS]

OPTIONS:
  --storage <type>     Storage backend: 'memory' or 'sqlite' (default: memory)
  --db-path <path>     Database file path (SQLite only, default: ./chess.db)
  --verbose            Enable verbose logging
  --help               Show this help message

ENVIRONMENT VARIABLES:
  CHESS_STORAGE_TYPE      Storage backend: 'memory' or 'sqlite'
  CHESS_DB_PATH          Database file path (SQLite only)
  CHESS_VERBOSE          Enable verbose logging: 'true' or 'false'

EXAMPLES:
  chess-mcp-server                           # Use in-memory storage
  chess-mcp-server --storage sqlite          # Use SQLite with default path
  chess-mcp-server --storage sqlite --db-path /path/to/chess.db
  chess-mcp-server --verbose                 # Enable verbose logging
  
  # Environment variable examples
  export CHESS_STORAGE_TYPE=sqlite
  export CHESS_DB_PATH=/var/chess/games.db
  chess-mcp-server                           # Use environment variables

TOOLS:
  create_game      Create a new chess game between two players
  get_game_status  Get the current status and state of a game
  make_move        Make a move in a chess game
  list_games       List games with optional filtering
  resign_game      Resign from a chess game
  offer_draw       Offer a draw in a chess game
  accept_draw      Accept a draw offer
  decline_draw     Decline a draw offer
`);
}

/**
 * Initialize storage adapter based on configuration
 */
async function initializeStorage(
  config: ServerConfig
): Promise<InMemoryAdapter | SQLiteAdapter> {
  if (config.storage === 'sqlite') {
    const dbPath = config.dbPath || './chess.db';
    if (config.verbose) {
      console.error(`Initializing SQLite storage at: ${dbPath}`);
    }
    const storage = new SQLiteAdapter(dbPath);
    await storage.initialize();
    return storage;
  } else {
    if (config.verbose) {
      console.error('Initializing in-memory storage');
    }
    return new InMemoryAdapter();
  }
}

/**
 * Main server function
 */
async function main(): Promise<void> {
  const config = parseArgs();

  if (config.verbose) {
    console.error(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);
    console.error(`Storage: ${config.storage}`);
  }

  try {
    // Initialize storage
    const storage = await initializeStorage(config);

    // Initialize game manager
    const gameManager = new GameManager(storage);

    // Initialize chess MCP server
    const chessMCPServer = new ChessMCPServer(gameManager);

    // Create MCP server
    const server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register tool handlers
    server.setRequestHandler(ListToolsRequestSchema, () => {
      const tools = chessMCPServer.getRegisteredTools();
      return {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      if (config.verbose) {
        console.error(`Executing tool: ${name} with args:`, args);
      }

      try {
        const result = await chessMCPServer.executeTool(name, args || {});

        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.data, null, 2),
              },
            ],
          };
        } else {
          throw new McpError(
            ErrorCode.InternalError,
            result.error || 'Tool execution failed'
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (config.verbose) {
          console.error(`Tool execution error: ${errorMessage}`);
        }
        throw new McpError(ErrorCode.InternalError, errorMessage);
      }
    });

    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);

    if (config.verbose) {
      console.error(
        `${SERVER_NAME} is running and ready to accept connections`
      );
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}
