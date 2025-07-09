import { describe, it, expect, beforeEach } from '@jest/globals';
import { Game } from '../../../src/core/game/Game.js';
describe('Game State Management', () => {
  let game;
  beforeEach(() => {
    game = new Game('player1', 'player2');
  });
  describe('completeGame', () => {
    it('should mark game as completed with result', () => {
      const beforeUpdate = game.updatedAt;
      game.completeGame('1-0');
      expect(game.status).toBe('completed');
      expect(game.result).toBe('1-0');
      expect(game.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime()
      );
    });
    it('should throw error if game already completed', () => {
      game.completeGame('1-0');
      expect(() => game.completeGame('0-1')).toThrow(
        'Game is already completed'
      );
    });
    it('should accept all valid game results', () => {
      const games = [
        new Game('p1', 'p2'),
        new Game('p3', 'p4'),
        new Game('p5', 'p6'),
      ];
      const results = ['1-0', '0-1', '1/2-1/2'];
      games.forEach((g, i) => {
        g.completeGame(results[i]);
        expect(g.result).toBe(results[i]);
      });
    });
  });
  describe('updateStatus', () => {
    it('should update game status', () => {
      const beforeUpdate = game.updatedAt;
      game.updateStatus('paused');
      expect(game.status).toBe('paused');
      expect(game.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime()
      );
    });
    it('should allow updating to any valid status', () => {
      game.updateStatus('paused');
      expect(game.status).toBe('paused');
      game.updateStatus('active');
      expect(game.status).toBe('active');
      game.updateStatus('completed');
      expect(game.status).toBe('completed');
    });
  });
  describe('pauseGame', () => {
    it('should pause active game', () => {
      game.pauseGame('player1');
      expect(game.status).toBe('paused');
      expect(game.pauseRequestedBy).toBe('player1');
    });
    it('should throw error if game not active', () => {
      game.completeGame('1-0');
      expect(() => game.pauseGame('player1')).toThrow(
        'Can only pause active games'
      );
    });
    it('should throw error if trying to pause already paused game', () => {
      game.pauseGame('player1');
      expect(() => game.pauseGame('player2')).toThrow(
        'Can only pause active games'
      );
    });
  });
  describe('resumeGame', () => {
    it('should resume paused game', () => {
      game.pauseGame('player1');
      game.resumeGame();
      expect(game.status).toBe('active');
      expect(game.pauseRequestedBy).toBeUndefined();
    });
    it('should throw error if game not paused', () => {
      expect(() => game.resumeGame()).toThrow('Can only resume paused games');
    });
    it('should throw error if trying to resume completed game', () => {
      game.completeGame('1-0');
      expect(() => game.resumeGame()).toThrow('Can only resume paused games');
    });
  });
  describe('serialization', () => {
    it('should serialize to JSON correctly', () => {
      const json = game.toJSON();
      expect(json.id).toBe(game.id);
      expect(json.status).toBe('active');
      expect(json.whitePlayerId).toBe('player1');
      expect(json.blackPlayerId).toBe('player2');
      expect(json.fen).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
      expect(json.pgn).toBe('');
      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.updatedAt).toBeInstanceOf(Date);
      expect(json.invalidMoveCounts).toEqual({});
    });
    it('should serialize completed game correctly', () => {
      game.completeGame('1-0');
      const json = game.toJSON();
      expect(json.status).toBe('completed');
      expect(json.result).toBe('1-0');
    });
    it('should serialize paused game correctly', () => {
      game.pauseGame('player2');
      const json = game.toJSON();
      expect(json.status).toBe('paused');
      expect(json.pauseRequestedBy).toBe('player2');
    });
    it('should serialize game with time control', () => {
      const gameWithTime = new Game('p1', 'p2', {
        type: 'fixed',
        initialTime: 600,
        increment: 5,
      });
      const json = gameWithTime.toJSON();
      expect(json.timeControl).toEqual({
        type: 'fixed',
        initialTime: 600,
        increment: 5,
      });
      expect(json.whiteTimeRemaining).toBe(600);
      expect(json.blackTimeRemaining).toBe(600);
    });
  });
  describe('deserialization', () => {
    it('should deserialize from JSON correctly', () => {
      const json = game.toJSON();
      const restored = Game.fromJSON(json);
      expect(restored).toBeInstanceOf(Game);
      expect(restored.id).toBe(game.id);
      expect(restored.status).toBe(game.status);
      expect(restored.whitePlayerId).toBe(game.whitePlayerId);
      expect(restored.blackPlayerId).toBe(game.blackPlayerId);
      expect(restored.fen).toBe(game.fen);
      expect(restored.pgn).toBe(game.pgn);
      expect(restored.currentTurn).toBe(game.currentTurn);
      expect(restored.createdAt).toEqual(game.createdAt);
      expect(restored.updatedAt).toEqual(game.updatedAt);
    });
    it('should deserialize completed game correctly', () => {
      game.completeGame('0-1');
      const json = game.toJSON();
      const restored = Game.fromJSON(json);
      expect(restored.status).toBe('completed');
      expect(restored.result).toBe('0-1');
    });
    it('should deserialize paused game correctly', () => {
      game.pauseGame('player1');
      const json = game.toJSON();
      const restored = Game.fromJSON(json);
      expect(restored.status).toBe('paused');
      expect(restored.pauseRequestedBy).toBe('player1');
    });
    it('should handle missing optional fields', () => {
      const minimalData = {
        id: 'test-id',
        whitePlayerId: 'white',
        blackPlayerId: 'black',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn: '',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        invalidMoveCounts: {},
      };
      const restored = Game.fromJSON(minimalData);
      expect(restored.result).toBeUndefined();
      expect(restored.timeControl).toBeUndefined();
      expect(restored.lastMoveAt).toBeUndefined();
      expect(restored.whiteTimeRemaining).toBeUndefined();
      expect(restored.blackTimeRemaining).toBeUndefined();
      expect(restored.drawOfferFrom).toBeUndefined();
      expect(restored.pauseRequestedBy).toBeUndefined();
    });
    it('should deserialize game with custom FEN position', () => {
      const customData = {
        id: 'test-id',
        whitePlayerId: 'white',
        blackPlayerId: 'black',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        pgn: '1. e4',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        invalidMoveCounts: {},
      };
      const restored = Game.fromJSON(customData);
      expect(restored.fen).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
      );
      expect(restored.currentTurn).toBe('black'); // Determined from FEN
    });
    it('should preserve all data through serialize/deserialize cycle', () => {
      // Set up complex game state
      game.pauseGame('player2');
      // Serialize and deserialize
      const json = game.toJSON();
      const restored = Game.fromJSON(json);
      const reserialized = restored.toJSON();
      // Check all fields match
      expect(reserialized).toEqual(json);
    });
  });
});
//# sourceMappingURL=game.state-management.test.js.map
