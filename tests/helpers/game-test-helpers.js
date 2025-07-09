/**
 * Test helper functions for Game and GameManager testing
 */
import { expect } from '@jest/globals';
import { Game } from '../../src/core/game/Game.js';
import { GameManager } from '../../src/core/game/GameManager.js';
import { GameResult, TimeControl } from '../../src/types/game.types.js';
import { TEST_PLAYERS, GAME_RESULTS, CHESS_POSITIONS, } from './test-constants.js';
/**
 * Creates a GameManager instance for testing
 */
export function createGameManager() {
    return new GameManager();
}
/**
 * Creates a basic game with default players
 */
export function createTestGame(whitePlayerId = TEST_PLAYERS.WHITE_PLAYER, blackPlayerId = TEST_PLAYERS.BLACK_PLAYER, timeControl) {
    return new Game(whitePlayerId, blackPlayerId, timeControl);
}
/**
 * Creates multiple games for testing concurrent limits
 */
export function createMultipleGames(gameManager, count) {
    const games = [];
    for (let i = 1; i <= count; i++) {
        const game = gameManager.createGame(`white${i}`, `black${i}`);
        games.push(game);
    }
    return games;
}
/**
 * Helper to verify basic game properties
 */
export function expectBasicGameProperties(game, whitePlayerId, blackPlayerId) {
    expect(game.id).toBeDefined();
    expect(typeof game.id).toBe('string');
    expect(game.id.length).toBeGreaterThan(0);
    expect(game.whitePlayerId).toBe(whitePlayerId);
    expect(game.blackPlayerId).toBe(blackPlayerId);
    expect(game.status).toBe('active');
    expect(game.currentTurn).toBe('white');
}
/**
 * Helper to verify initial game state
 */
export function expectInitialGameState(game) {
    expect(game.fen).toBe(CHESS_POSITIONS.STARTING_POSITION);
    expect(game.pgn).toBe('');
    expect(game.result).toBeUndefined();
    expect(game.createdAt).toBeInstanceOf(Date);
    expect(game.updatedAt).toBeInstanceOf(Date);
    expect(game.lastMoveAt).toBeUndefined();
    expect(game.drawOfferFrom).toBeUndefined();
    expect(game.pauseRequestedBy).toBeUndefined();
}
/**
 * Helper to verify time control initialization
 */
export function expectTimeControlInitialization(game, timeControl) {
    if (timeControl) {
        expect(game.timeControl).toEqual(timeControl);
        if (timeControl.initialTime) {
            expect(game.whiteTimeRemaining).toBe(timeControl.initialTime);
            expect(game.blackTimeRemaining).toBe(timeControl.initialTime);
        }
        else {
            expect(game.whiteTimeRemaining).toBeUndefined();
            expect(game.blackTimeRemaining).toBeUndefined();
        }
    }
    else {
        expect(game.timeControl).toBeUndefined();
        expect(game.whiteTimeRemaining).toBeUndefined();
        expect(game.blackTimeRemaining).toBeUndefined();
    }
}
/**
 * Helper to verify unique game IDs
 */
export function expectUniqueGameIds(games) {
    const ids = games.map(game => game.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(games.length);
}
/**
 * Helper to verify timestamp properties
 */
export function expectValidTimestamps(game, beforeCreation) {
    expect(game.createdAt).toBeInstanceOf(Date);
    expect(game.updatedAt).toBeInstanceOf(Date);
    if (beforeCreation) {
        const afterCreation = new Date();
        expect(game.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
        expect(game.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    }
    expect(game.updatedAt.getTime()).toBeGreaterThanOrEqual(game.createdAt.getTime());
}
/**
 * Helper to verify game completion
 */
export function expectGameCompletion(game, expectedResult) {
    expect(game.status).toBe('completed');
    expect(game.result).toBe(expectedResult);
}
/**
 * Helper to verify active games list
 */
export function expectActiveGames(gameManager, expectedCount, expectedGames) {
    const activeGames = gameManager.getActiveGames();
    expect(activeGames).toHaveLength(expectedCount);
    if (expectedGames) {
        expectedGames.forEach(game => {
            expect(activeGames).toContain(game);
        });
    }
}
/**
 * Helper to verify completed games list
 */
export function expectCompletedGames(gameManager, expectedCount, expectedGames) {
    const completedGames = gameManager.getCompletedGames();
    expect(completedGames).toHaveLength(expectedCount);
    if (expectedGames) {
        expectedGames.forEach(game => {
            expect(completedGames).toContain(game);
        });
    }
}
/**
 * Helper to verify all games list
 */
export function expectAllGames(gameManager, expectedCount, expectedGames) {
    const allGames = gameManager.getAllGames();
    expect(allGames).toHaveLength(expectedCount);
    if (expectedGames) {
        expectedGames.forEach(game => {
            expect(allGames).toContain(game);
        });
    }
}
/**
 * Helper to test concurrent game limits
 */
export async function expectConcurrentGameLimit(gameManager, maxGames) {
    // Fill up to the limit
    const games = [];
    for (let i = 0; i < maxGames; i++) {
        games.push(await gameManager.createGame(`player${i}w`, `player${i}b`));
    }
    const activeGames = await gameManager.getActiveGames();
    expect(activeGames).toHaveLength(maxGames);
    // Try to exceed the limit
    await expect(async () => {
        await gameManager.createGame('overflowWhite', 'overflowBlack');
    }).rejects.toThrow(`Maximum number of concurrent games (${maxGames}) reached`);
}
/**
 * Creates a test scenario with mixed game states
 */
export async function createMixedGameScenario(gameManager) {
    const game1 = await gameManager.createGame(TEST_PLAYERS.WHITE_PLAYER, TEST_PLAYERS.BLACK_PLAYER);
    const game2 = await gameManager.createGame(TEST_PLAYERS.PLAYER_3, TEST_PLAYERS.PLAYER_4);
    const game3 = await gameManager.createGame(TEST_PLAYERS.PLAYER_5, TEST_PLAYERS.PLAYER_6);
    // Complete some games
    await gameManager.completeGame(game1.id, GAME_RESULTS.WHITE_WINS);
    await gameManager.completeGame(game2.id, GAME_RESULTS.BLACK_WINS);
    return {
        activeGames: [game3],
        completedGames: [game1, game2],
        allGames: [game1, game2, game3],
    };
}
//# sourceMappingURL=game-test-helpers.js.map