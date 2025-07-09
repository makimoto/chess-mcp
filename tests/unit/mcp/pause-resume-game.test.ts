import { describe, it, expect, beforeEach } from '@jest/globals';
import { ChessMCPServer } from '../../../src/mcp/ChessMCPServer';
import { GameManager } from '../../../src/core/game/GameManager';
import { InMemoryAdapter } from '../../../src/core/storage/InMemoryAdapter';

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

interface PauseResumeData {
  gameId: string;
  status: string;
  pausedAt?: Date;
  resumedAt?: Date;
}

describe('ChessMCPServer - pause_game/resume_game tools', () => {
  let server: ChessMCPServer;
  let gameManager: GameManager;
  let gameId: string;

  beforeEach(async () => {
    const storage = new InMemoryAdapter();
    gameManager = new GameManager(storage);
    server = new ChessMCPServer(gameManager);

    // Create a test game for pause/resume operations
    const game = await gameManager.createGame('player1', 'player2');
    gameId = game.id;
  });

  describe('pause_game tool registration', () => {
    it('should register pause_game tool', () => {
      const tools = server.getTools();
      const pauseGameTool = tools.find(tool => tool.name === 'pause_game');

      expect(pauseGameTool).toBeDefined();
      expect(pauseGameTool?.description).toContain(
        'Pause an active chess game'
      );
    });

    it('should require gameId and playerId parameters', () => {
      const tools = server.getTools();
      const pauseGameTool = tools.find(tool => tool.name === 'pause_game');

      expect(pauseGameTool?.inputSchema.required).toEqual([
        'gameId',
        'playerId',
      ]);
      expect(pauseGameTool?.inputSchema.properties).toHaveProperty('gameId');
      expect(pauseGameTool?.inputSchema.properties).toHaveProperty('playerId');
    });
  });

  describe('resume_game tool registration', () => {
    it('should register resume_game tool', () => {
      const tools = server.getTools();
      const resumeGameTool = tools.find(tool => tool.name === 'resume_game');

      expect(resumeGameTool).toBeDefined();
      expect(resumeGameTool?.description).toContain(
        'Resume a paused chess game'
      );
    });

    it('should require gameId parameter', () => {
      const tools = server.getTools();
      const resumeGameTool = tools.find(tool => tool.name === 'resume_game');

      expect(resumeGameTool?.inputSchema.required).toEqual(['gameId']);
      expect(resumeGameTool?.inputSchema.properties).toHaveProperty('gameId');
    });
  });

  describe('pause_game functionality', () => {
    it('should pause an active game successfully', async () => {
      const result = await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player1',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('status', 'paused');
      expect(result.data).toHaveProperty('pausedBy', 'player1');
    });

    it('should allow either player to pause the game', async () => {
      const result = await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'paused');
      expect(result.data).toHaveProperty('pausedBy', 'player2');
    });

    it('should update game status to paused', async () => {
      await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player1',
      });

      const statusResult = await server.executeTool('get_game_status', {
        gameId: gameId,
      });

      expect(statusResult.success).toBe(true);
      expect((statusResult.data as GameStatusData).status).toBe('paused');
    });
  });

  describe('resume_game functionality', () => {
    beforeEach(async () => {
      // Pause the game first
      await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player1',
      });
    });

    it('should resume a paused game successfully', async () => {
      const result = await server.executeTool('resume_game', {
        gameId: gameId,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gameId', gameId);
      expect(result.data).toHaveProperty('status', 'active');
      expect(result.data).toHaveProperty('resumedAt');
    });

    it('should update game status to active', async () => {
      await server.executeTool('resume_game', {
        gameId: gameId,
      });

      const statusResult = await server.executeTool('get_game_status', {
        gameId: gameId,
      });

      expect(statusResult.success).toBe(true);
      expect((statusResult.data as GameStatusData).status).toBe('active');
    });
  });

  describe('pause_game validation', () => {
    it('should reject pause request from non-player', async () => {
      const result = await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'unauthorized_player',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('You are not a player in this game');
    });

    it('should reject pause request for non-existent game', async () => {
      const result = await server.executeTool('pause_game', {
        gameId: 'non-existent-game',
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not found');
    });

    it('should reject pause request for already paused game', async () => {
      // Pause the game first
      await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player1',
      });

      // Try to pause again
      const result = await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game is already paused');
    });

    it('should reject pause request for completed game', async () => {
      // Complete the game first
      await gameManager.resignGame(gameId, 'player1');

      const result = await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot pause completed game');
    });

    it('should handle missing required parameters', async () => {
      const result = await server.executeTool('pause_game', {
        gameId: gameId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameter: playerId');
    });
  });

  describe('resume_game validation', () => {
    it('should reject resume request for non-paused game', async () => {
      const result = await server.executeTool('resume_game', {
        gameId: gameId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game is not paused');
    });

    it('should reject resume request for non-existent game', async () => {
      const result = await server.executeTool('resume_game', {
        gameId: 'non-existent-game',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not found');
    });

    it('should reject resume request for completed game', async () => {
      // Complete the game first
      await gameManager.resignGame(gameId, 'player1');

      const result = await server.executeTool('resume_game', {
        gameId: gameId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot resume completed game');
    });

    it('should handle missing required parameters', async () => {
      const result = await server.executeTool('resume_game', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameter: gameId');
    });
  });

  describe('pause/resume workflow integration', () => {
    it('should allow multiple pause/resume cycles', async () => {
      // First pause/resume cycle
      await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player1',
      });

      await server.executeTool('resume_game', {
        gameId: gameId,
      });

      // Second pause/resume cycle
      const pauseResult = await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player2',
      });

      const resumeResult = await server.executeTool('resume_game', {
        gameId: gameId,
      });

      expect(pauseResult.success).toBe(true);
      expect(resumeResult.success).toBe(true);
      expect((resumeResult.data as PauseResumeData).status).toBe('active');
    });

    it('should preserve game state during pause/resume', async () => {
      // Make some moves first
      await server.executeTool('make_move', {
        gameId: gameId,
        move: 'e4',
        playerId: 'player1',
      });

      await server.executeTool('make_move', {
        gameId: gameId,
        move: 'e5',
        playerId: 'player2',
      });

      // Pause and resume
      await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player1',
      });

      await server.executeTool('resume_game', {
        gameId: gameId,
      });

      // Check that game state is preserved
      const historyResult = await server.executeTool('get_move_history', {
        gameId: gameId,
        format: 'algebraic',
      });

      expect(historyResult.success).toBe(true);
      const moves = (historyResult.data as MoveHistoryData).moveHistory;
      expect(moves).toEqual(['e4', 'e5']);
    });

    it('should allow moves after resuming', async () => {
      // Pause and resume
      await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player1',
      });

      await server.executeTool('resume_game', {
        gameId: gameId,
      });

      // Make a move after resuming
      const moveResult = await server.executeTool('make_move', {
        gameId: gameId,
        move: 'e4',
        playerId: 'player1',
      });

      expect(moveResult.success).toBe(true);
    });

    it('should prevent moves while game is paused', async () => {
      // Pause the game
      await server.executeTool('pause_game', {
        gameId: gameId,
        playerId: 'player1',
      });

      // Try to make a move while paused
      const moveResult = await server.executeTool('make_move', {
        gameId: gameId,
        move: 'e4',
        playerId: 'player1',
      });

      expect(moveResult.success).toBe(false);
      expect(moveResult.error).toContain('Game is paused');
    });
  });
});
