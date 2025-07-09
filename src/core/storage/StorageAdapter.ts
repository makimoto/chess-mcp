import type { Game } from '../game/Game.js';
import type { GameStatus } from '../../types/game.types.js';

/**
 * Storage adapter interface for game persistence
 * All operations are async to support different storage backends
 */
export interface StorageAdapter {
  /**
   * Save or update a game in storage
   */
  saveGame(game: Game): Promise<void>;

  /**
   * Load a game by ID
   * @returns Game instance or null if not found
   */
  loadGame(id: string): Promise<Game | null>;

  /**
   * Delete a game from storage
   * @returns true if deleted, false if not found
   */
  deleteGame(id: string): Promise<boolean>;

  /**
   * Load all games from storage
   */
  loadAllGames(): Promise<Game[]>;

  /**
   * Load games filtered by status
   */
  loadGamesByStatus(status: GameStatus): Promise<Game[]>;

  /**
   * Load games where a player is participating
   */
  loadGamesByPlayer(playerId: string): Promise<Game[]>;

  /**
   * Count active games (optimization for concurrency check)
   */
  countActiveGames(): Promise<number>;

  /**
   * Check if a game exists without loading it
   */
  gameExists(id: string): Promise<boolean>;

  /**
   * Health check for storage connection
   */
  isHealthy(): Promise<boolean>;

  /**
   * Close storage connection and cleanup resources
   */
  close(): Promise<void>;
}
