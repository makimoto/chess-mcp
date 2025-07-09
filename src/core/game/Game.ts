import { v4 as uuidv4 } from 'uuid';
import type {
  GameStatus,
  PlayerColor,
  GameResult,
  TimeControl,
  GameData,
  DrawDetails,
} from '../../types/game.types.js';
import {
  GAME_STATUS,
  PLAYER_COLOR,
  GAME_RESULT,
  INITIAL_FEN,
  DRAW_TYPE,
} from '../../constants/GameConstants.js';
import { ChessEngine } from '../chess/ChessEngine.js';

/**
 * Represents a chess game with complete game state management, move validation, and rule enforcement.
 *
 * This class encapsulates all aspects of a chess game including:
 * - Game state (position, status, turn)
 * - Move validation and execution
 * - Draw detection and handling
 * - Time control management
 * - Game serialization and persistence
 * - Position history tracking for threefold repetition
 *
 * @example
 * ```typescript
 * const game = new Game('player1', 'player2');
 * game.makeMove('e2e4');
 * game.makeMove('e7e5');
 * console.log(game.status); // 'active'
 * console.log(game.currentTurn); // 'white'
 * ```
 */
export class Game {
  public readonly id: string;
  public readonly whitePlayerId: string;
  public readonly blackPlayerId: string;
  public readonly createdAt: Date;

  private _fen: string;
  private _pgn: string;
  private _status: GameStatus;
  private _currentTurn: PlayerColor;
  private _result?: GameResult;
  private _drawDetails?: DrawDetails;
  private _timeControl?: TimeControl | undefined;
  private _updatedAt: Date;
  private _lastMoveAt?: Date;
  private _whiteTimeRemaining?: number;
  private _blackTimeRemaining?: number;
  private _drawOfferFrom?: string;
  private _pauseRequestedBy?: string;
  private _invalidMoveCounts: { [playerId: string]: number };
  private _moveHistory: string[];
  private _chessEngine: ChessEngine;
  private _positionHistory: Map<string, number>;

  /**
   * Creates a new chess game between two players.
   *
   * @param whitePlayerId - Unique identifier for the white player
   * @param blackPlayerId - Unique identifier for the black player
   * @param timeControl - Optional time control configuration for the game
   *
   * @example
   * ```typescript
   * // Create a game without time control
   * const game = new Game('alice', 'bob');
   *
   * // Create a game with Fischer time control (5 minutes + 3 seconds per move)
   * const timedGame = new Game('alice', 'bob', {
   *   type: 'fischer',
   *   initialTime: 300,
   *   increment: 3
   * });
   * ```
   */
  constructor(
    whitePlayerId: string,
    blackPlayerId: string,
    timeControl?: TimeControl
  ) {
    this.id = uuidv4();
    this.whitePlayerId = whitePlayerId;
    this.blackPlayerId = blackPlayerId;
    this.createdAt = new Date();

    // Initialize game state
    this._fen = INITIAL_FEN;
    this._pgn = '';
    this._status = GAME_STATUS.ACTIVE;
    this._currentTurn = PLAYER_COLOR.WHITE;
    this._timeControl = timeControl ?? undefined;
    this._updatedAt = new Date();
    this._invalidMoveCounts = {};
    this._moveHistory = [];
    this._chessEngine = new ChessEngine();
    this._positionHistory = new Map<string, number>();

    // Track initial position
    const initialPositionKey = this.getPositionKey(INITIAL_FEN);
    this._positionHistory.set(initialPositionKey, 1);

    // Initialize time controls if provided
    if (timeControl && timeControl.initialTime) {
      this._whiteTimeRemaining = timeControl.initialTime;
      this._blackTimeRemaining = timeControl.initialTime;
    }
  }

  // Getters for immutable access
  get fen(): string {
    return this._fen;
  }

  get pgn(): string {
    return this._pgn;
  }

