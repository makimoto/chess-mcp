import type {
  GameStatus,
  PlayerColor,
  GameResult,
  DrawType,
  TimeControlType,
} from '../constants/GameConstants';

export type { GameStatus, PlayerColor, GameResult, DrawType, TimeControlType };

export interface DrawDetails {
  type: DrawType;
  description: string;
  halfmoveClock?: number;
  movesUntilFiftyMove?: number;
  repetitionCount?: number;
  repeatedPosition?: string;
}

export interface TimeControl {
  type: TimeControlType;
  initialTime?: number; // seconds
  increment?: number; // seconds per move
}

export interface GameData {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string;
  fen: string;
  pgn: string;
  status: GameStatus;
  result?: GameResult | undefined;
  timeControl?: TimeControl | undefined;
  createdAt: Date;
  updatedAt: Date;
  lastMoveAt?: Date | undefined;
  whiteTimeRemaining?: number | undefined;
  blackTimeRemaining?: number | undefined;
  drawOfferFrom?: string | undefined;
  pauseRequestedBy?: string | undefined;
  invalidMoveCounts: { [playerId: string]: number };
  moveHistory: string[];
  positionHistory?: { [key: string]: number } | undefined;
}
