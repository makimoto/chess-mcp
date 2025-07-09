import { describe, it, expect, beforeEach } from '@jest/globals';
import { ChessEngine } from '../../../src/core/chess/ChessEngine.js';
import {
  CHESS_POSITIONS,
  TEST_MOVES,
  createChessEngine,
  expectInitialPosition,
  expectMoveChangesPosition,
  expectGameState,
} from '../../helpers/index.js';
/**
 * Integration tests that verify ChessEngine works correctly with the actual chess.js library.
 * These tests focus on end-to-end functionality rather than unit-level wrapper logic.
 * For wrapper-specific logic (error handling, type conversion, etc.), see chess.engine.refactored.test.ts
 */
describe('ChessEngine Integration', () => {
  let engine;
  beforeEach(() => {
    engine = createChessEngine();
  });
  describe('Basic Integration', () => {
    it('should properly initialize and integrate with chess.js library', () => {
      expectInitialPosition(engine);
    });
    it('should execute a complete game sequence', () => {
      // Execute a short game sequence to verify end-to-end integration
      expect(engine.makeMove(TEST_MOVES.E4_ALG)).toBe(true);
      expect(engine.getTurn()).toBe('black');
      expect(engine.makeMove(TEST_MOVES.E5_ALG)).toBe(true);
      expect(engine.getTurn()).toBe('white');
      expect(engine.makeMove(TEST_MOVES.NF3_ALG)).toBe(true);
      expect(engine.getTurn()).toBe('black');
      const history = engine.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].san).toBe('e4');
      expect(history[1].san).toBe('e5');
      expect(history[2].san).toBe('Nf3');
    });
  });
  describe('Critical Game States', () => {
    it('should correctly handle checkmate detection', () => {
      // Load a known checkmate position
      expect(engine.loadFen(CHESS_POSITIONS.FOOLS_MATE)).toBe(true);
      expectGameState(engine, {
        isGameOver: true,
        isCheckmate: true,
        isCheck: true,
      });
    });
    it('should correctly handle stalemate detection', () => {
      // Load a known stalemate position
      expect(engine.loadFen(CHESS_POSITIONS.STALEMATE)).toBe(true);
      expectGameState(engine, {
        isGameOver: true,
        isStalemate: true,
        isCheck: false,
      });
    });
  });
  describe('Special Moves Integration', () => {
    it('should handle castling correctly', () => {
      // Set up position where castling is possible
      expect(engine.loadFen(CHESS_POSITIONS.CASTLING_READY)).toBe(true);
      // Verify castling moves are available
      const moves = engine.getLegalMoves();
      expect(moves).toContain('O-O');
      expect(moves).toContain('O-O-O');
      // Execute castling
      expect(engine.makeMove('O-O')).toBe(true);
    });
    it('should handle en passant correctly', () => {
      // Set up en passant position
      expect(engine.loadFen(CHESS_POSITIONS.EN_PASSANT)).toBe(true);
      // Verify en passant capture is possible
      expect(engine.isValidMove('exf6')).toBe(true);
      expect(engine.makeMove('exf6')).toBe(true);
    });
    it('should handle pawn promotion correctly', () => {
      // Set up promotion position
      expect(engine.loadFen(CHESS_POSITIONS.PROMOTION_READY)).toBe(true);
      // Verify promotion moves are available
      const moves = engine.getLegalMoves();
      expect(moves.some(move => move.includes('a8=Q'))).toBe(true);
      // Execute promotion
      expect(engine.makeMove('a8=Q')).toBe(true);
    });
  });
  describe('Position Management Integration', () => {
    it('should correctly load and reset positions', () => {
      // Load a different position
      expect(engine.loadFen(CHESS_POSITIONS.AFTER_E4)).toBe(true);
      expect(engine.getFen()).toBe(CHESS_POSITIONS.AFTER_E4);
      // Reset to starting position
      engine.reset();
      expectInitialPosition(engine);
    });
    it('should correctly handle undo operations', () => {
      expectMoveChangesPosition(engine, TEST_MOVES.E4_ALG);
      // Undo the move
      expect(engine.undo()).toBe(true);
      expectInitialPosition(engine);
    });
  });
  describe('PGN Integration', () => {
    it('should correctly handle PGN loading and generation', () => {
      // Load a game from PGN
      const testPgn = '1. e4 e5 2. Nf3 Nc6';
      expect(engine.loadPgn(testPgn)).toBe(true);
      // Verify the moves were loaded
      const history = engine.getHistory();
      expect(history).toHaveLength(4);
      expect(history[0].san).toBe('e4');
      expect(history[3].san).toBe('Nc6');
      // Generate PGN and verify it contains our moves
      const pgn = engine.getPgn();
      expect(pgn).toContain('1. e4 e5');
      expect(pgn).toContain('2. Nf3 Nc6');
    });
  });
  describe('Performance Integration', () => {
    it('should handle rapid move validation efficiently', () => {
      const startTime = Date.now();
      // Perform rapid validations
      for (let i = 0; i < 100; i++) {
        engine.isValidMove('e2', 'e4');
        engine.isValidMove('e4');
        engine.getLegalMoves();
      }
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(50); // Should be very fast with real library
    });
  });
});
//# sourceMappingURL=chess.engine.integration.test.js.map
