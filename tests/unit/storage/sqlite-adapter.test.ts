import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from '@jest/globals';
import { SQLiteAdapter } from '../../../src/core/storage/SQLiteAdapter.js';
import { Game } from '../../../src/core/game/Game.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const testDir = path.join(process.cwd(), 'tests', 'unit', 'storage');

describe('SQLiteAdapter', () => {
  let adapter: SQLiteAdapter;
  const testDbPath = path.join(testDir, 'test-games.db');

  beforeAll(async () => {
    // Ensure test database doesn't exist before starting
    try {
      await fs.unlink(testDbPath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  beforeEach(async () => {
    adapter = new SQLiteAdapter(testDbPath);
    await adapter.initialize();

    // Clear all games before each test
    const allGames = await adapter.loadAllGames();
    for (const game of allGames) {
      await adapter.deleteGame(game.id);
    }
  });

  afterEach(async () => {
    await adapter.close();
  });

  afterAll(async () => {
    // Clean up test database
    try {
      await fs.unlink(testDbPath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe('initialization', () => {
    it('should create database and tables on initialization', async () => {
      // Initialization happens in beforeEach
      const healthy = await adapter.isHealthy();
      expect(healthy).toBe(true);
    });

    it('should handle multiple initializations gracefully', async () => {
      // Already initialized in beforeEach
      await expect(adapter.initialize()).resolves.not.toThrow();

      const healthy = await adapter.isHealthy();
      expect(healthy).toBe(true);
    });
  });

  describe('saveGame and loadGame', () => {
    it('should save and retrieve a game', async () => {
      const game = new Game('player1', 'player2');

      await adapter.saveGame(game);

      const loaded = await adapter.loadGame(game.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe(game.id);
      expect(loaded!.whitePlayerId).toBe('player1');
      expect(loaded!.blackPlayerId).toBe('player2');
      expect(loaded!.status).toBe('active');
    });

    it('should return null for non-existent game', async () => {
      const loaded = await adapter.loadGame('non-existent');
      expect(loaded).toBeNull();
    });

    it('should update existing game', async () => {
      const game = new Game('player1', 'player2');
      await adapter.saveGame(game);

      // Modify and save again
      game.completeGame('1-0');
      await adapter.saveGame(game);

      const loaded = await adapter.loadGame(game.id);
      expect(loaded!.status).toBe('completed');
      expect(loaded!.result).toBe('1-0');
    });

    it('should preserve all game properties', async () => {
      const game = new Game('player1', 'player2', {
        type: 'fixed',
        initialTime: 600,
        increment: 5,
      });

      game.pauseGame('player1');
      await adapter.saveGame(game);

      const loaded = await adapter.loadGame(game.id);
      expect(loaded!.status).toBe('paused');
      expect(loaded!.pauseRequestedBy).toBe('player1');
      expect(loaded!.timeControl).toEqual({
        type: 'fixed',
        initialTime: 600,
        increment: 5,
      });
    });
  });

  describe('deleteGame', () => {
    it('should delete existing game', async () => {
      const game = new Game('player1', 'player2');
      await adapter.saveGame(game);

      const deleted = await adapter.deleteGame(game.id);
      expect(deleted).toBe(true);

      const loaded = await adapter.loadGame(game.id);
      expect(loaded).toBeNull();
    });

    it('should return false when deleting non-existent game', async () => {
      const deleted = await adapter.deleteGame('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('loadAllGames', () => {
    it('should return empty array when no games', async () => {
      const games = await adapter.loadAllGames();
      expect(games).toEqual([]);
    });

    it('should return all stored games', async () => {
      const game1 = new Game('p1', 'p2');
      const game2 = new Game('p3', 'p4');

      await adapter.saveGame(game1);
      await adapter.saveGame(game2);

      const games = await adapter.loadAllGames();
      expect(games).toHaveLength(2);
      expect(games.map(g => g.id).sort()).toEqual([game1.id, game2.id].sort());
    });
  });

  describe('loadGamesByStatus', () => {
    it('should filter games by status', async () => {
      const game1 = new Game('p1', 'p2');
      const game2 = new Game('p3', 'p4');
      const game3 = new Game('p5', 'p6');

      game2.completeGame('1-0');
      game3.pauseGame('p5');

      await adapter.saveGame(game1);
      await adapter.saveGame(game2);
      await adapter.saveGame(game3);

      const active = await adapter.loadGamesByStatus('active');
      expect(active).toHaveLength(1);
      expect(active[0]!.id).toBe(game1.id);

      const completed = await adapter.loadGamesByStatus('completed');
      expect(completed).toHaveLength(1);
      expect(completed[0]!.id).toBe(game2.id);

      const paused = await adapter.loadGamesByStatus('paused');
      expect(paused).toHaveLength(1);
      expect(paused[0]!.id).toBe(game3.id);
    });
  });

  describe('loadGamesByPlayer', () => {
    it('should find games where player is white or black', async () => {
      const game1 = new Game('player1', 'player2');
      const game2 = new Game('player3', 'player1');
      const game3 = new Game('player2', 'player3');

      await adapter.saveGame(game1);
      await adapter.saveGame(game2);
      await adapter.saveGame(game3);

      const games = await adapter.loadGamesByPlayer('player1');
      expect(games).toHaveLength(2);
      expect(games.map(g => g.id).sort()).toEqual([game1.id, game2.id].sort());
    });
  });

  describe('countActiveGames', () => {
    it('should count only active games', async () => {
      const game1 = new Game('p1', 'p2');
      const game2 = new Game('p3', 'p4');

      await adapter.saveGame(game1);
      await adapter.saveGame(game2);

      expect(await adapter.countActiveGames()).toBe(2);

      game1.completeGame('1-0');
      await adapter.saveGame(game1);

      expect(await adapter.countActiveGames()).toBe(1);
    });
  });

  describe('gameExists', () => {
    it('should return true for existing game', async () => {
      const game = new Game('player1', 'player2');
      await adapter.saveGame(game);

      const exists = await adapter.gameExists(game.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent game', async () => {
      const exists = await adapter.gameExists('non-existent');
      expect(exists).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist data across connections', async () => {
      const game = new Game('player1', 'player2');
      await adapter.saveGame(game);
      await adapter.close();

      // Create new adapter instance
      const newAdapter = new SQLiteAdapter(testDbPath);
      await newAdapter.initialize();

      const loaded = await newAdapter.loadGame(game.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe(game.id);

      await newAdapter.close();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      await adapter.close();

      // Operations should fail gracefully after close
      await expect(adapter.saveGame(new Game('p1', 'p2'))).rejects.toThrow();
    });
  });
});
