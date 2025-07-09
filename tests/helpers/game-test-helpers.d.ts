/**
 * Test helper functions for Game and GameManager testing
 */
import { Game } from '../../src/core/game/Game.js';
import { GameManager } from '../../src/core/game/GameManager.js';
import { GameResult, TimeControl } from '../../src/types/game.types.js';
/**
 * Creates a GameManager instance for testing
 */
export declare function createGameManager(): GameManager;
/**
 * Creates a basic game with default players
 */
export declare function createTestGame(
  whitePlayerId?: string,
  blackPlayerId?: string,
  timeControl?: TimeControl
): Game;
/**
 * Creates multiple games for testing concurrent limits
 */
export declare function createMultipleGames(
  gameManager: GameManager,
  count: number
): Game[];
/**
 * Helper to verify basic game properties
 */
export declare function expectBasicGameProperties(
  game: Game,
  whitePlayerId: string,
  blackPlayerId: string
): void;
/**
 * Helper to verify initial game state
 */
export declare function expectInitialGameState(game: Game): void;
/**
 * Helper to verify time control initialization
 */
export declare function expectTimeControlInitialization(
  game: Game,
  timeControl?: TimeControl
): void;
/**
 * Helper to verify unique game IDs
 */
export declare function expectUniqueGameIds(games: Game[]): void;
/**
 * Helper to verify timestamp properties
 */
export declare function expectValidTimestamps(
  game: Game,
  beforeCreation?: Date
): void;
/**
 * Helper to verify game completion
 */
export declare function expectGameCompletion(
  game: Game,
  expectedResult: GameResult
): void;
/**
 * Helper to verify active games list
 */
export declare function expectActiveGames(
  gameManager: GameManager,
  expectedCount: number,
  expectedGames?: Game[]
): void;
/**
 * Helper to verify completed games list
 */
export declare function expectCompletedGames(
  gameManager: GameManager,
  expectedCount: number,
  expectedGames?: Game[]
): void;
/**
 * Helper to verify all games list
 */
export declare function expectAllGames(
  gameManager: GameManager,
  expectedCount: number,
  expectedGames?: Game[]
): void;
/**
 * Helper to test concurrent game limits
 */
export declare function expectConcurrentGameLimit(
  gameManager: GameManager,
  maxGames: number
): Promise<void>;
/**
 * Creates a test scenario with mixed game states
 */
export declare function createMixedGameScenario(
  gameManager: GameManager
): Promise<{
  activeGames: Game[];
  completedGames: Game[];
  allGames: Game[];
}>;
//# sourceMappingURL=game-test-helpers.d.ts.map
