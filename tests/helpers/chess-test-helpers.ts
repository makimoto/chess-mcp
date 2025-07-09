/**
 * Test helper functions for ChessEngine testing
 */

import { expect } from '@jest/globals';
import { ChessEngine } from '../../src/core/chess/ChessEngine.js';
import { CHESS_POSITIONS, TEST_MOVES } from './test-constants.js';

/**
 * Creates a fresh ChessEngine instance for testing
 */
export function createChessEngine(): ChessEngine {
  return new ChessEngine();
}

/**
 * Creates a ChessEngine with a specific position
 */
export function createChessEngineWithPosition(fen: string): ChessEngine {
  const engine = new ChessEngine();
  engine.loadFen(fen);
  return engine;
}

/**
 * Creates a ChessEngine after playing the opening e4 e5
 */
export function createEngineAfterE4E5(): ChessEngine {
  const engine = new ChessEngine();
  engine.makeMove(TEST_MOVES.E4_ALG);
  engine.makeMove(TEST_MOVES.E5_ALG);
  return engine;
}

/**
 * Creates a ChessEngine with standard opening moves played
 */
export function createEngineWithOpeningMoves(): ChessEngine {
  const engine = new ChessEngine();
  engine.makeMove(TEST_MOVES.E4_ALG);
  engine.makeMove(TEST_MOVES.E5_ALG);
  engine.makeMove(TEST_MOVES.NF3_ALG);
  return engine;
}

/**
 * Helper to test basic move validation patterns
 */
export function expectValidMoves(engine: ChessEngine, moves: string[]): void {
  moves.forEach(move => {
    expect(engine.isValidMove(move)).toBe(true);
  });
}

/**
 * Helper to test invalid move patterns
 */
export function expectInvalidMoves(engine: ChessEngine, moves: string[]): void {
  moves.forEach(move => {
    expect(engine.isValidMove(move)).toBe(false);
  });
}

/**
 * Helper to verify initial chess position properties
 */
export function expectInitialPosition(engine: ChessEngine): void {
  expect(engine.getFen()).toBe(CHESS_POSITIONS.STARTING_POSITION);
  expect(engine.getTurn()).toBe('white');
  expect(engine.getHistory()).toEqual([]);
  expect(engine.isGameOver()).toBe(false);
}

/**
 * Helper to test that a move changes the position
 */
export function expectMoveChangesPosition(
  engine: ChessEngine,
  move: string | [string, string]
): void {
  const initialFen = engine.getFen();
  const initialTurn = engine.getTurn();

  let success: boolean;
  if (Array.isArray(move)) {
    success = engine.makeMove(move[0], move[1]);
  } else {
    success = engine.makeMove(move);
  }

  expect(success).toBe(true);
  expect(engine.getFen()).not.toBe(initialFen);
  expect(engine.getTurn()).toBe(initialTurn === 'white' ? 'black' : 'white');
}

/**
 * Helper to test that an invalid move doesn't change position
 */
export function expectMoveDoesNotChangePosition(
  engine: ChessEngine,
  move: string | [string, string]
): void {
  const initialFen = engine.getFen();
  const initialTurn = engine.getTurn();

  let success: boolean;
  if (Array.isArray(move)) {
    success = engine.makeMove(move[0], move[1]);
  } else {
    success = engine.makeMove(move);
  }

  expect(success).toBe(false);
  expect(engine.getFen()).toBe(initialFen);
  expect(engine.getTurn()).toBe(initialTurn);
}

/**
 * Helper to verify game state detection
 */
export function expectGameState(
  engine: ChessEngine,
  expectations: {
    isGameOver?: boolean;
    isCheckmate?: boolean;
    isStalemate?: boolean;
    isCheck?: boolean;
  }
): void {
  if (expectations.isGameOver !== undefined) {
    expect(engine.isGameOver()).toBe(expectations.isGameOver);
  }
  if (expectations.isCheckmate !== undefined) {
    expect(engine.isCheckmate()).toBe(expectations.isCheckmate);
  }
  if (expectations.isStalemate !== undefined) {
    expect(engine.isStalemate()).toBe(expectations.isStalemate);
  }
  if (expectations.isCheck !== undefined) {
    expect(engine.isCheck()).toBe(expectations.isCheck);
  }
}

/**
 * Helper to verify piece information
 */
export function expectPieceAt(
  engine: ChessEngine,
  square: string,
  expectedPiece: { type: string; color: string } | null
): void {
  const piece = engine.getPiece(square);
  expect(piece).toEqual(expectedPiece);
}

/**
 * Helper to verify move history length and content
 */
export function expectMoveHistory(
  engine: ChessEngine,
  expectedLength: number,
  expectedMoves?: string[]
): void {
  const history = engine.getHistory();
  expect(history).toHaveLength(expectedLength);

  if (expectedMoves) {
    expectedMoves.forEach((move, index) => {
      expect(history[index]).toEqual(expect.objectContaining({ san: move }));
    });
  }
}

/**
 * Helper to test performance requirements
 */
export function expectPerformance(
  operation: () => void,
  maxTimeMs: number,
  iterations: number = 1000
): void {
  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    operation();
  }

  const elapsed = Date.now() - startTime;
  expect(elapsed).toBeLessThan(maxTimeMs);
}
