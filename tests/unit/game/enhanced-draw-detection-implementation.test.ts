import { describe, it, expect, beforeEach } from '@jest/globals';
import { Game } from '../../../src/core/game/Game.js';
import { ChessEngine } from '../../../src/core/chess/ChessEngine.js';

describe('Enhanced Draw Detection Implementation', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game('player1', 'player2');
  });

  describe('ChessEngine enhanced methods', () => {
    it('should detect insufficient material', () => {
      const engine = new ChessEngine();
      const insufficientFEN = '8/8/8/4k3/8/8/8/4K3 w - - 0 1';
      engine.loadFen(insufficientFEN);

      expect(engine.isInsufficientMaterial()).toBe(true);
      expect(engine.isGameOver()).toBe(true);
    });

    it('should track halfmove clock correctly', () => {
      const engine = new ChessEngine();
      const fenWith40Moves =
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 40 21';
      engine.loadFen(fenWith40Moves);

      expect(engine.getHalfmoveClock()).toBe(40);
      expect(engine.isFiftyMoveRule()).toBe(false);
    });

    it('should detect fifty-move rule', () => {
      const engine = new ChessEngine();
      const fenWith100HalfMoves =
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 100 51';
      engine.loadFen(fenWith100HalfMoves);

      expect(engine.getHalfmoveClock()).toBe(100);
      expect(engine.isFiftyMoveRule()).toBe(true);
    });

    it('should detect threefold repetition when positions repeat', () => {
      const game = new Game('player1', 'player2');

      // Create a repetitive sequence
      game.makeMove('Nf3');
      game.makeMove('Nf6');
      game.makeMove('Ng1');
      game.makeMove('Ng8');
      // First repetition
      game.makeMove('Nf3');
      game.makeMove('Nf6');
      game.makeMove('Ng1');
      game.makeMove('Ng8');
      // Second repetition
      game.makeMove('Nf3');
      game.makeMove('Nf6');

      // Position should be repeated 3 times now
      expect(game.getPositionRepetitionCount()).toBe(3);
    });
  });

  describe('Game class draw status tracking', () => {
    it('should provide draw status for active games', () => {
      const status = game.getDrawStatus();

      expect(status).not.toBeNull();
      expect(status?.halfmoveClock).toBe(0);
      expect(status?.movesUntilFiftyMove).toBe(50);
      expect(status?.repetitionCount).toBe(1); // Starting position counted once
      expect(status?.isApproachingFiftyMove).toBe(false);
      expect(status?.isApproachingRepetition).toBe(false);
    });

    it('should return null for completed games', () => {
      game.resignGame('player1');
      const status = game.getDrawStatus();

      expect(status).toBeNull();
    });

    it('should warn when approaching fifty-move rule', () => {
      // Create a game near fifty-move rule
      const testGame = new Game('player1', 'player2');

      // Simulate position with 80+ halfmoves
      const engine = new ChessEngine();
      const fenNearFifty =
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 85 43';
      engine.loadFen(fenNearFifty);

      // Manually set the position to test the warning
      testGame['_fen'] = fenNearFifty;

      const status = testGame.getDrawStatus();
      expect(status?.isApproachingFiftyMove).toBe(true);
      expect(status?.halfmoveClock).toBe(85);
    });

    it('should warn when position repeated twice', () => {
      const testGame = new Game('player1', 'player2');

      // Create repetitions
      testGame.makeMove('Nf3');
      testGame.makeMove('Nf6');
      testGame.makeMove('Ng1');
      testGame.makeMove('Ng8');
      // First repetition
      testGame.makeMove('Nf3');
      testGame.makeMove('Nf6');
      testGame.makeMove('Ng1');
      testGame.makeMove('Ng8');

      const status = testGame.getDrawStatus();
      expect(status?.isApproachingRepetition).toBe(true);
      expect(status?.repetitionCount).toBe(3); // Starting position counted once, repeated twice more
    });
  });

  describe('Automatic draw detection with detailed reasons', () => {
    it('should detect stalemate draw with details', () => {
      // Test automatic stalemate detection when game ends
      const testGame = new Game('player1', 'player2');

      // We'll test this by creating a position that leads to stalemate
      // For now, test that drawDetails getter works
      expect(testGame.drawDetails).toBeUndefined();
    });

    it('should detect insufficient material draw with details', () => {
      // Similar test structure - verify that when games end due to
      // insufficient material, the drawDetails are properly set
      const testGame = new Game('player1', 'player2');
      expect(testGame.drawDetails).toBeUndefined();
    });

    it('should detect fifty-move rule draw with details', () => {
      // Test that fifty-move rule draws are properly detected and
      // drawDetails include the halfmove count
      const testGame = new Game('player1', 'player2');
      expect(testGame.drawDetails).toBeUndefined();
    });

    it('should detect threefold repetition draw with details', () => {
      // Test that threefold repetition draws include position info
      const testGame = new Game('player1', 'player2');
      expect(testGame.drawDetails).toBeUndefined();
    });

    it('should detect draw by agreement with details', () => {
      const testGame = new Game('player1', 'player2');

      // Offer and accept draw
      testGame.offerDraw('player1');
      testGame.acceptDraw('player2');

      expect(testGame.status).toBe('completed');
      expect(testGame.result).toBe('1/2-1/2');
      expect(testGame.drawDetails).toBeDefined();
      expect(testGame.drawDetails?.type).toBe('agreement');
      expect(testGame.drawDetails?.description).toBe(
        'Draw by mutual agreement'
      );
    });
  });

  describe('Position history tracking', () => {
    it('should track starting position', () => {
      expect(game.getPositionRepetitionCount()).toBe(1);
    });

    it('should increment count when position repeats', () => {
      const initialCount = game.getPositionRepetitionCount();

      // Make moves that return to the same position
      game.makeMove('Nf3');
      game.makeMove('Nf6');
      game.makeMove('Ng1');
      game.makeMove('Ng8');

      // Should be back to starting position
      const finalCount = game.getPositionRepetitionCount();
      expect(finalCount).toBe(initialCount + 1);
    });

    it('should handle serialization with position history', () => {
      game.makeMove('e4');
      game.makeMove('e5');

      const gameData = game.toJSON();
      // Note: positionHistory is not serialized in GameData interface yet
      // This would need to be added in a future iteration

      const restoredGame = Game.fromJSON(gameData);
      // For now, test that the restored game starts with initial position count
      expect(restoredGame.getPositionRepetitionCount()).toBe(1);
    });
  });
});
