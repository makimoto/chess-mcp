import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ChessMCPServer } from '../../../src/mcp/ChessMCPServer.js';
import { GameManager } from '../../../src/core/game/GameManager.js';
import { InMemoryAdapter } from '../../../src/core/storage/InMemoryAdapter.js';

// Type definitions for test data
interface CreateGameResponse {
  gameId: string;
  status: string;
  whitePlayerId: string;
  blackPlayerId: string;
  currentTurn: string;
}

interface ListGamesResponse {
  games: Array<{
    gameId: string;
    status: string;
    whitePlayerId: string;
    blackPlayerId: string;
    currentTurn: string;
    result?: string;
    createdAt: Date;
    updatedAt: Date;
    drawOfferFrom?: string;
  }>;
}

interface MoveHistoryResponse {
  gameId: string;
  moveHistory:
    | string[]
    | Array<{
        moveNumber: number;
        player: string;
        move: string;
        timestamp?: Date;
      }>
    | Array<{
        moveNumber: number;
        move: string;
        fen: string;
      }>
    | Array<{
        moveNumber: number;
        move: string;
        fen: string;
        check: boolean;
        capture: boolean;
        castling: boolean;
      }>;
  format: string;
}

interface LegalMovesResponse {
  gameId: string;
  square?: string;
  legalMoves: string[];
}

interface BoardStateResponse {
  gameId: string;
  board?: string;
  fen?: string;
  turn?: string;
  moveNumber?: number;
}

