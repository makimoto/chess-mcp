import { Game } from '../game/Game.js';
import type { StorageAdapter } from './StorageAdapter.js';
import type { GameStatus } from '../../types/game.types.js';

/**
 * In-memory implementation of StorageAdapter
 * Provides the same behavior as current GameManager storage
 */
export class InMemoryAdapter implements StorageAdapter {
  private games: Map<string, Game> = new Map();

  async saveGame(game: Game): Promise<void> {
    // Store a copy to prevent external mutations
    const gameData = game.toJSON();
    const gameCopy = Game.fromJSON(gameData);
    this.games.set(game.id, gameCopy);
    await Promise.resolve(); // Satisfy async requirement
  }

  async loadGame(id: string): Promise<Game | null> {
    const game = this.games.get(id);
    if (!game) {
      await Promise.resolve();
      return null;
    }

    // Return a copy to prevent external mutations
    const gameData = game.toJSON();
    await Promise.resolve();
    return Game.fromJSON(gameData);
  }

  async deleteGame(id: string): Promise<boolean> {
    const result = this.games.delete(id);
    await Promise.resolve();
    return result;
  }

  async loadAllGames(): Promise<Game[]> {
    const result = Array.from(this.games.values()).map(game => {
      const gameData = game.toJSON();
      return Game.fromJSON(gameData);
    });
    await Promise.resolve();
    return result;
  }

  async loadGamesByStatus(status: GameStatus): Promise<Game[]> {
    const allGames = await this.loadAllGames();
    return allGames.filter(game => game.status === status);
  }

  async loadGamesByPlayer(playerId: string): Promise<Game[]> {
    const allGames = await this.loadAllGames();
    return allGames.filter(
      game => game.whitePlayerId === playerId || game.blackPlayerId === playerId
    );
  }

  async countActiveGames(): Promise<number> {
    const activeGames = await this.loadGamesByStatus('active');
    return activeGames.length;
  }

  async gameExists(id: string): Promise<boolean> {
    const result = this.games.has(id);
    await Promise.resolve();
    return result;
  }

  async isHealthy(): Promise<boolean> {
    await Promise.resolve();
    return true; // In-memory storage is always healthy
  }

  async close(): Promise<void> {
    this.games.clear();
    await Promise.resolve(); // Satisfy async requirement
  }

  // Debug/testing helpers
  public size(): number {
    return this.games.size;
  }

  public clear(): void {
    this.games.clear();
  }
}
