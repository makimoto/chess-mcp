import { describe, it, expect } from '@jest/globals';
import { TEST_PLAYERS, TEST_TIME_CONTROLS, createTestGame, expectBasicGameProperties, expectInitialGameState, expectTimeControlInitialization, expectUniqueGameIds, expectValidTimestamps, } from '../../helpers/index.js';
describe('Game Creation', () => {
    describe('when creating a new game with two players', () => {
        it('should create a game with unique ID', () => {
            const game = createTestGame();
            expect(game.id).toBeDefined();
            expect(typeof game.id).toBe('string');
            expect(game.id.length).toBeGreaterThan(0);
        });
        it('should assign players correctly', () => {
            const game = createTestGame(TEST_PLAYERS.AGGRESSIVE_PLAYER, TEST_PLAYERS.DEFENSIVE_PLAYER);
            expectBasicGameProperties(game, TEST_PLAYERS.AGGRESSIVE_PLAYER, TEST_PLAYERS.DEFENSIVE_PLAYER);
        });
        it('should initialize with active status', () => {
            const game = createTestGame();
            expect(game.status).toBe('active');
        });
        it('should initialize with white to move first', () => {
            const game = createTestGame();
            expect(game.currentTurn).toBe('white');
        });
        it('should initialize with starting chess position', () => {
            const game = createTestGame();
            expectInitialGameState(game);
        });
        it('should initialize with empty PGN', () => {
            const game = createTestGame();
            expect(game.pgn).toBe('');
        });
        it('should set creation timestamp', () => {
            const beforeCreation = new Date();
            const game = createTestGame();
            expectValidTimestamps(game, beforeCreation);
        });
    });
    describe('when creating multiple games', () => {
        it('should generate unique IDs for each game', () => {
            const games = [
                createTestGame(TEST_PLAYERS.WHITE_PLAYER, TEST_PLAYERS.BLACK_PLAYER),
                createTestGame(TEST_PLAYERS.PLAYER_3, TEST_PLAYERS.PLAYER_4),
                createTestGame(TEST_PLAYERS.PLAYER_5, TEST_PLAYERS.PLAYER_6),
            ];
            expectUniqueGameIds(games);
        });
    });
    describe('time control', () => {
        it('should initialize without time control when not provided', () => {
            const game = createTestGame();
            expectTimeControlInitialization(game);
        });
        it('should initialize with time control when provided', () => {
            const game = createTestGame(TEST_PLAYERS.WHITE_PLAYER, TEST_PLAYERS.BLACK_PLAYER, TEST_TIME_CONTROLS.RAPID);
            expectTimeControlInitialization(game, TEST_TIME_CONTROLS.RAPID);
        });
        it('should not set time remaining when time control has no initial time', () => {
            const game = createTestGame(TEST_PLAYERS.WHITE_PLAYER, TEST_PLAYERS.BLACK_PLAYER, TEST_TIME_CONTROLS.INCREMENT_ONLY);
            expectTimeControlInitialization(game, TEST_TIME_CONTROLS.INCREMENT_ONLY);
        });
    });
    describe('additional properties', () => {
        it('should initialize all additional properties correctly', () => {
            const game = createTestGame();
            expectInitialGameState(game);
            expectValidTimestamps(game);
        });
    });
    describe('edge cases', () => {
        it('should allow same player ID for different games', () => {
            const game1 = createTestGame(TEST_PLAYERS.REUSED_PLAYER, TEST_PLAYERS.BLACK_PLAYER);
            const game2 = createTestGame(TEST_PLAYERS.PLAYER_3, TEST_PLAYERS.REUSED_PLAYER);
            expect(game1.whitePlayerId).toBe(TEST_PLAYERS.REUSED_PLAYER);
            expect(game2.blackPlayerId).toBe(TEST_PLAYERS.REUSED_PLAYER);
            expectUniqueGameIds([game1, game2]);
        });
    });
});
//# sourceMappingURL=game.creation.test.js.map