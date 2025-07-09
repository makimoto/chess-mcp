/**
 * Mock factory for chess.js types
 * Provides complete mock objects that satisfy TypeScript strict typing
 */

import type { Move, Piece, Color, PieceSymbol, Square } from 'chess.js';

/**
 * Creates a mock Move object with required properties for testing
 */
export function createMockMove(overrides: Partial<Move> = {}): Move {
  const defaultMove = {
    color: 'w' as Color,
    from: 'e2' as Square,
    to: 'e4' as Square,
    piece: 'p' as PieceSymbol,
    captured: undefined,
    promotion: undefined,
    flags: 'n',
    san: 'e4',
    lan: 'e2e4',
    before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    // Mock methods for Move class
    isCapture: () => !!defaultMove.captured,
    isPromotion: () => !!defaultMove.promotion,
    isEnPassant: () => false,
    isKingsideCastle: () => false,
    isQueensideCastle: () => false,
    isBigPawn: () => false,
  };

  return { ...defaultMove, ...overrides } as Move;
}

/**
 * Creates a complete mock Piece object
 */
export function createMockPiece(overrides: Partial<Piece> = {}): Piece {
  const defaultPiece: Piece = {
    color: 'w' as Color,
    type: 'p' as PieceSymbol,
  };

  return { ...defaultPiece, ...overrides };
}

/**
 * Creates an array of mock Move objects for history testing
 */
export function createMockMoveHistory(moves: Partial<Move>[] = []): Move[] {
  const defaultMoves: Partial<Move>[] = [
    { san: 'e4', from: 'e2' as Square, to: 'e4' as Square, piece: 'p' },
    {
      san: 'e5',
      from: 'e7' as Square,
      to: 'e5' as Square,
      piece: 'p',
      color: 'b',
    },
    { san: 'Nf3', from: 'g1' as Square, to: 'f3' as Square, piece: 'n' },
  ];

  const movesToCreate = moves.length > 0 ? moves : defaultMoves;
  return movesToCreate.map(move => createMockMove(move));
}

/**
 * Mock factory for test scenarios
 */
export const MockFactories = {
  // Common move scenarios
  pawnMove: () =>
    createMockMove({
      san: 'e4',
      piece: 'p',
      from: 'e2' as Square,
      to: 'e4' as Square,
    }),

  knightMove: () =>
    createMockMove({
      san: 'Nf3',
      piece: 'n',
      from: 'g1' as Square,
      to: 'f3' as Square,
    }),

  captureMove: () =>
    createMockMove({
      san: 'exd5',
      piece: 'p',
      captured: 'p' as PieceSymbol,
      from: 'e4' as Square,
      to: 'd5' as Square,
    }),

  // Common piece scenarios
  whitePawn: () => createMockPiece({ color: 'w', type: 'p' }),
  blackKnight: () => createMockPiece({ color: 'b', type: 'n' }),

  // Null/undefined scenarios for error testing
  nullPiece: () => null as Piece | null,
  undefinedPiece: () => undefined as Piece | undefined,
};
