import { Game } from './Game.js';
import type { GameResult, TimeControl } from '../../types/game.types.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';
import { InMemoryAdapter } from '../storage/InMemoryAdapter.js';

const MAX_CONCURRENT_GAMES = 5;

/**
 * Manages chess games with persistence, validation, and concurrent game limits.
 *
 * The GameManager provides high-level operations for chess game management including:
 * - Game creation with concurrent game limits
 * - Move execution with validation
 * - Game state persistence and retrieval
 * - Player-specific game queries
 * - Game import/export functionality
 * - Draw offer and resignation handling
 *
 * @example
 * ```typescript
 * const manager = new GameManager();
 *
 * // Create a new game
 * const game = await manager.createGame('alice', 'bob');
 *
 * // Make moves
 * await manager.makeMove(game.id, 'e2e4');
 * await manager.makeMove(game.id, 'e7e5');
 *
 * // Get all games for a player
 * const aliceGames = await manager.getPlayerGames('alice');
 * ```
 */
export class GameManager {
  private storage: StorageAdapter;

  /**
   * Creates a new GameManager instance.
   *
   * @param storage - Optional storage adapter for game persistence. Defaults to in-memory storage.
   *
   * @example
   * ```typescript
   * // Use default in-memory storage
   * const manager = new GameManager();
   *
   * // Use SQLite storage
   * import { SQLiteAdapter } from './storage/SQLiteAdapter';
   * const sqliteManager = new GameManager(new SQLiteAdapter('./games.db'));
   * ```
   */
  constructor(storage?: StorageAdapter) {
    this.storage = storage ?? new InMemoryAdapter();
  }

  /**
   * Creates a new chess game between two players.
   *
   * @param whitePlayerId - Unique identifier for the white player
   * @param blackPlayerId - Unique identifier for the black player
   * @param timeControl - Optional time control settings
   * @returns Promise resolving to the created Game instance
   * @throws {Error} If maximum concurrent games limit is reached
   *
   * @example
   * ```typescript
   * const manager = new GameManager();
   *
   * // Create a standard game
   * const game = await manager.createGame('alice', 'bob');
   *
   * // Create a timed game
   * const timedGame = await manager.createGame('alice', 'bob', {
   *   type: 'fischer',
   *   initialTime: 600, // 10 minutes
   *   increment: 5      // 5 seconds per move
   * });
   * ```
   */
  async createGame(
    whitePlayerId: string,
    blackPlayerId: string,
    timeControl?: TimeControl
  ): Promise<Game> {
    // Check concurrent game limit
    const activeGameCount = await this.storage.countActiveGames();
    if (activeGameCount >= MAX_CONCURRENT_GAMES) {
      throw new Error(
        `Maximum number of concurrent games (${MAX_CONCURRENT_GAMES}) reached`
      );
    }

    // Create new game
    const game = new Game(whitePlayerId, blackPlayerId, timeControl);
    await this.storage.saveGame(game);

    return game;
  }

  /**
   * Retrieves a game by its unique identifier.
   *
   * @param gameId - The unique game identifier
   * @returns Promise resolving to the Game instance or null if not found
   *
   * @example
   * ```typescript
   * const manager = new GameManager();
   * const game = await manager.getGame('game-uuid-123');
   *
   * if (game) {
   *   console.log(`Game status: ${game.status}`);
   * } else {
   *   console.log('Game not found');
   * }
   * ```
   */
  async getGame(gameId: string): Promise<Game | null> {
    return await this.storage.loadGame(gameId);
  }

  /**
   * Retrieves all currently active games.
   *
   * @returns Promise resolving to array of active Game instances
   *
   * @example
   * ```typescript
   * const manager = new GameManager();
   * const activeGames = await manager.getActiveGames();
   * console.log(`${activeGames.length} games in progress`);
   * ```
   */
  async getActiveGames(): Promise<Game[]> {
    return await this.storage.loadGamesByStatus('active');
  }

  async completeGame(gameId: string, result: GameResult): Promise<void> {
    const game = await this.storage.loadGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Use the proper Game method instead of type assertion
    game.completeGame(result);
    await this.storage.saveGame(game);
  }

  /**
   * Retrieves all games regardless of status.
   *
   * @returns Promise resolving to array of all Game instances
   *
   * @example
   * ```typescript
   * const manager = new GameManager();
   * const allGames = await manager.getAllGames();
   * console.log(`Total games: ${allGames.length}`);
   * ```
   */
  async getAllGames(): Promise<Game[]> {
    return await this.storage.loadAllGames();
  }

  /**
   * Retrieves all completed games.
   *
   * @returns Promise resolving to array of completed Game instances
   *
   * @example
   * ```typescript
   * const manager = new GameManager();
   * const completedGames = await manager.getCompletedGames();
   * console.log(`${completedGames.length} games finished`);
   * ```
   */
  async getCompletedGames(): Promise<Game[]> {
    return await this.storage.loadGamesByStatus('completed');
  }

