import { Chess } from 'chess.js';
import type { PlayerColor } from '../../types/game.types.js';
import {
  playerColorToChessJS,
  isValidSquare,
  type ChessJSColor,
  type Move,
} from '../../types/chess.internal.types.js';

export interface MoveDetail {
  san: string;
  from: string;
  to: string;
  piece: string;
  captured?: string | undefined;
  promotion?: string | undefined;
  flags: string;
}

export class ChessEngine {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  /**
   * Get the current FEN string representation of the position
   */
  getFen(): string {
    return this.chess.fen();
  }

  /**
   * Get the current player to move
   */
  getTurn(): PlayerColor {
    return this.chess.turn() === 'w' ? 'white' : 'black';
  }

  /**
   * Get the move history
   */
  getHistory(): MoveDetail[] {
    return this.chess.history({ verbose: true }).map(move => ({
      san: move.san,
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: move.captured ?? undefined,
      promotion: move.promotion ?? undefined,
      flags: move.flags,
    }));
  }

  /**
   * Check if the game is over
   */
  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /**
   * Check if the current position is checkmate
   */
  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  /**
   * Check if the current position is stalemate
   */
  isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  /**
   * Check if the current player is in check
   */
  isCheck(): boolean {
    return this.chess.inCheck();
  }

  /**
   * Check if the game is a draw by insufficient material
   */
  isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  /**
   * Check if the game is a draw by threefold repetition
   */
  isThreefoldRepetition(): boolean {
    return this.chess.isThreefoldRepetition();
  }

  /**
   * Get the halfmove clock (moves since last pawn move or capture)
   */
  getHalfmoveClock(): number {
    const fenParts = this.chess.fen().split(' ');
    const halfmovePart = fenParts[4];
    if (!halfmovePart) {
      return 0;
    }
    return parseInt(halfmovePart, 10);
  }

  /**
   * Check if the game would be a draw by 50-move rule
   */
  isFiftyMoveRule(): boolean {
    return this.getHalfmoveClock() >= 100; // 100 half-moves = 50 full moves
  }

  /**
   * Validate a move without executing it
   * Supports both coordinate notation (e2, e4) and algebraic notation (e4)
   */
  isValidMove(from: string, to?: string): boolean {
    try {
      if (to) {
        // Coordinate notation: from square, to square
        if (!isValidSquare(from) || !isValidSquare(to)) {
          return false;
        }
        const moves = this.chess.moves({ square: from, verbose: true });
        return moves.some((move: Move) => move.to === to);
      } else {
        // Algebraic notation: single string
        const moves = this.chess.moves();
        return moves.includes(from);
      }
    } catch {
      return false;
    }
  }

  /**
   * Execute a move
   * Supports both coordinate notation (e2, e4) and algebraic notation (e4)
   */
  makeMove(from: string, to?: string): boolean {
    try {
      let moveResult;

      if (to) {
        // Coordinate notation
        moveResult = this.chess.move({ from, to });
      } else {
        // Algebraic notation
        moveResult = this.chess.move(from);
      }

      return moveResult !== null;
    } catch {
      return false;
    }
  }

  /**
   * Execute a move and return the Standard Algebraic Notation (SAN)
   * Supports both coordinate notation (e2, e4) and algebraic notation (e4)
   */
  makeMoveAndGetSan(from: string, to?: string): string | null {
    try {
      let moveResult;

      if (to) {
        // Coordinate notation
        moveResult = this.chess.move({ from, to });
      } else {
        // Algebraic notation
        moveResult = this.chess.move(from);
      }

      return moveResult ? moveResult.san : null;
    } catch {
      return null;
    }
  }

  /**
   * Validate a move without executing it
   */
  validateMove(
    from: string,
    to?: string
  ): { valid: boolean; reason?: string; suggestion?: string } {
    // Create a copy of current position to test the move
    const testChess = new Chess(this.chess.fen());
    let moveResult = null;

    try {
      if (to) {
        // Coordinate notation
        moveResult = testChess.move({ from, to });
      } else {
        // Algebraic notation
        moveResult = testChess.move(from);
      }
    } catch (error) {
      // If move() throws an error, treat as invalid notation
      return {
        valid: false,
        reason: `Invalid notation: ${error instanceof Error ? error.message : String(error)}`,
        suggestion: 'Use algebraic notation (e.g., e2e4, Nf3) or UCI format',
      };
    }

    if (moveResult !== null) {
      return { valid: true };
    } else {
      // Move failed - try to get legal moves to provide suggestion
      const legalMoves = this.chess.moves();
      const suggestion =
        legalMoves.length > 0
          ? `Try one of: ${legalMoves.slice(0, 5).join(', ')}${legalMoves.length > 5 ? '...' : ''}`
          : 'No legal moves available';

      return {
        valid: false,
        reason: `Move "${to ? from + to : from}" is not legal in current position`,
        suggestion: suggestion,
      };
    }
  }

  /**
   * Load a position from FEN string
   */
  loadFen(fen: string): boolean {
    try {
      this.chess.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reset the position to the starting position
   */
  reset(): void {
    this.chess.reset();
  }

  /**
   * Get all legal moves for the current position
   */
  getLegalMoves(): string[] {
    return this.chess.moves();
  }

  /**
   * Get all legal moves in UCI format
   */
  getLegalMovesUCI(): string[] {
    return this.chess.moves({ verbose: true }).map(move => {
      let uci = move.from + move.to;
      if (move.promotion) {
        uci += move.promotion;
      }
      return uci;
    });
  }

  /**
   * Get all legal moves from a specific square
   */
  getLegalMovesFrom(square: string): string[] {
    try {
      if (!isValidSquare(square)) {
        return [];
      }
      return this.chess.moves({ square });
    } catch {
      return [];
    }
  }

  /**
   * Get the current position as ASCII art (useful for debugging)
   */
  ascii(): string {
    return this.chess.ascii();
  }

  /**
   * Get PGN string representation of the game
   */
  getPgn(): string {
    return this.chess.pgn();
  }

  /**
   * Load a game from PGN string
   */
  loadPgn(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get PGN headers
   */
  getHeaders(): Record<string, string> {
    try {
      const headers = this.chess.header();
      // Filter out null values to ensure all values are strings
      const filteredHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(headers)) {
        if (value !== null) {
          filteredHeaders[key] = value;
        }
      }
      return filteredHeaders;
    } catch {
      return {};
    }
  }

  /**
   * Set PGN headers
   */
  setHeaders(headers: Record<string, string>): void {
    try {
      for (const [key, value] of Object.entries(headers)) {
        this.chess.header(key, value);
      }
    } catch {
      // Ignore errors when setting headers
    }
  }

  /**
   * Get move history as array of moves
   */
  getMoves(): string[] {
    return this.chess.history();
  }

  /**
   * Undo the last move
   */
  undo(): boolean {
    const undoResult = this.chess.undo();
    return undoResult !== null;
  }

  /**
   * Get the piece at a specific square
   */
  getPiece(square: string): { type: string; color: string } | null {
    try {
      if (!isValidSquare(square)) {
        return null;
      }
      const piece = this.chess.get(square);
      return piece || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if a square is attacked by the opponent
   */
  isSquareAttacked(square: string, by?: PlayerColor): boolean {
    try {
      if (!isValidSquare(square)) {
        return false;
      }

      const color: ChessJSColor = by
        ? playerColorToChessJS(by)
        : this.chess.turn() === 'w'
          ? 'b'
          : 'w';

      return this.chess.isAttacked(square, color);
    } catch {
      return false;
    }
  }

  // Test helper method (only for testing)
  public getChessInstance(): Chess {
    return this.chess;
  }
}
