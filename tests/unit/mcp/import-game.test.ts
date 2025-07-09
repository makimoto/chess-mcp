import { describe, it, expect, beforeEach } from '@jest/globals';
import { ChessMCPServer } from '../../../src/mcp/ChessMCPServer';
import { GameManager } from '../../../src/core/game/GameManager';
import { InMemoryAdapter } from '../../../src/core/storage/InMemoryAdapter';

interface ImportGameData {
  gameId: string;
  moves: string[];
  finalPosition: string;
  result: string;
  validation: {
    valid: boolean;
    warnings: string[];
  };
}

interface GameStatusData {
  gameId: string;
  status: string;
  result?: string;
  moveHistory: string[];
}

interface MoveHistoryData {
  gameId: string;
  moveHistory: string[];
}

describe('ChessMCPServer - import_game tool', () => {
  let server: ChessMCPServer;
  let gameManager: GameManager;

  beforeEach(() => {
    const storage = new InMemoryAdapter();
    gameManager = new GameManager(storage);
    server = new ChessMCPServer(gameManager);
  });

  describe('import_game tool registration', () => {
    it('should register import_game tool', () => {
      const tools = server.getTools();
      const importGameTool = tools.find(tool => tool.name === 'import_game');

      expect(importGameTool).toBeDefined();
      expect(importGameTool?.description).toContain(
        'Import a chess game from PGN format'
      );
    });
  });

  describe('import_game basic functionality', () => {
    it('should import a simple PGN game', async () => {
      const simplePGN = `[Event "Test Game"]
[Site "Test"]
[Date "2025.01.03"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 1-0`;

      const result = await server.executeTool('import_game', {
        pgn: simplePGN,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId');
      expect(result.data).toHaveProperty('moves');
      expect(result.data).toHaveProperty('result', '1-0');
      expect(result.data).toHaveProperty('finalPosition');
    });

    it('should import PGN with metadata', async () => {
      const pgnWithMetadata = `[Event "World Championship"]
[Site "London"]
[Date "2025.01.03"]
[Round "1"]
[White "Magnus Carlsen"]
[Black "Fabiano Caruana"]
[Result "*"]

1. e4 c5 2. Nf3 d6 *`;

      const result = await server.executeTool('import_game', {
        pgn: pgnWithMetadata,
        metadata: {
          event: 'World Championship',
          site: 'London',
          players: { white: 'Magnus Carlsen', black: 'Fabiano Caruana' },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId');
      expect(result.data).toHaveProperty('moves', 4); // 2 moves by each player
    });

    it('should handle incomplete games', async () => {
      const incompletePGN = `[Event "Casual Game"]
[Site "Online"]
[Date "2025.01.03"]
[Round "-"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. d4 Nf6 2. c4 g6 *`;

      const result = await server.executeTool('import_game', {
        pgn: incompletePGN,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('result', '*');
      expect(result.data).toHaveProperty('moves', 4);
    });
  });

  describe('import_game validation', () => {
    it('should validate PGN format', async () => {
      const result = await server.executeTool('import_game', {
        pgn: '   ',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('PGN cannot be empty');
    });

    it('should handle malformed PGN gracefully', async () => {
      const malformedPGN = 'This is not a valid PGN';

      const result = await server.executeTool('import_game', {
        pgn: malformedPGN,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PGN format');
    });

    it('should handle missing required parameters', async () => {
      const result = await server.executeTool('import_game', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameter: pgn');
    });

    it('should validate PGN with invalid moves', async () => {
      const invalidMovesPGN = `[Event "Test"]
[Site "Test"]
[Date "2025.01.03"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 InvalidMove 1-0`;

      const result = await server.executeTool('import_game', {
        pgn: invalidMovesPGN,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });

  describe('import_game response format', () => {
    it('should return detailed import information', async () => {
      const testPGN = `[Event "Test Game"]
[Site "Online"]
[Date "2025.01.03"]
[Round "1"]
[White "Alice"]
[Black "Bob"]
[Result "1/2-1/2"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 1/2-1/2`;

      const result = await server.executeTool('import_game', {
        pgn: testPGN,
      });

      expect(result.success).toBe(true);

      const importData = result.data as ImportGameData;
      expect(importData).toHaveProperty('gameId');
      expect(importData).toHaveProperty('moves');
      expect(importData).toHaveProperty('finalPosition');
      expect(importData).toHaveProperty('result');
      expect(importData).toHaveProperty('validation');

      expect(importData.validation.valid).toBe(true);
      expect(Array.isArray(importData.validation.warnings)).toBe(true);
    });
  });

  describe('import_game integration with game management', () => {
    it('should create a game that can be retrieved', async () => {
      const testPGN = `[Event "Integration Test"]
[Site "Test Suite"]
[Date "2025.01.03"]
[Round "1"]
[White "TestPlayer1"]
[Black "TestPlayer2"]
[Result "0-1"]

1. e4 e5 2. Bc4 Qh4 3. Nf3 Qxf2# 0-1`;

      const importResult = await server.executeTool('import_game', {
        pgn: testPGN,
      });

      expect(importResult.success).toBe(true);

      const gameId = (importResult.data as ImportGameData).gameId;

      // Verify the game can be retrieved
      const statusResult = await server.executeTool('get_game_status', {
        gameId: gameId,
      });

      expect(statusResult.success).toBe(true);
      expect((statusResult.data as GameStatusData).status).toBe('completed');
      expect((statusResult.data as GameStatusData).result).toBe('0-1');
    });

    it('should import game with correct move history', async () => {
      const testPGN = `[Event "Move History Test"]
[Site "Test"]
[Date "2025.01.03"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. d4 d5 2. c4 c6 3. Nc3 *`;

      const importResult = await server.executeTool('import_game', {
        pgn: testPGN,
      });

      expect(importResult.success).toBe(true);

      const gameId = (importResult.data as ImportGameData).gameId;

      // Check move history
      const historyResult = await server.executeTool('get_move_history', {
        gameId: gameId,
        format: 'algebraic',
      });

      expect(historyResult.success).toBe(true);
      const moves = (historyResult.data as MoveHistoryData).moveHistory;
      expect(moves).toEqual(['d4', 'd5', 'c4', 'c6', 'Nc3']);
    });
  });
});