  // Additional methods for storage operations
  async deleteGame(gameId: string): Promise<boolean> {
    return await this.storage.deleteGame(gameId);
  }

  async gameExists(gameId: string): Promise<boolean> {
    return await this.storage.gameExists(gameId);
  }

  /**
   * Retrieves all games involving a specific player.
   *
   * @param playerId - The player's unique identifier
   * @returns Promise resolving to array of games the player participated in
   *
   * @example
   * ```typescript
   * const manager = new GameManager();
   * const playerGames = await manager.getPlayerGames('alice');
   * console.log(`Alice has played ${playerGames.length} games`);
   * ```
   */
  async getPlayerGames(playerId: string): Promise<Game[]> {
    return await this.storage.loadGamesByPlayer(playerId);
  }

  async pauseGame(gameId: string, requestedBy: string): Promise<void> {
    const game = await this.storage.loadGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.pauseGame(requestedBy);
    await this.storage.saveGame(game);
  }

  async resumeGame(gameId: string): Promise<void> {
    const game = await this.storage.loadGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.resumeGame();
    await this.storage.saveGame(game);
  }

  /**
   * Executes a move in the specified game.
   *
   * @param gameId - The unique identifier of the game
   * @param move - The move in algebraic notation (e.g., 'e2e4', 'Nf3', 'O-O')
   * @throws {Error} If game is not found or move is invalid
   *
   * @example
   * ```typescript
   * const manager = new GameManager();
   * const game = await manager.createGame('alice', 'bob');
   *
   * await manager.makeMove(game.id, 'e2e4');  // King's pawn opening
   * await manager.makeMove(game.id, 'e7e5');  // Black responds
   * ```
   */
  async makeMove(gameId: string, move: string): Promise<void> {
    const game = await this.storage.loadGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.makeMove(move);
    await this.storage.saveGame(game);
  }

  /**
   * Validates a move without executing it.
   *
   * @param gameId - The unique identifier of the game
   * @param move - The move to validate in algebraic notation
   * @returns Promise resolving to validation result with details
   * @throws {Error} If game is not found
   *
   * @example
   * ```typescript
   * const manager = new GameManager();
   * const result = await manager.validateMove(gameId, 'e2e4');
   *
   * if (result.valid) {
   *   await manager.makeMove(gameId, 'e2e4');
   * } else {
   *   console.log(`Invalid: ${result.reason}`);
   * }
   * ```
   */
  async validateMove(
    gameId: string,
    move: string
  ): Promise<{ valid: boolean; reason?: string; suggestion?: string }> {
    const game = await this.storage.loadGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    return game.validateMove(move);
  }

  async getMoveHistory(
    gameId: string,
    format?: 'algebraic' | 'UCI' | 'verbose' | 'with_fen' | 'detailed'
  ): Promise<
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
      }>
  > {
    const game = await this.storage.loadGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    return game.getMoveHistory(format);
  }

  async resignGame(gameId: string, playerId: string): Promise<void> {
    const game = await this.storage.loadGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.resignGame(playerId);
    await this.storage.saveGame(game);
  }

  async offerDraw(gameId: string, playerId: string): Promise<void> {
    const game = await this.storage.loadGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.offerDraw(playerId);
    await this.storage.saveGame(game);
  }

  async acceptDraw(gameId: string, playerId: string): Promise<void> {
    const game = await this.storage.loadGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.acceptDraw(playerId);
    await this.storage.saveGame(game);
  }

  async declineDraw(gameId: string, playerId: string): Promise<void> {
    const game = await this.storage.loadGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (playerId !== game.whitePlayerId && playerId !== game.blackPlayerId) {
      throw new Error('Player not in this game');
    }

    game.declineDraw();
    await this.storage.saveGame(game);
  }

  async exportGame(
    gameId: string,
    format?: 'PGN' | 'FEN'
  ): Promise<{
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
  }> {
    const game = await this.storage.loadGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    return game.exportGame(format);
  }

  async importGame(
    pgn: string,
    metadata?: Record<string, unknown>
  ): Promise<{
    gameId: string;
    moves: number;
    finalPosition: string;
    result: string;
    validation: {
      valid: boolean;
      warnings: string[];
    };
  }> {
    // Try to parse PGN using chess.js
    const game = Game.fromPGN(pgn, metadata);

    // Save the imported game
    await this.storage.saveGame(game);

    // Return import result
    return {
      gameId: game.id,
      moves: game.moveHistory.length,
      finalPosition: game.fen,
      result: game.result || '*',
      validation: {
        valid: true,
        warnings: [],
      },
    };
  }

  async isHealthy(): Promise<boolean> {
    return await this.storage.isHealthy();
  }

  async close(): Promise<void> {
    await this.storage.close();
  }
}
