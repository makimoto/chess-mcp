/**
 * Chess game constants and enums
 * Centralizes all magic strings to ensure consistency across the codebase
 */

// Game Status Constants
export const GAME_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
} as const;

export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];

// Player Color Constants
export const PLAYER_COLOR = {
  WHITE: 'white',
  BLACK: 'black',
} as const;

export type PlayerColor = (typeof PLAYER_COLOR)[keyof typeof PLAYER_COLOR];

// Game Result Constants (PGN format)
export const GAME_RESULT = {
  WHITE_WINS: '1-0',
  BLACK_WINS: '0-1',
  DRAW: '1/2-1/2',
} as const;

export type GameResult = (typeof GAME_RESULT)[keyof typeof GAME_RESULT];

// Alternative Game Result Constants (for web API)
export const GAME_RESULT_WEB = {
  WHITE_WINS: 'white_wins',
  BLACK_WINS: 'black_wins',
  DRAW: 'draw',
} as const;

export type GameResultWeb =
  (typeof GAME_RESULT_WEB)[keyof typeof GAME_RESULT_WEB];

// Draw Type Constants
export const DRAW_TYPE = {
  STALEMATE: 'stalemate',
  INSUFFICIENT_MATERIAL: 'insufficient_material',
  FIFTY_MOVE: 'fifty_move',
  THREEFOLD_REPETITION: 'threefold_repetition',
  AGREEMENT: 'agreement',
} as const;

export type DrawType = (typeof DRAW_TYPE)[keyof typeof DRAW_TYPE];

// Time Control Constants
export const TIME_CONTROL_TYPE = {
  UNLIMITED: 'unlimited',
  FIXED: 'fixed',
  FISCHER: 'fischer',
} as const;

export type TimeControlType =
  (typeof TIME_CONTROL_TYPE)[keyof typeof TIME_CONTROL_TYPE];

// Chess positions constants
export const INITIAL_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Game ending reasons
export const GAME_END_REASON = {
  CHECKMATE: 'checkmate',
  STALEMATE: 'stalemate',
  DRAW_AGREEMENT: 'draw_agreement',
  RESIGNATION: 'resignation',
  TIMEOUT: 'timeout',
  INSUFFICIENT_MATERIAL: 'insufficient_material',
  FIFTY_MOVE_RULE: 'fifty_move_rule',
  THREEFOLD_REPETITION: 'threefold_repetition',
} as const;

export type GameEndReason =
  (typeof GAME_END_REASON)[keyof typeof GAME_END_REASON];

// Convert between different result formats
export const convertResultToWeb = (result: GameResult): GameResultWeb => {
  switch (result) {
    case GAME_RESULT.WHITE_WINS:
      return GAME_RESULT_WEB.WHITE_WINS;
    case GAME_RESULT.BLACK_WINS:
      return GAME_RESULT_WEB.BLACK_WINS;
    case GAME_RESULT.DRAW:
      return GAME_RESULT_WEB.DRAW;
    default: {
      const exhaustiveCheck: never = result;
      return exhaustiveCheck;
    }
  }
};

export const convertResultFromWeb = (result: GameResultWeb): GameResult => {
  switch (result) {
    case GAME_RESULT_WEB.WHITE_WINS:
      return GAME_RESULT.WHITE_WINS;
    case GAME_RESULT_WEB.BLACK_WINS:
      return GAME_RESULT.BLACK_WINS;
    case GAME_RESULT_WEB.DRAW:
      return GAME_RESULT.DRAW;
    default: {
      const exhaustiveCheck: never = result;
      return exhaustiveCheck;
    }
  }
};
