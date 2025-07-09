import { GameManager } from '../core/game/GameManager.js';
import { GAME_STATUS, PLAYER_COLOR } from '../constants/GameConstants.js';

export interface MCPToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface MCPServerInfo {
  name: string;
  version: string;
  description: string;
}

/**
 * MCP (Model Context Protocol) server for chess game management.
 *
 * Provides a comprehensive set of chess-related tools accessible via MCP protocol including:
 * - Game creation and management
 * - Move execution and validation
 * - Position analysis and legal move generation
 * - Game state queries and history retrieval
 * - Draw offers and game completion handling
 * - Import/export functionality for PGN and FEN formats
 *
 * @example
 * ```typescript
 * const gameManager = new GameManager();
 * const mcpServer = new ChessMCPServer(gameManager);
 *
 * // Execute a tool
 * const result = await mcpServer.executeTool('create_game', {
 *   whitePlayerId: 'alice',
 *   blackPlayerId: 'bob'
 * });
 *
 * if (result.success) {
 *   console.log('Game created:', result.data);
 * }
 * ```
 */
export class ChessMCPServer {
  public readonly name = 'chess-mcp-server';
  public readonly version = '0.1.0';
  private gameManager: GameManager;
  private tools: MCPTool[] = [];
  private toolHandlers!: Map<
    string,
    (params: Record<string, unknown>) => Promise<MCPToolResult>
  >;

