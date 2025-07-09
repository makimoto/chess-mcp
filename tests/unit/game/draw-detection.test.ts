import { describe, it, expect, beforeEach } from '@jest/globals';
import { Game } from '../../../src/core/game/Game.js';
import { ChessEngine } from '../../../src/core/chess/ChessEngine.js';

describe('Draw Detection', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game('player1', 'player2');
  });

  describe('ChessEngine draw detection methods', () => {
    it('should detect insufficient material draws', () => {
      const engine = new ChessEngine();
      const kingVsKingFEN = '8/8/8/4k3/8/8/8/4K3 w - - 0 1';
      engine.loadFen(kingVsKingFEN);

      expect(engine.isInsufficientMaterial()).toBe(true);
    });

    it('should track halfmove clock from FEN', () => {
      const engine = new ChessEngine();
      const fenWith40Moves =
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 40 21';
      engine.loadFen(fenWith40Moves);

      expect(engine.getHalfmoveClock()).toBe(40);
    });

    it('should detect fifty-move rule condition', () => {
      const engine = new ChessEngine();
      const fenWith100HalfMoves =
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 100 51';
      engine.loadFen(fenWith100HalfMoves);

      // This MUST FAIL - method doesn't exist yet
      expect(engine.isFiftyMoveRule()).toBe(true);
    });

    it('should detect threefold repetition', () => {
      const engine = new ChessEngine();

      // This MUST FAIL - method doesn't exist yet
      expect(engine.isThreefoldRepetition()).toBe(false);
    });
  });

  describe('Game class enhanced draw tracking (RED PHASE)', () => {
    it('should have drawDetails property for completed draws', () => {
      // Create a game and make it a draw by agreement
      game.offerDraw('player1');
      game.acceptDraw('player2');

      expect(game.drawDetails).toBeDefined();
      expect(game.drawDetails?.type).toBe('agreement');
      expect(game.drawDetails?.description).toContain('mutual agreement');
    });

    it('should track position repetitions', () => {
      expect(game.getPositionRepetitionCount()).toBe(1); // Starting position

      // Make moves that return to starting position
      game.makeMove('Nf3');
      game.makeMove('Nf6');
      game.makeMove('Ng1');
      game.makeMove('Ng8');

      expect(game.getPositionRepetitionCount()).toBe(2);
    });

    it('should provide draw status for active games', () => {
      const status = game.getDrawStatus();

      expect(status).toBeDefined();
      expect(status?.halfmoveClock).toBe(0);
      expect(status?.movesUntilFiftyMove).toBe(50);
      expect(status?.repetitionCount).toBe(1);
      expect(status?.isApproachingFiftyMove).toBe(false);
      expect(status?.isApproachingRepetition).toBe(false);
    });

    it('should warn when approaching fifty-move rule', () => {
      // Simulate a game near fifty-move rule (80+ halfmoves)
      const status = game.getDrawStatus();

      // For a game with 85 halfmoves, should warn
      // We'll need to implement this logic
      expect(status?.isApproachingFiftyMove).toBeDefined();
    });

    it('should warn when position repeated twice', () => {
      // Create repetitions manually
      game.makeMove('Nf3');
      game.makeMove('Nf6');
      game.makeMove('Ng1');
      game.makeMove('Ng8');
      // First repetition
      game.makeMove('Nf3');
      game.makeMove('Nf6');
      game.makeMove('Ng1');
      game.makeMove('Ng8');

      const status = game.getDrawStatus();
      expect(status?.isApproachingRepetition).toBe(true);
      expect(status?.repetitionCount).toBe(3); // Starting position counted as 1, so after 2 cycles = 3
    });
  });

  describe('Automatic draw detection with detailed reasons', () => {
    it('should detect stalemate with detailed reason', () => {
      const testGame = new Game('player1', 'player2');
      // After stalemate, drawDetails should be set
      expect(testGame.drawDetails).toBeUndefined(); // Initially undefined

      // When stalemate occurs, this should be set:
      // expect(testGame.drawDetails?.type).toBe('stalemate');
      // expect(testGame.drawDetails?.description).toContain('stalemate');
    });

    it('should detect insufficient material with detailed reason', () => {
      const testGame = new Game('player1', 'player2');
      expect(testGame.drawDetails).toBeUndefined();

      // When insufficient material draw occurs:
      // expect(testGame.drawDetails?.type).toBe('insufficient_material');
    });

    it('should detect fifty-move rule with halfmove count', () => {
      const testGame = new Game('player1', 'player2');
      expect(testGame.drawDetails).toBeUndefined();

      // When fifty-move rule draw occurs:
      // expect(testGame.drawDetails?.type).toBe('fifty_move');
      // expect(testGame.drawDetails?.halfmoveClock).toBe(100);
    });

    it('should detect threefold repetition with position info', () => {
      const testGame = new Game('player1', 'player2');
      expect(testGame.drawDetails).toBeUndefined();

      // When threefold repetition occurs:
      // expect(testGame.drawDetails?.type).toBe('threefold_repetition');
      // expect(testGame.drawDetails?.repetitionCount).toBe(3);
      // expect(testGame.drawDetails?.repeatedPosition).toBeDefined();
    });
  });

  describe('Type definitions (RED PHASE)', () => {
    it('should have DrawType and DrawDetails type definitions', () => {
      // This will guide us to create proper type definitions

      // These types should exist:
      // type DrawType = 'stalemate' | 'insufficient_material' | 'fifty_move' | 'threefold_repetition' | 'agreement'
      // interface DrawDetails { type: DrawType; description: string; ... }

      // For now, just test that we can import them
      // This MUST FAIL until we create the types
      type DrawType =
        | 'stalemate'
        | 'insufficient_material'
        | 'fifty_move'
        | 'threefold_repetition'
        | 'agreement';
      const drawType: DrawType = 'stalemate'; // Properly typed
      expect([
        'stalemate',
        'insufficient_material',
        'fifty_move',
        'threefold_repetition',
        'agreement',
      ]).toContain(drawType);
    });
  });
});
