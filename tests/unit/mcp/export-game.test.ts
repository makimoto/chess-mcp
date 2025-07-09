import { describe, it, expect, beforeEach } from '@jest/globals';
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

interface ExportGameResponse {
  gameId: string;
  format: string;
  content: string;
  metadata?: {
    whitePlayer: string;
    blackPlayer: string;
    result: string;
    gameStatus: string;
    date: string;
  };
}

describe('ChessMCPServer - export_game tool', () => {
  let server: ChessMCPServer;
  let gameManager: GameManager;

  beforeEach(() => {
    const storage = new InMemoryAdapter();
    gameManager = new GameManager(storage);
    server = new ChessMCPServer(gameManager);
  });

  describe('export_game basic functionality', () => {
    it('should export a game in PGN format', async () => {
      // Create a game
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Make a few moves
      await server.executeTool('make_move', {
        gameId,
        playerId: 'player1',
        move: 'e4',
      });
      await server.executeTool('make_move', {
        gameId,
        playerId: 'player2',
        move: 'c5',
      });

      // Export the game
      const result = await server.executeTool('export_game', {
        gameId,
        format: 'PGN',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const exportData = result.data as ExportGameResponse;
      expect(exportData.gameId).toBe(gameId);
      expect(exportData.format).toBe('PGN');
      expect(exportData.content).toBeDefined();
      expect(exportData.content).toContain('1. e4 c5'); // PGN shows full move sequence
      expect(exportData.content).toContain('[White "player1"]'); // PGN header includes white player
      expect(exportData.content).toContain('[Black "player2"]'); // PGN header includes black player
      expect(exportData.content).toContain('[Event "Chess MCP Game"]'); // PGN header includes event
    });

    it('should export a game in FEN format', async () => {
      // Create a game
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Export the game
      const result = await server.executeTool('export_game', {
        gameId,
        format: 'FEN',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const exportData = result.data as ExportGameResponse;
      expect(exportData.gameId).toBe(gameId);
      expect(exportData.format).toBe('FEN');
      expect(exportData.content).toBeDefined();
      expect(exportData.content).toContain(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    });

    it('should default to PGN format when format is not specified', async () => {
      // Create a game
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Export the game without format
      const result = await server.executeTool('export_game', {
        gameId,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const exportData = result.data as ExportGameResponse;
      expect(exportData.format).toBe('PGN');
    });

    it('should include metadata in export', async () => {
      // Create a game
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Export the game
      const result = await server.executeTool('export_game', {
        gameId,
        format: 'PGN',
      });

      expect(result.success).toBe(true);
      const exportData = result.data as ExportGameResponse;
      expect(exportData.metadata).toBeDefined();
      expect(exportData.metadata?.whitePlayer).toBe('player1');
      expect(exportData.metadata?.blackPlayer).toBe('player2');
      expect(exportData.metadata?.gameStatus).toBe('active');
      expect(exportData.metadata?.date).toBeDefined();
    });
  });

  describe('export_game error handling', () => {
    it('should handle non-existent game ID', async () => {
      const result = await server.executeTool('export_game', {
        gameId: 'non-existent-game',
        format: 'PGN',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not found');
    });

    it('should handle invalid format', async () => {
      // Create a game
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Try to export with invalid format
      const result = await server.executeTool('export_game', {
        gameId,
        format: 'INVALID_FORMAT',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported format');
    });

    it('should handle missing gameId parameter', async () => {
      const result = await server.executeTool('export_game', {
        format: 'PGN',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameter: gameId');
    });

    it('should handle invalid gameId parameter type', async () => {
      const result = await server.executeTool('export_game', {
        gameId: 123,
        format: 'PGN',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid parameter type');
    });
  });

  describe('export_game with completed games', () => {
    it('should export completed game with result', async () => {
      // Create a game
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Resign the game
      await server.executeTool('resign_game', {
        gameId,
        playerId: 'player1',
      });

      // Export the game
      const result = await server.executeTool('export_game', {
        gameId,
        format: 'PGN',
      });

      expect(result.success).toBe(true);
      const exportData = result.data as ExportGameResponse;
      expect(exportData.metadata?.result).toBe('0-1');
      expect(exportData.metadata?.gameStatus).toBe('completed');
    });

    it('should export drawn game with draw result', async () => {
      // Create a game
      const createResult = await server.executeTool('create_game', {
        whitePlayerId: 'player1',
        blackPlayerId: 'player2',
      });
      const gameId = (createResult.data as CreateGameResponse).gameId;

      // Offer and accept draw
      await server.executeTool('offer_draw', {
        gameId,
        playerId: 'player1',
      });
      await server.executeTool('accept_draw', {
        gameId,
        playerId: 'player2',
      });

      // Export the game
      const result = await server.executeTool('export_game', {
        gameId,
        format: 'PGN',
      });

      expect(result.success).toBe(true);
      const exportData = result.data as ExportGameResponse;
      expect(exportData.metadata?.result).toBe('1/2-1/2');
      expect(exportData.metadata?.gameStatus).toBe('completed');
    });
  });
});