describe('ChessMCPServer', () => {
  let server: ChessMCPServer;
  let gameManager: GameManager;

  beforeEach(() => {
    const storage = new InMemoryAdapter();
    gameManager = new GameManager(storage);
    server = new ChessMCPServer(gameManager);
  });

  afterEach(async () => {
    await server.close();
  });

  describe('server initialization', () => {
    it('should create server with game manager', () => {
      expect(server).toBeDefined();
      expect(server.name).toBe('chess-mcp-server');
      expect(server.version).toBe('0.1.0');
    });

    it('should have proper server info', () => {
      const info = server.getServerInfo();
      expect(info.name).toBe('chess-mcp-server');
      expect(info.version).toBe('0.1.0');
      expect(info.description).toContain('chess game management');
    });
  });

  describe('tool registration', () => {
    it('should register create_game tool', () => {
      const tools = server.getRegisteredTools();
      const createGameTool = tools.find(tool => tool.name === 'create_game');

      expect(createGameTool).toBeDefined();
      expect(createGameTool!.description).toContain('Create a new chess game');
      expect(createGameTool!.inputSchema.properties).toHaveProperty(
        'whitePlayerId'
      );
      expect(createGameTool!.inputSchema.properties).toHaveProperty(
        'blackPlayerId'
      );
    });

    it('should register get_game_status tool', () => {
      const tools = server.getRegisteredTools();
      const statusTool = tools.find(tool => tool.name === 'get_game_status');

      expect(statusTool).toBeDefined();
      expect(statusTool!.description).toContain(
        'Get the current status of a chess game'
      );
      expect(statusTool!.inputSchema.properties).toHaveProperty('gameId');
    });

    it('should register make_move tool', () => {
      const tools = server.getRegisteredTools();
      const moveTool = tools.find(tool => tool.name === 'make_move');

      expect(moveTool).toBeDefined();
      expect(moveTool!.description).toContain('Make a move in a chess game');
      expect(moveTool!.inputSchema.properties).toHaveProperty('gameId');
      expect(moveTool!.inputSchema.properties).toHaveProperty('move');
    });

    it('should register list_games tool', () => {
      const tools = server.getRegisteredTools();
      const listTool = tools.find(tool => tool.name === 'list_games');

      expect(listTool).toBeDefined();
      expect(listTool!.description).toContain('List games');
      expect(listTool!.inputSchema.properties).toHaveProperty('status');
      expect(listTool!.inputSchema.properties).toHaveProperty('playerId');
    });

    it('should register resign_game tool', () => {
      const tools = server.getRegisteredTools();
      const resignTool = tools.find(tool => tool.name === 'resign_game');

      expect(resignTool).toBeDefined();
      expect(resignTool!.description).toContain('Resign from a chess game');
      expect(resignTool!.inputSchema.properties).toHaveProperty('gameId');
      expect(resignTool!.inputSchema.properties).toHaveProperty('playerId');
    });

    it('should register offer_draw tool', () => {
      const tools = server.getRegisteredTools();
      const drawTool = tools.find(tool => tool.name === 'offer_draw');

      expect(drawTool).toBeDefined();
      expect(drawTool!.description).toContain('Offer a draw');
      expect(drawTool!.inputSchema.properties).toHaveProperty('gameId');
      expect(drawTool!.inputSchema.properties).toHaveProperty('playerId');
    });

    it('should register accept_draw tool', () => {
      const tools = server.getRegisteredTools();
      const acceptTool = tools.find(tool => tool.name === 'accept_draw');

      expect(acceptTool).toBeDefined();
      expect(acceptTool!.description).toContain('Accept a draw offer');
      expect(acceptTool!.inputSchema.properties).toHaveProperty('gameId');
      expect(acceptTool!.inputSchema.properties).toHaveProperty('playerId');
    });

    it('should register decline_draw tool', () => {
      const tools = server.getRegisteredTools();
      const declineTool = tools.find(tool => tool.name === 'decline_draw');

      expect(declineTool).toBeDefined();
      expect(declineTool!.description).toContain('Decline a draw offer');
      expect(declineTool!.inputSchema.properties).toHaveProperty('gameId');
      expect(declineTool!.inputSchema.properties).toHaveProperty('playerId');
    });

    it('should register get_legal_moves tool', () => {
      const tools = server.getRegisteredTools();
      const legalMovesTool = tools.find(
        tool => tool.name === 'get_legal_moves'
      );

      expect(legalMovesTool).toBeDefined();
      expect(legalMovesTool!.description).toContain(
        'Get legal moves for the current position'
      );
      expect(legalMovesTool!.inputSchema.properties).toHaveProperty('gameId');
      expect(legalMovesTool!.inputSchema.properties).toHaveProperty('square');
    });

    it('should register get_move_history tool', () => {
      const tools = server.getRegisteredTools();
      const moveHistoryTool = tools.find(
        tool => tool.name === 'get_move_history'
      );

      expect(moveHistoryTool).toBeDefined();
      expect(moveHistoryTool!.description).toContain(
        'Get the move history of a chess game'
      );
      expect(moveHistoryTool!.inputSchema.properties).toHaveProperty('gameId');
      expect(moveHistoryTool!.inputSchema.properties).toHaveProperty('format');
    });
  });

  describe('tool execution', () => {
    it('should execute create_game tool successfully', async () => {
      const result = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId');
      expect(result.data).toHaveProperty('status', 'active');
      expect(result.data).toHaveProperty('whitePlayerId', 'player1');
      expect(result.data).toHaveProperty('blackPlayerId', 'player2');
    });

    it('should execute get_game_status tool successfully', async () => {
      // First create a game
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Then get its status
      const statusResult = await server.executeTool('get_game_status', {
        gameId,
      });

      expect(statusResult.success).toBe(true);
      expect(statusResult.data).toHaveProperty('gameId', gameId);
      expect(statusResult.data).toHaveProperty('status', 'active');
      expect(statusResult.data).toHaveProperty('currentTurn', 'white');
    });

    it('should handle non-existent game in get_game_status', async () => {
      const result = await server.executeTool('get_game_status', {
        gameId: 'non-existent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not found');
    });

    it('should execute make_move tool successfully', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Make a move as white player (whose turn it is)
      const moveResult = await server.executeTool('make_move', {
        gameId,
        move: 'e2e4',
        playerId: 'player1', // White player making the first move
      });

      expect(moveResult.success).toBe(true);
      expect(moveResult.data).toHaveProperty('gameId', gameId);
      expect(moveResult.data).toHaveProperty('move', 'e2e4');
      expect(moveResult.data).toHaveProperty('currentTurn', 'black');
    });

    it('should handle invalid move in make_move tool', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Try invalid move
      const moveResult = await server.executeTool('make_move', {
        gameId,
        move: 'invalid',
        playerId: 'player1',
      });

      expect(moveResult.success).toBe(false);
      expect(moveResult.error).toContain('Invalid move');
    });

    it('should provide detailed error feedback for invalid moves', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Try illegal move (pawn can't move 3 squares forward)
      const moveResult = await server.executeTool('make_move', {
        gameId,
        move: 'e2e5',
        playerId: 'player1',
      });

      expect(moveResult.success).toBe(false);
      // Chess.js treats e2e5 as invalid notation and throws error
      expect(moveResult.error).toContain('Invalid notation');
      expect(moveResult.error).toContain('Invalid move: e2e5');
      // Should include suggestion data
      expect(moveResult.data).toBeDefined();
      expect(moveResult.data).toHaveProperty('suggestion');
      expect(moveResult.data).toHaveProperty('move', 'e2e5');
      expect(moveResult.data).toHaveProperty('gameId', gameId);
    });

    it('should reject move from wrong player', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Try to make move as black player when it's white's turn
      const moveResult = await server.executeTool('make_move', {
        gameId,
        move: 'e2e4',
        playerId: 'player2', // Black player trying to move when it's white's turn
      });

      expect(moveResult.success).toBe(false);
      expect(moveResult.error).toContain('It is not your turn');
    });

    it('should reject move from non-player', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Try to make move as someone not in the game
      const moveResult = await server.executeTool('make_move', {
        gameId,
        move: 'e2e4',
        playerId: 'outsider', // Not a player in this game
      });

      expect(moveResult.success).toBe(false);
      expect(moveResult.error).toContain('You are not a player in this game');
    });

    it('should handle unknown tool execution', async () => {
      const result = await server.executeTool('unknown_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });

    it('should execute list_games tool successfully', async () => {
      // Create some test games
      await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      await server.executeTool('create_game', {
        whitePlayerId: 'player3',
        blackPlayerId: 'player4',
      });

      // List all games
      const result = await server.executeTool('list_games', {});

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const listData = result.data as ListGamesResponse;
      expect(Array.isArray(listData.games)).toBe(true);
      expect(listData.games).toHaveLength(2);
    });

    it('should execute list_games with status filter', async () => {
      // Create a game and complete it
      const game1 = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      expect(game1.success).toBe(true);
      expect(game1.data).toBeDefined();
      const gameData = game1.data as CreateGameResponse;
      await server.executeTool('resign_game', {
        gameId: gameData.gameId,
        playerId: 'player1',
      });

      // Create another active game
      await server.executeTool('create_game', {
        whitePlayerId: 'player3',
        blackPlayerId: 'player4',
      });

      // List only active games
      const result = await server.executeTool('list_games', {
        status: 'active',
      });

      expect(result.success).toBe(true);
      const listResult = result.data as ListGamesResponse;
      expect(listResult.games).toHaveLength(1);
      expect(listResult.games[0]).toHaveProperty('status', 'active');
    });

    it('should execute resign_game tool successfully', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Resign the game
      const resignResult = await server.executeTool('resign_game', {
        gameId,
        playerId: 'player1',
      });

      expect(resignResult.success).toBe(true);
      expect(resignResult.data).toHaveProperty('gameId', gameId);
      expect(resignResult.data).toHaveProperty('result', '0-1');
      expect(resignResult.data).toHaveProperty('status', 'completed');
    });

    it('should execute offer_draw tool successfully', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Offer a draw
      const drawResult = await server.executeTool('offer_draw', {
        gameId,
        playerId: 'player1',
      });

      expect(drawResult.success).toBe(true);
      expect(drawResult.data).toHaveProperty('gameId', gameId);
      expect(drawResult.data).toHaveProperty('drawOfferFrom', 'player1');
      expect(drawResult.data).toHaveProperty('status', 'active');
    });

    it('should execute accept_draw tool successfully', async () => {
      // Create a game and offer draw
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      await server.executeTool('offer_draw', {
        gameId,
        playerId: 'player1',
      });

      // Accept the draw as the other player
      const acceptResult = await server.executeTool('accept_draw', {
        gameId,
        playerId: 'player2',
      });

      expect(acceptResult.success).toBe(true);
      expect(acceptResult.data).toHaveProperty('gameId', gameId);
      expect(acceptResult.data).toHaveProperty('status', 'completed');
      expect(acceptResult.data).toHaveProperty('result', '1/2-1/2');
    });

    it('should execute decline_draw tool successfully', async () => {
      // Create a game and offer draw
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      await server.executeTool('offer_draw', {
        gameId,
        playerId: 'player1',
      });

      // Decline the draw
      const declineResult = await server.executeTool('decline_draw', {
        gameId,
        playerId: 'player2',
      });

      expect(declineResult.success).toBe(true);
      expect(declineResult.data).toHaveProperty('gameId', gameId);
      expect(declineResult.data).toHaveProperty('status', 'active');
      expect(declineResult.data).toHaveProperty('drawOfferFrom', undefined);
    });
  });

  describe('error handling', () => {
    it('should handle missing required parameters', async () => {
      const result = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        // missing blackPlayerId
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameter');
    });

    it('should handle invalid parameter types', async () => {
      const result = await server.executeTool('create_game', {
        whitePlayerId: 123, // should be string
        blackPlayerId: 'player2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid parameter type');
    });

    it('should handle resign_game for non-existent game', async () => {
      const result = await server.executeTool('resign_game', {
        gameId: 'non-existent',
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not found');
    });

    it('should handle resign_game from non-player', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Try to resign from someone not in the game
      const result = await server.executeTool('resign_game', {
        gameId,
        playerId: 'player3',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Player not in this game');
    });

    it('should handle offer_draw for non-existent game', async () => {
      const result = await server.executeTool('offer_draw', {
        gameId: 'non-existent',
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not found');
    });

    it('should handle accept_draw when no draw offer exists', async () => {
      // Create a game without draw offer
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Try to accept non-existent draw offer
      const result = await server.executeTool('accept_draw', {
        gameId,
        playerId: 'player2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No draw offer to accept');
    });

    it('should handle accept_draw from wrong player', async () => {
      // Create a game and offer draw
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      await server.executeTool('offer_draw', {
        gameId,
        playerId: 'player1',
      });

      // Try to accept draw as the player who offered (should fail)
      const result = await server.executeTool('accept_draw', {
        gameId,
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot accept your own draw offer');
    });

    it('should handle decline_draw when no draw offer exists', async () => {
      // Create a game without draw offer
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Try to decline non-existent draw offer
      const result = await server.executeTool('decline_draw', {
        gameId,
        playerId: 'player2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No draw offer to decline');
    });

    it('should execute get_legal_moves tool successfully', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Get all legal moves for starting position
      const result = await server.executeTool('get_legal_moves', {
        gameId,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('legalMoves');
      expect((result.data as LegalMovesResponse).legalMoves).toBeInstanceOf(
        Array
      );
      expect((result.data as LegalMovesResponse).legalMoves.length).toBe(20); // Starting position has 20 legal moves
    });

    it('should execute get_legal_moves for specific square', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Get legal moves from e2 square (pawn)
      const result = await server.executeTool('get_legal_moves', {
        gameId,
        square: 'e2',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('square', 'e2');
      expect(result.data).toHaveProperty('legalMoves');
      expect((result.data as LegalMovesResponse).legalMoves).toEqual([
        'e3',
        'e4',
      ]); // e2 pawn can move to e3 or e4
    });

    it('should handle get_legal_moves for invalid game', async () => {
      const result = await server.executeTool('get_legal_moves', {
        gameId: 'non-existent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not found');
    });

    it('should handle get_legal_moves for invalid square', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Try to get moves from invalid square
      const result = await server.executeTool('get_legal_moves', {
        gameId,
        square: 'z9', // Invalid square
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('square', 'z9');
      expect(result.data).toHaveProperty('legalMoves');
      expect((result.data as LegalMovesResponse).legalMoves).toEqual([]); // No legal moves from invalid square
    });
  });

  describe('get_board_state', () => {
    it('should register get_board_state tool', () => {
      const tools = server.getRegisteredTools();
      console.log(
        'All registered tools:',
        tools.map(t => t.name)
      );
      const boardStateTool = tools.find(
        tool => tool.name === 'get_board_state'
      );

      expect(boardStateTool).toBeDefined();
      expect(boardStateTool!.description).toContain('board state');
      expect(boardStateTool!.inputSchema.properties).toHaveProperty('gameId');
      expect(boardStateTool!.inputSchema.properties).toHaveProperty('format');
    });

    it('should execute get_board_state tool with visual format', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Make a move to change position
      await server.executeTool('make_move', {
        gameId,
        move: 'e2e4',
        playerId: 'player1',
      });

      // Get board state in visual format
      const result = await server.executeTool('get_board_state', {
        gameId,
        format: 'visual',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('board');
      expect(result.data).toHaveProperty('turn');
      expect(result.data).toHaveProperty('moveNumber');

      // Check ASCII board format
      const board = (result.data as BoardStateResponse).board;
      expect(typeof board).toBe('string');
      expect(board).toContain('8'); // Rank numbers
      expect(board).toContain('a'); // File letters
      expect(board).toContain('r'); // Black rook
      expect(board).toContain('K'); // White king
    });

    it('should reflect board state changes after moves', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Get initial board state
      const initialResult = await server.executeTool('get_board_state', {
        gameId,
        format: 'visual',
      });
      const initialBoard = (initialResult.data as BoardStateResponse).board;

      // Make the sequence of moves from bug report
      await server.executeTool('make_move', {
        gameId,
        move: 'e2e4',
        playerId: 'player1',
      });

      await server.executeTool('make_move', {
        gameId,
        move: 'c7c5',
        playerId: 'player2',
      });

      // Get board state after moves
      const afterMovesResult = await server.executeTool('get_board_state', {
        gameId,
        format: 'visual',
      });
      const afterMovesBoard = (afterMovesResult.data as BoardStateResponse)
        .board;

      // Board should have changed - should NOT be the same as initial
      expect(afterMovesBoard).not.toBe(initialBoard);

      // Specific checks: e2 should be empty (no pawn), e4 should have white pawn
      // c7 should be empty (no pawn), c5 should have black pawn
      console.log('Initial board:');
      console.log(initialBoard);
      console.log('Board after e2e4, c7c5:');
      console.log(afterMovesBoard);
    });

    it('should execute get_board_state tool with FEN format', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Get board state in FEN format
      const result = await server.executeTool('get_board_state', {
        gameId,
        format: 'FEN',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('fen');

      // Check FEN format
      const fen = (result.data as BoardStateResponse).fen;
      expect(typeof fen).toBe('string');
      expect(fen).toContain('rnbqkbnr/pppppppp'); // Starting position
    });

    it('should handle get_board_state for invalid game', async () => {
      const result = await server.executeTool('get_board_state', {
        gameId: 'non-existent',
        format: 'visual',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not found');
    });
  });

  describe('validate_move', () => {
    it('should register validate_move tool', () => {
      const tools = server.getRegisteredTools();
      const validateMoveTool = tools.find(
        tool => tool.name === 'validate_move'
      );

      expect(validateMoveTool).toBeDefined();
      expect(validateMoveTool!.description).toContain('Validate');
      expect(validateMoveTool!.inputSchema.properties).toHaveProperty('gameId');
      expect(validateMoveTool!.inputSchema.properties).toHaveProperty('move');
    });

    it('should validate a legal move', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Validate a legal opening move
      const result = await server.executeTool('validate_move', {
        gameId,
        move: 'e2e4',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('valid', true);
      expect(result.data).toHaveProperty('gameId', gameId);
    });

    it('should reject an invalid move with reason', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Try to validate an illegal move
      const result = await server.executeTool('validate_move', {
        gameId,
        move: 'e2e5',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('valid', false);
      expect(result.data).toHaveProperty('reason');
      expect(result.data).toHaveProperty('gameId', gameId);
    });

    it('should handle validate_move for invalid game', async () => {
      const result = await server.executeTool('validate_move', {
        gameId: 'nonexistent',
        move: 'e2e4',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not found');
    });
  });

  describe('get_move_history', () => {
    it('should execute get_move_history tool successfully', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Make some moves to create history
      await server.executeTool('make_move', {
        gameId,
        move: 'e2e4',
        playerId: 'player1',
      });
      await server.executeTool('make_move', {
        gameId,
        move: 'c7c5',
        playerId: 'player2',
      });

      // Get move history with default format
      const result = await server.executeTool('get_move_history', {
        gameId,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('moveHistory');
      expect(result.data).toHaveProperty('format', 'algebraic');

      const historyData = result.data as MoveHistoryResponse;
      const history = historyData.moveHistory as string[];
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(2);
      expect(history[0]).toContain('e4'); // First move should be e4 in algebraic notation
      expect(history[1]).toContain('c5'); // Second move should be c5 in algebraic notation
    });

    it('should execute get_move_history tool with UCI format', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Make a move
      await server.executeTool('make_move', {
        gameId,
        move: 'e2e4',
        playerId: 'player1',
      });

      // Get move history in UCI format
      const result = await server.executeTool('get_move_history', {
        gameId,
        format: 'UCI',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('format', 'UCI');

      const historyData = result.data as MoveHistoryResponse;
      const history = historyData.moveHistory as string[];
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(1);
      expect(history[0]).toBe('e2e4'); // UCI format should be exact coordinate notation
    });

    it('should execute get_move_history tool with verbose format', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Make a move
      await server.executeTool('make_move', {
        gameId,
        move: 'e2e4',
        playerId: 'player1',
      });

      // Get move history in verbose format
      const result = await server.executeTool('get_move_history', {
        gameId,
        format: 'verbose',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('format', 'verbose');

      const historyData = result.data as MoveHistoryResponse;
      const history = historyData.moveHistory as Array<{
        moveNumber: number;
        player: string;
        move: string;
        timestamp?: Date;
      }>;
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(1);
      expect(history[0]).toHaveProperty('moveNumber');
      expect(history[0]).toHaveProperty('player');
      expect(history[0]).toHaveProperty('move');
      expect(history[0]).toHaveProperty('timestamp');
    });

    it('should execute get_move_history tool with with_fen format', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Make some moves to create history
      await server.executeTool('make_move', {
        gameId,
        move: 'e2e4',
        playerId: 'player1',
      });
      await server.executeTool('make_move', {
        gameId,
        move: 'c7c5',
        playerId: 'player2',
      });

      // Get move history with FEN format
      const result = await server.executeTool('get_move_history', {
        gameId,
        format: 'with_fen',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('format', 'with_fen');

      const historyData = result.data as MoveHistoryResponse;
      const history = historyData.moveHistory as Array<{
        moveNumber: number;
        move: string;
        fen: string;
      }>;
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(2);

      // Check first move
      expect(history[0]).toHaveProperty('moveNumber', 1);
      expect(history[0]).toHaveProperty('move');
      expect(history[0]).toHaveProperty('fen');
      expect(history[0]?.move).toContain('e4');
      expect(history[0]?.fen).toMatch(
        /^[rnbqkbnrpRNBQKBNRP12345678/]+\s[wb]\s[KQkq-]+\s(?:[a-h][36]|-)?\s\d+\s\d+$/
      ); // FEN format validation

      // Check second move
      expect(history[1]).toHaveProperty('moveNumber', 2);
      expect(history[1]).toHaveProperty('move');
      expect(history[1]).toHaveProperty('fen');
      expect(history[1]?.move).toContain('c5');
      expect(history[1]?.fen).toMatch(
        /^[rnbqkbnrpRNBQKBNRP12345678/]+\s[wb]\s[KQkq-]+\s(?:[a-h][36]|-)?\s\d+\s\d+$/
      ); // FEN format validation
    });

    it('should execute get_move_history tool with detailed format', async () => {
      // Create a game first
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Make some moves including a capture and check
      await server.executeTool('make_move', {
        gameId,
        move: 'e2e4',
        playerId: 'player1',
      });
      await server.executeTool('make_move', {
        gameId,
        move: 'd7d5',
        playerId: 'player2',
      });
      await server.executeTool('make_move', {
        gameId,
        move: 'e4d5', // Capture
        playerId: 'player1',
      });

      // Get move history with detailed format
      const result = await server.executeTool('get_move_history', {
        gameId,
        format: 'detailed',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('format', 'detailed');

      const historyData = result.data as MoveHistoryResponse;
      const history = historyData.moveHistory as Array<{
        moveNumber: number;
        move: string;
        fen: string;
        check: boolean;
        capture: boolean;
        castling: boolean;
      }>;
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(3);

      // Check first move (e4)
      expect(history[0]).toHaveProperty('moveNumber', 1);
      expect(history[0]).toHaveProperty('move');
      expect(history[0]).toHaveProperty('fen');
      expect(history[0]).toHaveProperty('check', false);
      expect(history[0]).toHaveProperty('capture', false);
      expect(history[0]).toHaveProperty('castling', false);
      expect(history[0]?.move).toContain('e4');
      expect(history[0]?.fen).toMatch(
        /^[rnbqkbnrpRNBQKBNRP12345678/]+\s[wb]\s[KQkq-]+\s(?:[a-h][36]|-)?\s\d+\s\d+$/
      );

      // Check second move (d5)
      expect(history[1]).toHaveProperty('moveNumber', 2);
      expect(history[1]).toHaveProperty('capture', false);
      expect(history[1]?.move).toContain('d5');

      // Check third move (exd5 - capture)
      expect(history[2]).toHaveProperty('moveNumber', 3);
      expect(history[2]).toHaveProperty('capture', true);
      expect(history[2]?.move).toContain('d5');
    });

    it('should handle get_move_history for non-existent game', async () => {
      const result = await server.executeTool('get_move_history', {
        gameId: 'non-existent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not found');
    });

    it('should handle get_move_history for game with no moves', async () => {
      // Create a game without making moves
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Get move history
      const result = await server.executeTool('get_move_history', {
        gameId,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('moveHistory');

      const historyData = result.data as MoveHistoryResponse;
      const history = historyData.moveHistory as string[];
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });
  });
});