  /**
   * Returns a visual ASCII representation of the current board position.
   *
   * @returns A string containing the ASCII art representation of the chess board
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * console.log(game.getAsciiBoard());
   * // Outputs:
   * //    +------------------------+
   * //  8 | r  n  b  q  k  b  n  r |
   * //  7 | p  p  p  p  p  p  p  p |
   * //  ...
   * ```
   */
  getAsciiBoard(): string {
    this._chessEngine.loadFen(this._fen);
    return this._chessEngine.ascii();
  }

  get status(): GameStatus {
    return this._status;
  }

  get currentTurn(): PlayerColor {
    return this._currentTurn;
  }

  get result(): GameResult | undefined {
    return this._result;
  }

  get drawDetails(): DrawDetails | undefined {
    return this._drawDetails;
  }

  get timeControl(): TimeControl | undefined {
    return this._timeControl;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lastMoveAt(): Date | undefined {
    return this._lastMoveAt;
  }

  get whiteTimeRemaining(): number | undefined {
    return this._whiteTimeRemaining;
  }

  get blackTimeRemaining(): number | undefined {
    return this._blackTimeRemaining;
  }

  get drawOfferFrom(): string | undefined {
    return this._drawOfferFrom;
  }

  get pauseRequestedBy(): string | undefined {
    return this._pauseRequestedBy;
  }

  get invalidMoveCounts(): { [playerId: string]: number } {
    return { ...this._invalidMoveCounts };
  }

  get moveHistory(): string[] {
    return [...this._moveHistory];
  }

  // State mutation methods
  /**
   * Completes the game with the specified result.
   *
   * @param result - The final result of the game ('1-0', '0-1', or '1/2-1/2')
   * @throws {Error} If the game is already completed
   *
   * @example
   * ```typescript
   * game.completeGame('1-0'); // White wins
   * game.completeGame('0-1'); // Black wins
   * game.completeGame('1/2-1/2'); // Draw
   * ```
   */
  public completeGame(result: GameResult): void {
    if (this._status === GAME_STATUS.COMPLETED) {
      throw new Error('Game is already completed');
    }
    this._status = GAME_STATUS.COMPLETED;
    this._result = result;
    this._updatedAt = new Date();
  }

  public updateStatus(status: GameStatus): void {
    this._status = status;
    this._updatedAt = new Date();
  }

  private getPositionKey(fen: string): string {
    // Extract position part of FEN (ignore move counters)
    const parts = fen.split(' ');
    return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
  }

  private updatePositionHistory(fen: string): number {
    const positionKey = this.getPositionKey(fen);
    const count = (this._positionHistory.get(positionKey) || 0) + 1;
    this._positionHistory.set(positionKey, count);
    return count;
  }

  public getPositionRepetitionCount(): number {
    const currentPositionKey = this.getPositionKey(this._fen);
    return this._positionHistory.get(currentPositionKey) || 0;
  }

  public getDrawStatus(): {
    halfmoveClock: number;
    movesUntilFiftyMove: number;
    repetitionCount: number;
    isApproachingFiftyMove: boolean;
    isApproachingRepetition: boolean;
  } | null {
    if (this._status !== GAME_STATUS.ACTIVE) {
      return null;
    }

    this._chessEngine.loadFen(this._fen);
    const halfmoveClock = this._chessEngine.getHalfmoveClock();
    const movesUntilFiftyMove = 50 - Math.floor(halfmoveClock / 2);
    const repetitionCount = this.getPositionRepetitionCount();

    return {
      halfmoveClock,
      movesUntilFiftyMove,
      repetitionCount,
      isApproachingFiftyMove: halfmoveClock >= 80, // 40+ moves
      isApproachingRepetition: repetitionCount >= 2,
    };
  }

  /**
   * Pauses an active chess game.
   *
   * @param requestedBy - Player ID of the player requesting the pause
   * @throws {Error} If game is not active or player is not in the game
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * game.pauseGame('alice'); // Alice requests pause
   * console.log(game.status); // 'paused'
   * ```
   */
  public pauseGame(requestedBy: string): void {
    if (this._status === GAME_STATUS.COMPLETED) {
      throw new Error('Cannot pause completed game');
    }
    if (this._status === GAME_STATUS.PAUSED) {
      throw new Error('Game is already paused');
    }
    if (this._status !== GAME_STATUS.ACTIVE) {
      throw new Error('Can only pause active games');
    }

    // Validate that the requestedBy is a player in this game
    if (
      requestedBy !== this.whitePlayerId &&
      requestedBy !== this.blackPlayerId
    ) {
      throw new Error('You are not a player in this game');
    }

    this._status = GAME_STATUS.PAUSED;
    this._pauseRequestedBy = requestedBy;
    this._updatedAt = new Date();
  }

  /**
   * Resumes a paused chess game.
   *
   * @throws {Error} If game is not paused or is completed
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * game.pauseGame('alice');
   * game.resumeGame();
   * console.log(game.status); // 'active'
   * ```
   */
  public resumeGame(): void {
    if (this._status === GAME_STATUS.COMPLETED) {
      throw new Error('Cannot resume completed game');
    }
    if (this._status !== GAME_STATUS.PAUSED) {
      throw new Error('Game is not paused');
    }
    this._status = GAME_STATUS.ACTIVE;
    delete this._pauseRequestedBy;
    this._updatedAt = new Date();
  }

  /**
   * Resigns the game for the specified player.
   *
   * @param playerId - The player ID of the player who is resigning
   * @throws {Error} If game is not active or player is not in the game
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * game.resignGame('alice'); // Alice resigns, Bob wins
   * console.log(game.result); // '0-1' (Black wins)
   * ```
   */
  public resignGame(playerId: string): void {
    if (this._status !== GAME_STATUS.ACTIVE) {
      throw new Error('Can only resign active games');
    }
    if (playerId !== this.whitePlayerId && playerId !== this.blackPlayerId) {
      throw new Error('Player not in this game');
    }

    // Determine result based on who resigned
    const result: GameResult =
      playerId === this.whitePlayerId
        ? GAME_RESULT.BLACK_WINS
        : GAME_RESULT.WHITE_WINS;
    this.completeGame(result);
  }

  /**
   * Offers a draw to the opponent.
   *
   * @param playerId - The player ID of the player offering the draw
   * @throws {Error} If game is not active or player is not in the game
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * game.offerDraw('alice'); // Alice offers a draw
   * console.log(game.drawOfferFrom); // 'alice'
   * ```
   */
  public offerDraw(playerId: string): void {
    if (this._status !== GAME_STATUS.ACTIVE) {
      throw new Error('Can only offer draw in active games');
    }
    if (playerId !== this.whitePlayerId && playerId !== this.blackPlayerId) {
      throw new Error('Player not in this game');
    }

    this._drawOfferFrom = playerId;
    this._updatedAt = new Date();
  }

  /**
   * Accepts a pending draw offer.
   *
   * @param playerId - The player ID of the player accepting the draw
   * @throws {Error} If no draw offer exists, game is not active, or invalid player
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * game.offerDraw('alice');
   * game.acceptDraw('bob'); // Bob accepts Alice's draw offer
   * console.log(game.result); // '1/2-1/2' (Draw)
   * ```
   */
  public acceptDraw(playerId: string): void {
    if (this._status !== GAME_STATUS.ACTIVE) {
      throw new Error('Can only accept draw in active games');
    }
    if (!this._drawOfferFrom) {
      throw new Error('No draw offer to accept');
    }
    if (playerId !== this.whitePlayerId && playerId !== this.blackPlayerId) {
      throw new Error('Player not in this game');
    }
    if (playerId === this._drawOfferFrom) {
      throw new Error('Cannot accept your own draw offer');
    }

    this._drawDetails = {
      type: DRAW_TYPE.AGREEMENT,
      description: 'Draw by mutual agreement',
    };
    this.completeGame(GAME_RESULT.DRAW);
  }

  /**
   * Declines a pending draw offer.
   *
   * @throws {Error} If no draw offer exists
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * game.offerDraw('alice');
   * game.declineDraw(); // Draw offer is declined
   * console.log(game.drawOfferFrom); // undefined
   * ```
   */
  public declineDraw(): void {
    if (!this._drawOfferFrom) {
      throw new Error('No draw offer to decline');
    }

    delete this._drawOfferFrom;
    this._updatedAt = new Date();
  }

  /**
   * Validates a chess move without executing it.
   *
   * @param move - The move to validate in algebraic notation (e.g., 'e2e4', 'Nf3')
   * @returns Validation result with details about move validity
   * @returns result.valid - Whether the move is legal
   * @returns result.reason - Explanation if move is invalid
   * @returns result.suggestion - Suggested correction or alternative
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   *
   * const result = game.validateMove('e2e4');
   * if (result.valid) {
   *   game.makeMove('e2e4');
   * } else {
   *   console.log(`Invalid move: ${result.reason}`);
   *   console.log(`Suggestion: ${result.suggestion}`);
   * }
   * ```
   */
  public validateMove(move: string): {
    valid: boolean;
    reason?: string;
    suggestion?: string;
  } {
    if (this._status === GAME_STATUS.PAUSED) {
      return {
        valid: false,
        reason: 'Game is paused',
        suggestion: 'Resume the game to make moves',
      };
    }
    if (this._status !== GAME_STATUS.ACTIVE) {
      return {
        valid: false,
        reason: 'Cannot validate moves in inactive games',
        suggestion: 'Game must be active to validate moves',
      };
    }

    // Load current position into chess engine
    this._chessEngine.loadFen(this._fen);

    // Validate the move using chess engine
    return this._chessEngine.validateMove(move);
  }

  /**
   * Executes a chess move and updates the game state.
   *
   * This method handles the complete move execution process including:
   * - Move validation and legal move checking
   * - Position update and turn switching
   * - Game end detection (checkmate, stalemate, draw)
   * - Move history and position tracking
   *
   * @param move - The move in algebraic notation (e.g., 'e2e4', 'Nf3', 'O-O')
   * @throws {Error} If the move is invalid or game is not in an active state
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * game.makeMove('e2e4');     // Pawn to e4
   * game.makeMove('e7e5');     // Black responds
   * game.makeMove('Nf3');      // Knight to f3
   * game.makeMove('Nc6');      // Black knight
   * game.makeMove('Bb5');      // Bishop to b5 (Ruy Lopez)
   * ```
   */
  public makeMove(move: string): void {
    this.validateMoveConditions();

    const sanMove = this.executeMoveOnEngine(move);

    this.updateGameStateAfterMove(sanMove);

    this.checkAndHandleGameEnd();
  }

  private validateMoveConditions(): void {
    if (this._status === GAME_STATUS.PAUSED) {
      throw new Error('Game is paused');
    }
    if (this._status !== GAME_STATUS.ACTIVE) {
      throw new Error('Cannot make moves in inactive games');
    }
  }

  private executeMoveOnEngine(move: string): string {
    // Load current position into chess engine
    this._chessEngine.loadFen(this._fen);

    // Execute the move and get Standard Algebraic Notation (SAN)
    const sanMove = this._chessEngine.makeMoveAndGetSan(move);
    if (!sanMove) {
      throw new Error(`Invalid move: ${move}`);
    }

    return sanMove;
  }

  private updateGameStateAfterMove(sanMove: string): void {
    // Update game state
    this._fen = this._chessEngine.getFen();
    this._pgn = this._chessEngine.getPgn();
    this._currentTurn = this._chessEngine.getTurn();
    this._moveHistory.push(sanMove);
    this._lastMoveAt = new Date();
    this._updatedAt = new Date();

    // Update position history
    this.updatePositionHistory(this._fen);
  }

  private checkAndHandleGameEnd(): void {
    // Check for game end conditions
    if (this._chessEngine.isGameOver()) {
      const result = this.determineGameResult();
      this.completeGame(result);
    }
  }

  private determineGameResult(): GameResult {
    if (this._chessEngine.isCheckmate()) {
      // Checkmate: the side that just moved wins
      return this._currentTurn === PLAYER_COLOR.WHITE
        ? GAME_RESULT.WHITE_WINS
        : GAME_RESULT.BLACK_WINS;
    } else {
      return GAME_RESULT.DRAW; // Draw (stalemate, insufficient material, etc.)
    }
  }

  /**
   * Gets all legal moves available in the current position.
   *
   * @returns Array of legal moves in algebraic notation
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * const moves = game.getLegalMoves();
   * console.log(moves); // ['a3', 'a4', 'b3', 'b4', ..., 'Nf3', 'Nh3']
   * ```
   */
  public getLegalMoves(): string[] {
    // Load current position into chess engine
    this._chessEngine.loadFen(this._fen);
    return this._chessEngine.getLegalMoves();
  }

  /**
   * Gets all legal moves available from a specific square.
   *
   * @param square - The square to get moves from (e.g., 'e2', 'g1')
   * @returns Array of legal moves from the specified square
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * const knightMoves = game.getLegalMovesFrom('g1');
   * console.log(knightMoves); // ['Nf3', 'Nh3']
   * ```
   */
  public getLegalMovesFrom(square: string): string[] {
    // Load current position into chess engine
    this._chessEngine.loadFen(this._fen);
    return this._chessEngine.getLegalMovesFrom(square);
  }

  public getMoveHistory(
    format?: 'algebraic' | 'UCI' | 'verbose' | 'with_fen' | 'detailed'
  ):
    | string[]
    | Array<{
        moveNumber: number;
        player: string;
        move: string;
        timestamp?: Date | undefined;
      }>
    | Array<{
        moveNumber: number;
        move: string;
        fen: string;
      }>
    | Array<{
        moveNumber: number;
        move: string;
        fen: string;
        check: boolean;
        capture: boolean;
        castling: boolean;
      }> {
    const requestedFormat = format || 'algebraic';

    switch (requestedFormat) {
      case 'algebraic':
        return this._moveHistory;

      case 'UCI': {
        // Replay the game from the beginning to get detailed move history
        const tempEngine = new ChessEngine();
        tempEngine.loadFen(INITIAL_FEN);
        const uciMoves: string[] = [];

        // Replay each SAN move to get its UCI equivalent
        for (const sanMove of this._moveHistory) {
          const currentPosition = tempEngine.getFen();
          const legalMovesUCI = tempEngine.getLegalMovesUCI();
          let found = false;

          // Find the UCI move that produces this SAN move
          for (const uciMove of legalMovesUCI) {
            // Create a test engine to avoid modifying the main one
            const testEngine = new ChessEngine();
            testEngine.loadFen(currentPosition);
            const testResult = testEngine.makeMoveAndGetSan(uciMove);

            if (testResult === sanMove) {
              uciMoves.push(uciMove);
              tempEngine.makeMove(uciMove); // Apply the move to continue sequence
              found = true;
              break;
            }
          }

          if (!found) {
            throw new Error(
              `Could not convert SAN move '${sanMove}' to UCI format`
            );
          }
        }

        return uciMoves;
      }

      case 'verbose': {
        return this._moveHistory.map((move, index) => ({
          moveNumber: Math.floor(index / 2) + 1,
          player: index % 2 === 0 ? PLAYER_COLOR.WHITE : PLAYER_COLOR.BLACK,
          move: move,
          timestamp: this._lastMoveAt ?? undefined, // For now, use last move timestamp
        }));
      }

      case 'with_fen': {
        // Replay the game from the beginning to get FEN positions for each move
        const tempEngine = new ChessEngine();
        tempEngine.loadFen(INITIAL_FEN);
        const result: Array<{
          moveNumber: number;
          move: string;
          fen: string;
        }> = [];

        // Replay each move to get its resulting FEN
        for (let i = 0; i < this._moveHistory.length; i++) {
          const move = this._moveHistory[i];
          if (!move) {
            continue;
          }
          const moveNumber = i + 1;

          // Make the move and get resulting FEN
          tempEngine.makeMove(move);
          const fen = tempEngine.getFen();

          result.push({
            moveNumber,
            move,
            fen,
          });
        }

        return result;
      }

      case 'detailed': {
        // Replay the game from the beginning to get detailed move information
        const tempEngine = new ChessEngine();
        tempEngine.loadFen(INITIAL_FEN);
        const result: Array<{
          moveNumber: number;
          move: string;
          fen: string;
          check: boolean;
          capture: boolean;
          castling: boolean;
        }> = [];

        // Replay each move to get detailed information
        for (let i = 0; i < this._moveHistory.length; i++) {
          const move = this._moveHistory[i];
          if (!move) {
            continue;
          }
          const moveNumber = i + 1;

          // Analyze the move before making it
          const isCapture = move.includes('x');
          const isCastling = move === 'O-O' || move === 'O-O-O';

          // Make the move and get resulting FEN
          tempEngine.makeMove(move);
          const fen = tempEngine.getFen();

          // Check if the move resulted in check
          const isCheck = move.includes('+') || move.includes('#');

          result.push({
            moveNumber,
            move,
            fen,
            check: isCheck,
            capture: isCapture,
            castling: isCastling,
          });
        }

        return result;
      }

      default:
        throw new Error(
          `Invalid format: ${format}. Must be 'algebraic', 'UCI', 'verbose', 'with_fen', or 'detailed'`
        );
    }
  }

  /**
   * Exports the game in the specified format.
   *
   * @param format - Export format: 'PGN' for Portable Game Notation or 'FEN' for current position
   * @returns Object containing the exported game data and metadata
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * game.makeMove('e2e4');
   * game.makeMove('e7e5');
   *
   * const pgnExport = game.exportGame('PGN');
   * console.log(pgnExport.content); // '1. e4 e5 *'
   *
   * const fenExport = game.exportGame('FEN');
   * console.log(fenExport.content); // Current position FEN
   * ```
   */
  public exportGame(format: 'PGN' | 'FEN' = 'PGN'): {
    gameId: string;
    format: string;
    content: string;
    metadata: {
      whitePlayer: string;
      blackPlayer: string;
      result: string;
      gameStatus: string;
      date: string;
    };
  } {
    let content: string;
    if (format === 'PGN') {
      // Always generate complete PGN from move history to ensure full game
      const pgnEngine = new ChessEngine();

      // Set PGN headers with game metadata
      const headers = {
        Event: 'Chess MCP Game',
        Site: 'Chess MCP Server',
        Date: this.createdAt.toISOString().split('T')[0]!.replace(/-/g, '.'),
        Round: '1',
        White: this.whitePlayerId,
        Black: this.blackPlayerId,
        Result: this._result || '*',
      };
      pgnEngine.setHeaders(headers);

      // Apply all moves to generate complete PGN
      for (const move of this._moveHistory) {
        pgnEngine.makeMove(move);
      }

      content = pgnEngine.getPgn();
    } else if (format === 'FEN') {
      content = this._fen;
    } else {
      // This should never happen with strict typing, but included for safety
      throw new Error(`Unsupported format: ${String(format)}`);
    }

    return {
      gameId: this.id,
      format: format as string,
      content,
      metadata: {
        whitePlayer: this.whitePlayerId,
        blackPlayer: this.blackPlayerId,
        result: this._result || '*',
        gameStatus: this._status,
        date: this.createdAt.toISOString().split('T')[0]!,
      },
    };
  }

  // Serialization support for storage
  public toJSON(): GameData {
    // Convert Map to plain object for serialization
    const positionHistoryObj: { [key: string]: number } = {};
    this._positionHistory.forEach((count, position) => {
      positionHistoryObj[position] = count;
    });

    return {
      id: this.id,
      whitePlayerId: this.whitePlayerId,
      blackPlayerId: this.blackPlayerId,
      fen: this._fen,
      pgn: this._pgn,
      status: this._status,
      result: this._result ?? undefined,
      timeControl: this._timeControl ?? undefined,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      lastMoveAt: this._lastMoveAt ?? undefined,
      whiteTimeRemaining: this._whiteTimeRemaining ?? undefined,
      blackTimeRemaining: this._blackTimeRemaining ?? undefined,
      drawOfferFrom: this._drawOfferFrom ?? undefined,
      pauseRequestedBy: this._pauseRequestedBy ?? undefined,
      invalidMoveCounts: this._invalidMoveCounts,
      moveHistory: this._moveHistory,
      positionHistory: positionHistoryObj,
    };
  }

  // Deserialization support
  /**
   * Creates a Game instance from serialized JSON data.
   *
   * @param data - Serialized game data from toJSON()
   * @returns Reconstructed Game instance
   *
   * @example
   * ```typescript
   * const game = new Game('alice', 'bob');
   * const serialized = game.toJSON();
   * const restored = Game.fromJSON(serialized);
   * console.log(restored.id === game.id); // true
   * ```
   */
  static fromJSON(data: GameData): Game {
    const game = Object.create(Game.prototype) as Game;

    // Convert plain object back to Map for position history
    const positionHistory = new Map<string, number>();
    if (data.positionHistory) {
      Object.entries(data.positionHistory).forEach(([position, count]) => {
        positionHistory.set(position, count);
      });
    }

    Object.assign(game, {
      id: data.id,
      whitePlayerId: data.whitePlayerId,
      blackPlayerId: data.blackPlayerId,
      createdAt: data.createdAt,
      _fen: data.fen,
      _pgn: data.pgn,
      _status: data.status,
      _currentTurn: (data.fen.split(' ')[1] === 'w'
        ? PLAYER_COLOR.WHITE
        : PLAYER_COLOR.BLACK) as PlayerColor,
      _result: data.result,
      _timeControl: data.timeControl,
      _updatedAt: data.updatedAt,
      _lastMoveAt: data.lastMoveAt,
      _whiteTimeRemaining: data.whiteTimeRemaining,
      _blackTimeRemaining: data.blackTimeRemaining,
      _drawOfferFrom: data.drawOfferFrom,
      _pauseRequestedBy: data.pauseRequestedBy,
      _invalidMoveCounts: data.invalidMoveCounts,
      _moveHistory: data.moveHistory || [],
      _chessEngine: new ChessEngine(),
      _positionHistory: positionHistory,
    });

    // Restore chess engine state by replaying moves
    if (data.moveHistory && data.moveHistory.length > 0) {
      for (const move of data.moveHistory) {
        game._chessEngine.makeMove(move);
      }
    }

    return game;
  }

  /**
   * Creates a Game instance from PGN (Portable Game Notation) data.
   *
   * @param pgn - PGN string containing the game moves and headers
   * @param metadata - Optional metadata to override PGN headers
   * @returns New Game instance with moves from PGN applied
   * @throws {Error} If PGN format is invalid or contains illegal moves
   *
   * @example
   * ```typescript
   * const pgn = '1. e4 e5 2. Nf3 Nc6 *';
   * const game = Game.fromPGN(pgn, {
   *   whitePlayerId: 'alice',
   *   blackPlayerId: 'bob'
   * });
   * console.log(game.moveHistory); // ['e4', 'e5', 'Nf3', 'Nc6']
   * ```
   */
  static fromPGN(pgn: string, metadata?: Record<string, unknown>): Game {
    // Create a temporary ChessEngine to parse PGN
    const tempEngine = new ChessEngine();

    // Validate and parse PGN
    if (!tempEngine.loadPgn(pgn)) {
      throw new Error('Invalid PGN format');
    }

    // Extract metadata from PGN headers
    const headers = tempEngine.getHeaders();
    const whitePlayer = headers['White'] || 'Unknown';
    const blackPlayer = headers['Black'] || 'Unknown';
    const result = headers['Result'] || '*';

    // Create a new game with derived player IDs
    const game = new Game(
      (metadata?.['whitePlayerId'] as string) || whitePlayer,
      (metadata?.['blackPlayerId'] as string) || blackPlayer
    );

    // Play through all moves to get final position
    const moves = tempEngine.getMoves();
    for (const move of moves) {
      try {
        game.makeMove(move);
      } catch {
        throw new Error(`Invalid move in PGN: ${move}`);
      }
    }

    // Set final result if game is completed
    if (result !== '*') {
      game._result = result as GameResult;
      game._status = GAME_STATUS.COMPLETED;
    }

    return game;
  }
}
