/**
 * Test helper functions for ChessEngine testing
 */
import { ChessEngine } from '../../src/core/chess/ChessEngine.js';
/**
 * Creates a fresh ChessEngine instance for testing
 */
export declare function createChessEngine(): ChessEngine;
/**
 * Creates a ChessEngine with a specific position
 */
export declare function createChessEngineWithPosition(fen: string): ChessEngine;
/**
 * Creates a ChessEngine after playing the opening e4 e5
 */
export declare function createEngineAfterE4E5(): ChessEngine;
/**
 * Creates a ChessEngine with standard opening moves played
 */
export declare function createEngineWithOpeningMoves(): ChessEngine;
/**
 * Helper to test basic move validation patterns
 */
export declare function expectValidMoves(
  engine: ChessEngine,
  moves: string[]
): void;
/**
 * Helper to test invalid move patterns
 */
export declare function expectInvalidMoves(
  engine: ChessEngine,
  moves: string[]
): void;
/**
 * Helper to verify initial chess position properties
 */
export declare function expectInitialPosition(engine: ChessEngine): void;
/**
 * Helper to test that a move changes the position
 */
export declare function expectMoveChangesPosition(
  engine: ChessEngine,
  move: string | [string, string]
): void;
/**
 * Helper to test that an invalid move doesn't change position
 */
export declare function expectMoveDoesNotChangePosition(
  engine: ChessEngine,
  move: string | [string, string]
): void;
/**
 * Helper to verify game state detection
 */
export declare function expectGameState(
  engine: ChessEngine,
  expectations: {
    isGameOver?: boolean;
    isCheckmate?: boolean;
    isStalemate?: boolean;
    isCheck?: boolean;
  }
): void;
/**
 * Helper to verify piece information
 */
export declare function expectPieceAt(
  engine: ChessEngine,
  square: string,
  expectedPiece: {
    type: string;
    color: string;
  } | null
): void;
/**
 * Helper to verify move history length and content
 */
export declare function expectMoveHistory(
  engine: ChessEngine,
  expectedLength: number,
  expectedMoves?: string[]
): void;
/**
 * Helper to test performance requirements
 */
export declare function expectPerformance(
  operation: () => void,
  maxTimeMs: number,
  iterations?: number
): void;
//# sourceMappingURL=chess-test-helpers.d.ts.map
