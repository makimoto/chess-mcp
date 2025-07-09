import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { Game } from '../game/Game.js';
import type { StorageAdapter } from './StorageAdapter.js';
import type { GameStatus, GameData } from '../../types/game.types.js';

interface GameRow {
  data: string;
}

interface CountRow {
  count: number;
}

export class SQLiteAdapter implements StorageAdapter {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  // Promisified database methods
  private dbRun: (sql: string, params?: unknown[]) => Promise<void>;
  private dbGet: (sql: string, params?: unknown[]) => Promise<unknown>;
  private dbAll: (sql: string, params?: unknown[]) => Promise<unknown[]>;

  constructor(dbPath: string = 'games.db') {
    this.dbPath = dbPath;
    // These will be set in initialize()
    this.dbRun = (): Promise<void> =>
      Promise.reject(new Error('Database not initialized'));
    this.dbGet = (): Promise<unknown> =>
      Promise.reject(new Error('Database not initialized'));
    this.dbAll = (): Promise<unknown[]> =>
      Promise.reject(new Error('Database not initialized'));
  }

  async initialize(): Promise<void> {
    if (this.db) {
      return; // Already initialized
    }

    return new Promise<void>((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, err => {
        if (err) {
          reject(new Error(`Failed to open database: ${err.message}`));
          return;
        }

        // Promisify database methods
        this.dbRun = promisify(this.db!.run.bind(this.db));
        this.dbGet = promisify(this.db!.get.bind(this.db));
        this.dbAll = promisify(this.db!.all.bind(this.db));

        // Create tables if they don't exist
        this.createTables()
          .then(() => resolve())
          .catch(error =>
            reject(error instanceof Error ? error : new Error(String(error)))
          );
      });
    });
  }

  private async createTables(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        status TEXT NOT NULL,
        white_player_id TEXT NOT NULL,
        black_player_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
      CREATE INDEX IF NOT EXISTS idx_games_white_player ON games(white_player_id);
      CREATE INDEX IF NOT EXISTS idx_games_black_player ON games(black_player_id);
    `;

    await this.dbRun(sql);
  }

  async saveGame(game: Game): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const gameData = game.toJSON();
    const dataJson = JSON.stringify(gameData);

    const sql = `
      INSERT OR REPLACE INTO games (
        id, data, status, white_player_id, black_player_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await this.dbRun(sql, [
      game.id,
      dataJson,
      game.status,
      game.whitePlayerId,
      game.blackPlayerId,
      gameData.createdAt.toISOString(),
      gameData.updatedAt.toISOString(),
    ]);
  }

  async loadGame(id: string): Promise<Game | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql = 'SELECT data FROM games WHERE id = ?';
    const row = (await this.dbGet(sql, [id])) as GameRow | undefined;

    if (!row) {
      return null;
    }

    const gameData: GameData = JSON.parse(row.data) as GameData;
    // Convert ISO strings back to Date objects
    gameData.createdAt = new Date(gameData.createdAt);
    gameData.updatedAt = new Date(gameData.updatedAt);
    if (gameData.lastMoveAt) {
      gameData.lastMoveAt = new Date(gameData.lastMoveAt);
    }

    return Game.fromJSON(gameData);
  }

  async deleteGame(id: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // First check if the game exists
    const exists = await this.gameExists(id);
    if (!exists) {
      return false;
    }

    const sql = 'DELETE FROM games WHERE id = ?';
    await this.dbRun(sql, [id]);

    // Verify deletion
    const stillExists = await this.gameExists(id);
    return !stillExists;
  }

  async loadAllGames(): Promise<Game[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql = 'SELECT data FROM games ORDER BY updated_at DESC';
    const rows = (await this.dbAll(sql)) as GameRow[];

    return rows.map(row => {
      const gameData: GameData = JSON.parse(row.data) as GameData;
      gameData.createdAt = new Date(gameData.createdAt);
      gameData.updatedAt = new Date(gameData.updatedAt);
      if (gameData.lastMoveAt) {
        gameData.lastMoveAt = new Date(gameData.lastMoveAt);
      }
      return Game.fromJSON(gameData);
    });
  }

  async loadGamesByStatus(status: GameStatus): Promise<Game[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql =
      'SELECT data FROM games WHERE status = ? ORDER BY updated_at DESC';
    const rows = (await this.dbAll(sql, [status])) as GameRow[];

    return rows.map(row => {
      const gameData: GameData = JSON.parse(row.data) as GameData;
      gameData.createdAt = new Date(gameData.createdAt);
      gameData.updatedAt = new Date(gameData.updatedAt);
      if (gameData.lastMoveAt) {
        gameData.lastMoveAt = new Date(gameData.lastMoveAt);
      }
      return Game.fromJSON(gameData);
    });
  }

  async loadGamesByPlayer(playerId: string): Promise<Game[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql = `
      SELECT data FROM games
      WHERE white_player_id = ? OR black_player_id = ?
      ORDER BY updated_at DESC
    `;
    const rows = (await this.dbAll(sql, [playerId, playerId])) as GameRow[];

    return rows.map(row => {
      const gameData: GameData = JSON.parse(row.data) as GameData;
      gameData.createdAt = new Date(gameData.createdAt);
      gameData.updatedAt = new Date(gameData.updatedAt);
      if (gameData.lastMoveAt) {
        gameData.lastMoveAt = new Date(gameData.lastMoveAt);
      }
      return Game.fromJSON(gameData);
    });
  }

  async countActiveGames(): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql = 'SELECT COUNT(*) as count FROM games WHERE status = ?';
    const row = (await this.dbGet(sql, ['active'])) as CountRow;
    return row.count;
  }

  async gameExists(id: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql = 'SELECT 1 FROM games WHERE id = ? LIMIT 1';
    const row = await this.dbGet(sql, [id]);
    return !!row;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      await this.dbGet('SELECT 1', []);
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db!.close(err => {
        if (err) {
          reject(err);
        } else {
          this.db = null;
          resolve();
        }
      });
    });
  }
}
