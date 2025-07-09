import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GameManager } from '../../../src/core/game/GameManager.js';
import { Game } from '../../../src/core/game/Game.js';
import { InMemoryAdapter } from '../../../src/core/storage/InMemoryAdapter.js';
describe('GameManager', () => {
  let gameManager;
  let storage;
  beforeEach(() => {
    storage = new InMemoryAdapter();
    gameManager = new GameManager(storage);
  });
  afterEach(async () => {
    await gameManager.close();
  });
  describe('Game Creation', () => {
    it('should create a new game successfully', async () => {
      // Arrange
      const whitePlayerId = 'player1';
      const blackPlayerId = 'player2';
      // Act
      const game = await gameManager.createGame(whitePlayerId, blackPlayerId);
      // Assert
      expect(game).toBeInstanceOf(Game);
      expect(game.whitePlayerId).toBe(whitePlayerId);
      expect(game.blackPlayerId).toBe(blackPlayerId);
      expect(game.status).toBe('active');
    });
    it('should store created games', async () => {
      // Arrange
      const whitePlayerId = 'player1';
      const blackPlayerId = 'player2';
      // Act
      const game = await gameManager.createGame(whitePlayerId, blackPlayerId);
      const retrievedGame = await gameManager.getGame(game.id);
      // Assert
      expect(retrievedGame?.id).toBe(game.id);
      expect(retrievedGame?.whitePlayerId).toBe(whitePlayerId);
      expect(retrievedGame?.blackPlayerId).toBe(blackPlayerId);
    });
    it('should return list of active games', async () => {
      // Arrange
      const game1 = await gameManager.createGame('player1', 'player2');
      const game2 = await gameManager.createGame('player3', 'player4');
      // Act
      const activeGames = await gameManager.getActiveGames();
      // Assert
      expect(activeGames).toHaveLength(2);
      expect(activeGames.map(g => g.id).sort()).toEqual(
        [game1.id, game2.id].sort()
      );
    });
  });
  describe('Concurrent Game Limits', () => {
    it('should allow up to 5 concurrent games', async () => {
      // Arrange & Act
      const games = [];
      for (let i = 1; i <= 5; i++) {
        const game = await gameManager.createGame(`white${i}`, `black${i}`);
        games.push(game);
      }
      // Assert
      expect(games).toHaveLength(5);
      const activeGames = await gameManager.getActiveGames();
      expect(activeGames).toHaveLength(5);
      games.forEach(game => {
        expect(game.status).toBe('active');
      });
    });
    it('should reject creation of 6th concurrent game', async () => {
      // Arrange
      for (let i = 1; i <= 5; i++) {
        await gameManager.createGame(`white${i}`, `black${i}`);
      }
      // Act & Assert
      await expect(async () => {
        await gameManager.createGame('white6', 'black6');
      }).rejects.toThrow('Maximum number of concurrent games (5) reached');
    });
    it('should allow new game creation after completing a game', async () => {
      // Arrange
      const games = [];
      for (let i = 1; i <= 5; i++) {
        const game = await gameManager.createGame(`white${i}`, `black${i}`);
        games.push(game);
      }
      // Act - Complete one game
      await gameManager.completeGame(games[0].id, '1-0');
      const newGame = await gameManager.createGame('white6', 'black6');
      // Assert
      expect(newGame).toBeInstanceOf(Game);
      const activeGames = await gameManager.getActiveGames();
      expect(activeGames).toHaveLength(5);
    });
  });
  describe('Game Retrieval', () => {
    it('should return null for non-existent game', async () => {
      // Act
      const game = await gameManager.getGame('non-existent-id');
      // Assert
      expect(game).toBeNull();
    });
    it('should return empty array when no active games', async () => {
      // Act
      const activeGames = await gameManager.getActiveGames();
      // Assert
      expect(activeGames).toEqual([]);
    });
  });
  describe('Game Completion', () => {
    it('should mark game as completed', async () => {
      // Arrange
      const game = await gameManager.createGame('player1', 'player2');
      // Act
      await gameManager.completeGame(game.id, '1-0');
      // Assert
      const retrievedGame = await gameManager.getGame(game.id);
      expect(retrievedGame?.status).toBe('completed');
      expect(retrievedGame?.result).toBe('1-0');
    });
    it('should remove completed game from active games list', async () => {
      // Arrange
      const game1 = await gameManager.createGame('player1', 'player2');
      const game2 = await gameManager.createGame('player3', 'player4');
      // Act
      await gameManager.completeGame(game1.id, '1-0');
      // Assert
      const activeGames = await gameManager.getActiveGames();
      expect(activeGames).toHaveLength(1);
      expect(activeGames[0].id).toBe(game2.id);
    });
    it('should throw error when trying to complete non-existent game', async () => {
      // Act & Assert
      await expect(async () => {
        await gameManager.completeGame('non-existent-id', '1-0');
      }).rejects.toThrow('Game not found');
    });
  });
  describe('Game Listing', () => {
    it('should return all games including completed ones', async () => {
      // Arrange
      const game1 = await gameManager.createGame('player1', 'player2');
      const game2 = await gameManager.createGame('player3', 'player4');
      await gameManager.completeGame(game1.id, '1-0');
      // Act
      const allGames = await gameManager.getAllGames();
      // Assert
      expect(allGames).toHaveLength(2);
      expect(allGames.map(g => g.id).sort()).toEqual(
        [game1.id, game2.id].sort()
      );
    });
    it('should return only completed games', async () => {
      // Arrange
      const game1 = await gameManager.createGame('player1', 'player2');
      const game2 = await gameManager.createGame('player3', 'player4');
      const game3 = await gameManager.createGame('player5', 'player6');
      await gameManager.completeGame(game1.id, '1-0');
      await gameManager.completeGame(game2.id, '0-1');
      // Act
      const completedGames = await gameManager.getCompletedGames();
      // Assert
      expect(completedGames).toHaveLength(2);
      expect(completedGames.map(g => g.id).sort()).toEqual(
        [game1.id, game2.id].sort()
      );
      expect(completedGames.map(g => g.id)).not.toContain(game3.id);
    });
    it('should return empty array when no completed games exist', async () => {
      // Arrange
      await gameManager.createGame('player1', 'player2');
      await gameManager.createGame('player3', 'player4');
      // Act
      const completedGames = await gameManager.getCompletedGames();
      // Assert
      expect(completedGames).toEqual([]);
    });
  });
  describe('Edge Cases', () => {
    it('should handle same player in multiple games', async () => {
      // Arrange & Act
      const game1 = await gameManager.createGame('reusedPlayer', 'player2');
      const game2 = await gameManager.createGame('player3', 'reusedPlayer');
      // Assert
      expect(game1.whitePlayerId).toBe('reusedPlayer');
      expect(game2.blackPlayerId).toBe('reusedPlayer');
      const activeGames = await gameManager.getActiveGames();
      expect(activeGames).toHaveLength(2);
    });
  });
  describe('New Storage Methods', () => {
    it('should delete games successfully', async () => {
      const game = await gameManager.createGame('player1', 'player2');
      const deleted = await gameManager.deleteGame(game.id);
      expect(deleted).toBe(true);
      const retrieved = await gameManager.getGame(game.id);
      expect(retrieved).toBeNull();
    });
    it('should check if game exists', async () => {
      const game = await gameManager.createGame('player1', 'player2');
      expect(await gameManager.gameExists(game.id)).toBe(true);
      expect(await gameManager.gameExists('non-existent')).toBe(false);
    });
    it('should get player games', async () => {
      const game1 = await gameManager.createGame('player1', 'player2');
      const game2 = await gameManager.createGame('player3', 'player1');
      await gameManager.createGame('player4', 'player5');
      const player1Games = await gameManager.getPlayerGames('player1');
      expect(player1Games).toHaveLength(2);
      expect(player1Games.map(g => g.id).sort()).toEqual(
        [game1.id, game2.id].sort()
      );
    });
    it('should pause and resume games', async () => {
      const game = await gameManager.createGame('player1', 'player2');
      await gameManager.pauseGame(game.id, 'player1');
      let retrieved = await gameManager.getGame(game.id);
      expect(retrieved?.status).toBe('paused');
      expect(retrieved?.pauseRequestedBy).toBe('player1');
      await gameManager.resumeGame(game.id);
      retrieved = await gameManager.getGame(game.id);
      expect(retrieved?.status).toBe('active');
      expect(retrieved?.pauseRequestedBy).toBeUndefined();
    });
    it('should check health status', async () => {
      const healthy = await gameManager.isHealthy();
      expect(healthy).toBe(true);
    });
  });
});
//# sourceMappingURL=game.manager.test.js.map
