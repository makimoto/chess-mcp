import type { Square, Move } from 'chess.js';
import type { PlayerColor } from './game.types.js';

// Export chess.js types for use in other modules
export type { Square, Move };

// Internal type mappings for chess.js integration
export type ChessJSColor = 'w' | 'b';

// Type conversion utilities
export const playerColorToChessJS = (color: PlayerColor): ChessJSColor =>
  color === 'white' ? 'w' : 'b';

// Square validation utility with type guard
export const isValidSquare = (square: string): square is Square => {
  return /^[a-h][1-8]$/.test(square);
};