  /**
   * Creates a new ChessMCPServer instance.
   *
   * @param gameManager - GameManager instance for handling chess game operations
   *
   * @example
   * ```typescript
   * const gameManager = new GameManager();
   * const server = new ChessMCPServer(gameManager);
   * ```
   */
  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;
    this.initializeToolHandlers();
    this.initializeTools();
  }

  private initializeToolHandlers(): void {
    this.toolHandlers = new Map([
      ['create_game', this.executeCreateGame.bind(this)],
      ['get_game_status', this.executeGetGameStatus.bind(this)],
      ['make_move', this.executeMakeMove.bind(this)],
      ['list_games', this.executeListGames.bind(this)],
      ['resign_game', this.executeResignGame.bind(this)],
      ['offer_draw', this.executeOfferDraw.bind(this)],
      ['accept_draw', this.executeAcceptDraw.bind(this)],
      ['decline_draw', this.executeDeclineDraw.bind(this)],
      ['get_legal_moves', this.executeGetLegalMoves.bind(this)],
      ['get_board_state', this.executeGetBoardState.bind(this)],
      ['validate_move', this.executeValidateMove.bind(this)],
      ['get_move_history', this.executeGetMoveHistory.bind(this)],
      ['export_game', this.executeExportGame.bind(this)],
      ['import_game', this.executeImportGame.bind(this)],
      ['pause_game', this.executePauseGame.bind(this)],
      ['resume_game', this.executeResumeGame.bind(this)],
    ]);
  }

  private initializeTools(): void {
    this.tools = [
      {
        name: 'create_game',
        description: 'Create a new chess game between two players',
        inputSchema: {
          type: 'object',
          properties: {
            whitePlayerId: {
              type: 'string',
              description: 'ID of the white player',
            },
            blackPlayerId: {
              type: 'string',
              description: 'ID of the black player',
            },
          },
          required: ['whitePlayerId', 'blackPlayerId'],
        },
      },
      {
        name: 'get_game_status',
        description: 'Get the current status of a chess game',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the game to get status for',
            },
          },
          required: ['gameId'],
        },
      },
      {
        name: 'make_move',
        description: 'Make a move in a chess game',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the game to make move in',
            },
            move: {
              type: 'string',
              description: 'Chess move in algebraic notation (e.g., e2e4)',
            },
            playerId: {
              type: 'string',
              description: 'ID of the player making the move',
            },
          },
          required: ['gameId', 'move', 'playerId'],
        },
      },
      {
        name: 'list_games',
        description: 'List games with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by game status (active, completed, paused)',
            },
            playerId: {
              type: 'string',
              description: 'Filter by player ID',
            },
          },
          required: [],
        },
      },
      {
        name: 'resign_game',
        description: 'Resign from a chess game',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the game to resign from',
            },
            playerId: {
              type: 'string',
              description: 'ID of the player resigning',
            },
          },
          required: ['gameId', 'playerId'],
        },
      },
      {
        name: 'offer_draw',
        description: 'Offer a draw in a chess game',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the game to offer draw in',
            },
            playerId: {
              type: 'string',
              description: 'ID of the player offering draw',
            },
          },
          required: ['gameId', 'playerId'],
        },
      },
      {
        name: 'accept_draw',
        description: 'Accept a draw offer in a chess game',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the game to accept draw in',
            },
            playerId: {
              type: 'string',
              description: 'ID of the player accepting the draw',
            },
          },
          required: ['gameId', 'playerId'],
        },
      },
      {
        name: 'decline_draw',
        description: 'Decline a draw offer in a chess game',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the game to decline draw in',
            },
            playerId: {
              type: 'string',
              description: 'ID of the player declining the draw',
            },
          },
          required: ['gameId', 'playerId'],
        },
      },
      {
        name: 'get_legal_moves',
        description: 'Get legal moves for the current position in a chess game',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the chess game',
            },
            square: {
              type: 'string',
              description:
                'Optional: specific square to get moves from (e.g., "e2")',
            },
          },
          required: ['gameId'],
        },
      },
      {
        name: 'get_board_state',
        description: 'Get the current board state in various formats',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the chess game',
            },
            format: {
              type: 'string',
              description:
                'Format for board representation: "visual", "FEN", "PGN"',
              enum: ['visual', 'FEN', 'PGN'],
            },
          },
          required: ['gameId'],
        },
      },
      {
        name: 'validate_move',
        description: 'Validate a chess move without executing it',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the chess game',
            },
            move: {
              type: 'string',
              description: 'Chess move in algebraic notation (e.g., e2e4)',
            },
          },
          required: ['gameId', 'move'],
        },
      },
      {
        name: 'get_move_history',
        description: 'Get the move history of a chess game',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the chess game',
            },
            format: {
              type: 'string',
              description:
                'Format for move history: "algebraic", "UCI", "verbose", "with_fen", "detailed"',
              enum: ['algebraic', 'UCI', 'verbose', 'with_fen', 'detailed'],
            },
          },
          required: ['gameId'],
        },
      },
      {
        name: 'export_game',
        description: 'Export a chess game in PGN or FEN format',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the chess game',
            },
            format: {
              type: 'string',
              description: 'Format for export: "PGN" or "FEN"',
              enum: ['PGN', 'FEN'],
            },
          },
          required: ['gameId'],
        },
      },
      {
        name: 'import_game',
        description: 'Import a chess game from PGN format',
        inputSchema: {
          type: 'object',
          properties: {
            pgn: {
              type: 'string',
              description: 'PGN string to import',
            },
            metadata: {
              type: 'object',
              description: 'Optional metadata for the game',
            },
          },
          required: ['pgn'],
        },
      },
      {
        name: 'pause_game',
        description: 'Pause an active chess game',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the game to pause',
            },
            playerId: {
              type: 'string',
              description: 'ID of the player requesting the pause',
            },
          },
          required: ['gameId', 'playerId'],
        },
      },
      {
        name: 'resume_game',
        description: 'Resume a paused chess game',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'ID of the game to resume',
            },
          },
          required: ['gameId'],
        },
      },
    ];
  }

  /**
   * Returns server information including name, version, and description.
   *
   * @returns Object containing server metadata
   *
   * @example
   * ```typescript
   * const server = new ChessMCPServer(gameManager);
   * const info = server.getServerInfo();
   * console.log(`${info.name} v${info.version}`);
   * ```
   */
  getServerInfo(): MCPServerInfo {
    return {
      name: this.name,
      version: this.version,
      description: 'MCP server for chess game management and interaction',
    };
  }

  /**
   * Returns an array of all registered MCP tools.
   *
   * @returns Array of MCPTool objects with their schemas and descriptions
   *
   * @example
   * ```typescript
   * const server = new ChessMCPServer(gameManager);
   * const tools = server.getRegisteredTools();
   * console.log(`Available tools: ${tools.map(t => t.name).join(', ')}`);
   * ```
   */
  getRegisteredTools(): MCPTool[] {
    return [...this.tools];
  }

  getTools(): MCPTool[] {
    return [...this.tools];
  }

  /**
   * Executes a named MCP tool with the provided parameters.
   *
   * @param toolName - Name of the tool to execute (e.g., 'create_game', 'make_move')
   * @param parameters - Object containing tool parameters as defined in tool schema
   * @returns Promise resolving to execution result with success status and data/error
   *
   * @example
   * ```typescript
   * const server = new ChessMCPServer(gameManager);
   *
   * // Create a new game
   * const result = await server.executeTool('create_game', {
   *   whitePlayerId: 'alice',
   *   blackPlayerId: 'bob'
   * });
   *
   * if (result.success) {
   *   console.log('Game created:', result.data);
   * } else {
   *   console.error('Error:', result.error);
   * }
   * ```
   */
  async executeTool(
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
    }

    // Validate required parameters
    for (const required of tool.inputSchema.required) {
      if (!(required in parameters)) {
        return {
          success: false,
          error: `Missing required parameter: ${required}`,
        };
      }
    }

    // Validate parameter types
    for (const [key, value] of Object.entries(parameters)) {
      const property = tool.inputSchema.properties[key];
      if (property && typeof property === 'object' && 'type' in property) {
        const expectedType = property.type;
        const actualType = typeof value;
        if (expectedType === 'string' && actualType !== 'string') {
          return {
            success: false,
            error: `Invalid parameter type for ${key}: expected string, got ${actualType}`,
          };
        }
      }
    }

    try {
      const handler = this.toolHandlers.get(toolName);
      if (handler) {
        return await handler(parameters);
      }

      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeCreateGame(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const { whitePlayerId, blackPlayerId } = parameters;

    const game = await this.gameManager.createGame(
      whitePlayerId as string,
      blackPlayerId as string
    );

    return {
      success: true,
      data: {
        gameId: game.id,
        status: game.status,
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId,
        currentTurn: game.currentTurn,
        moveHistory: game.moveHistory,
        fen: game.fen,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      },
    };
  }

  private async executeGetGameStatus(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const { gameId } = parameters;

    const game = await this.gameManager.getGame(gameId as string);
    if (!game) {
      return {
        success: false,
        error: `Game not found: ${String(gameId)}`,
      };
    }

    return {
      success: true,
      data: {
        gameId: game.id,
        status: game.status,
        currentTurn: game.currentTurn,
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId,
        moveHistory: game.moveHistory,
        result: game.result,
        fen: game.fen,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        drawOfferFrom: game.drawOfferFrom,
      },
    };
  }

  private async executeMakeMove(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const { gameId, move, playerId } = parameters;

    const game = await this.gameManager.getGame(gameId as string);
    if (!game) {
      return {
        success: false,
        error: `Game not found: ${String(gameId)}`,
      };
    }

    // Validate that the player is part of this game
    if (playerId !== game.whitePlayerId && playerId !== game.blackPlayerId) {
      return {
        success: false,
        error: 'You are not a player in this game',
      };
    }

    // Validate that it's the player's turn
    const isWhiteTurn = game.currentTurn === PLAYER_COLOR.WHITE;
    const isPlayerWhite = playerId === game.whitePlayerId;

    if (isWhiteTurn !== isPlayerWhite) {
      return {
        success: false,
        error: 'It is not your turn',
      };
    }

    try {
      await this.gameManager.makeMove(gameId as string, move as string);

      // Get updated game state
      const updatedGame = await this.gameManager.getGame(gameId as string);

      return {
        success: true,
        data: {
          gameId: updatedGame!.id,
          move: move,
          currentTurn: updatedGame!.currentTurn,
          status: updatedGame!.status,
          moveHistory: updatedGame!.moveHistory,
        },
      };
    } catch (error) {
      // Provide detailed error feedback using validateMove
      try {
        const validation = await this.gameManager.validateMove(
          gameId as string,
          move as string
        );

        if (!validation.valid) {
          return {
            success: false,
            error: validation.reason || 'Invalid move',
            data: {
              suggestion: validation.suggestion,
              move: move as string,
              gameId: gameId as string,
            },
          };
        }
      } catch {
        // If validation fails, fall back to basic error
      }

      return {
        success: false,
        error: `Invalid move: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private async executeListGames(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const { status, playerId } = parameters;

    let games;
    if (status && playerId) {
      // Filter by both status and player
      const allPlayerGames = await this.gameManager.getPlayerGames(
        playerId as string
      );
      games = allPlayerGames.filter(game => game.status === status);
    } else if (status) {
      // Filter by status only
      if (status === GAME_STATUS.ACTIVE) {
        games = await this.gameManager.getActiveGames();
      } else if (status === GAME_STATUS.COMPLETED) {
        games = await this.gameManager.getCompletedGames();
      } else {
        games = await this.gameManager.getAllGames();
        games = games.filter(game => game.status === status);
      }
    } else if (playerId) {
      // Filter by player only
      games = await this.gameManager.getPlayerGames(playerId as string);
    } else {
      // No filter, return all games
      games = await this.gameManager.getAllGames();
    }

    return {
      success: true,
      data: {
        games: games.map(game => ({
          gameId: game.id,
          status: game.status,
          whitePlayerId: game.whitePlayerId,
          blackPlayerId: game.blackPlayerId,
          currentTurn: game.currentTurn,
          result: game.result,
          moveHistory: game.moveHistory,
          fen: game.fen,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
          drawOfferFrom: game.drawOfferFrom,
        })),
      },
    };
  }

  private async executeResignGame(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const { gameId, playerId } = parameters;

    try {
      await this.gameManager.resignGame(gameId as string, playerId as string);

      // Get updated game state
      const updatedGame = await this.gameManager.getGame(gameId as string);

      return {
        success: true,
        data: {
          gameId: updatedGame!.id,
          status: updatedGame!.status,
          result: updatedGame!.result,
          resignedBy: playerId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeOfferDraw(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const { gameId, playerId } = parameters;

    try {
      await this.gameManager.offerDraw(gameId as string, playerId as string);

      // Get updated game state
      const updatedGame = await this.gameManager.getGame(gameId as string);

      return {
        success: true,
        data: {
          gameId: updatedGame!.id,
          status: updatedGame!.status,
          drawOfferFrom: updatedGame!.drawOfferFrom,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeAcceptDraw(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const { gameId, playerId } = parameters;

    try {
      await this.gameManager.acceptDraw(gameId as string, playerId as string);

      // Get updated game state
      const updatedGame = await this.gameManager.getGame(gameId as string);

      return {
        success: true,
        data: {
          gameId: updatedGame!.id,
          status: updatedGame!.status,
          result: updatedGame!.result,
          acceptedBy: playerId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeDeclineDraw(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const { gameId, playerId } = parameters;

    try {
      await this.gameManager.declineDraw(gameId as string, playerId as string);

      // Get updated game state
      const updatedGame = await this.gameManager.getGame(gameId as string);

      return {
        success: true,
        data: {
          gameId: updatedGame!.id,
          status: updatedGame!.status,
          drawOfferFrom: updatedGame!.drawOfferFrom,
          declinedBy: playerId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeGetBoardState(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const { gameId, format = 'visual' } = parameters;

    const game = await this.gameManager.getGame(gameId as string);
    if (!game) {
      return {
        success: false,
        error: `Game not found: ${String(gameId)}`,
      };
    }

    try {
      switch (format) {
        case 'visual':
          return {
            success: true,
            data: {
              gameId: game.id,
              board: game.getAsciiBoard(),
              turn: game.currentTurn,
              moveNumber: Math.floor(game.moveHistory.length / 2) + 1,
              status: game.status,
            },
          };
        case 'FEN':
          return {
            success: true,
            data: {
              gameId: game.id,
              fen: game.fen,
            },
          };
        case 'PGN':
          return {
            success: true,
            data: {
              gameId: game.id,
              pgn: game.pgn,
            },
          };
        default:
          return {
            success: false,
            error: `Unsupported format: ${String(format)}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeGetLegalMoves(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const { gameId, square } = parameters;

    const game = await this.gameManager.getGame(gameId as string);
    if (!game) {
      return {
        success: false,
        error: 'Game not found',
      };
    }

    try {
      let legalMoves: string[];
      if (square && typeof square === 'string') {
        // Get legal moves from specific square
        legalMoves = game.getLegalMovesFrom(square);
        return {
          success: true,
          data: {
            gameId: game.id,
            square,
            legalMoves,
          },
        };
      } else {
        // Get all legal moves for current position
        legalMoves = game.getLegalMoves();
        return {
          success: true,
          data: {
            gameId: game.id,
            legalMoves,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeValidateMove(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const { gameId, move } = parameters;

    try {
      const validation = await this.gameManager.validateMove(
        gameId as string,
        move as string
      );

      return {
        success: true,
        data: {
          gameId: gameId as string,
          move: move as string,
          valid: validation.valid,
          reason: validation.reason,
          suggestion: validation.suggestion,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeGetMoveHistory(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    try {
      const gameId = parameters['gameId'] as string;
      const format = (parameters['format'] as string) || 'algebraic';

      const moveHistory = await this.gameManager.getMoveHistory(
        gameId,
        format as 'algebraic' | 'UCI' | 'verbose' | 'with_fen' | 'detailed'
      );

      return {
        success: true,
        data: {
          gameId,
          moveHistory,
          format,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeExportGame(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    try {
      const gameId = parameters['gameId'] as string;
      const format = (parameters['format'] as 'PGN' | 'FEN') || 'PGN';

      const exportData = await this.gameManager.exportGame(gameId, format);

      return {
        success: true,
        data: exportData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeImportGame(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    try {
      const pgn = parameters['pgn'] as string;
      const metadata = parameters['metadata'] as
        | Record<string, unknown>
        | undefined;

      // Validate required parameters
      if (!pgn) {
        return {
          success: false,
          error: 'pgn parameter is required',
        };
      }

      if (pgn.trim() === '') {
        return {
          success: false,
          error: 'PGN cannot be empty',
        };
      }

      // Import the game
      const importResult = await this.gameManager.importGame(pgn, metadata);

      return {
        success: true,
        data: importResult,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Handle specific error cases
      if (
        errorMessage.includes('invalid move') ||
        errorMessage.includes('Invalid move')
      ) {
        return {
          success: false,
          error: 'Invalid move in PGN',
        };
      }

      if (
        errorMessage.includes('invalid pgn') ||
        errorMessage.includes('Invalid PGN')
      ) {
        return {
          success: false,
          error: 'Invalid PGN format',
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async executePauseGame(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    try {
      const gameId = parameters['gameId'] as string;
      const playerId = parameters['playerId'] as string;

      await this.gameManager.pauseGame(gameId, playerId);

      // Get updated game state
      const updatedGame = await this.gameManager.getGame(gameId);

      return {
        success: true,
        data: {
          gameId: updatedGame!.id,
          status: updatedGame!.status,
          pausedBy: playerId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeResumeGame(
    parameters: Record<string, unknown>
  ): Promise<MCPToolResult> {
    try {
      const gameId = parameters['gameId'] as string;

      await this.gameManager.resumeGame(gameId);

      // Get updated game state
      const updatedGame = await this.gameManager.getGame(gameId);

      return {
        success: true,
        data: {
          gameId: updatedGame!.id,
          status: updatedGame!.status,
          resumedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Closes the MCP server and cleans up resources.
   *
   * @returns Promise that resolves when cleanup is complete
   *
   * @example
   * ```typescript
   * const server = new ChessMCPServer(gameManager);
   *
   * // Use server...
   *
   * // Clean shutdown
   * await server.close();
   * ```
   */
  async close(): Promise<void> {
    await this.gameManager.close();
  }
}
