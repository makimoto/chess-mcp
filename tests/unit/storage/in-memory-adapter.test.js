import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { InMemoryAdapter } from '../../../src/core/storage/InMemoryAdapter.js';
import { Game } from '../../../src/core/game/Game.js';
describe('InMemoryAdapter', () => {
    let adapter;
    let game;
    beforeEach(() => {
        adapter = new InMemoryAdapter();
        game = new Game('player1', 'player2');
    });
    afterEach(async () => {
        await adapter.close();
    });
    describe('saveGame', () => {
        it('should save game successfully', async () => {
            await adapter.saveGame(game);
            const loaded = await adapter.loadGame(game.id);
            expect(loaded).not.toBeNull();
            expect(loaded.id).toBe(game.id);
        });
        it('should store independent copies', async () => {
            await adapter.saveGame(game);
            // Modify original game
            game.completeGame('1-0');
            // Stored game should be unchanged
            const loaded = await adapter.loadGame(game.id);
            expect(loaded.status).toBe('active');
        });
        it('should overwrite existing game with same ID', async () => {
            await adapter.saveGame(game);
            // Modify and save again
            game.pauseGame('player1');
            await adapter.saveGame(game);
            const loaded = await adapter.loadGame(game.id);
            expect(loaded.status).toBe('paused');
        });
    });
    describe('loadGame', () => {
        it('should return null for non-existent game', async () => {
            const loaded = await adapter.loadGame('non-existent');
            expect(loaded).toBeNull();
        });
        it('should return independent copy of stored game', async () => {
            await adapter.saveGame(game);
            const loaded1 = await adapter.loadGame(game.id);
            const loaded2 = await adapter.loadGame(game.id);
            // Should be different instances
            expect(loaded1).not.toBe(loaded2);
            // But with same data
            expect(loaded1.id).toBe(loaded2.id);
        });
    });
    describe('deleteGame', () => {
        it('should delete existing game', async () => {
            await adapter.saveGame(game);
            const deleted = await adapter.deleteGame(game.id);
            expect(deleted).toBe(true);
            const loaded = await adapter.loadGame(game.id);
            expect(loaded).toBeNull();
        });
        it('should return false when deleting non-existent game', async () => {
            const deleted = await adapter.deleteGame('non-existent');
            expect(deleted).toBe(false);
        });
    });
    describe('loadAllGames', () => {
        it('should return empty array when no games', async () => {
            const games = await adapter.loadAllGames();
            expect(games).toEqual([]);
        });
        it('should return all stored games', async () => {
            const game1 = new Game('p1', 'p2');
            const game2 = new Game('p3', 'p4');
            await adapter.saveGame(game1);
            await adapter.saveGame(game2);
            const games = await adapter.loadAllGames();
            expect(games).toHaveLength(2);
            expect(games.map(g => g.id).sort()).toEqual([game1.id, game2.id].sort());
        });
        it('should return independent copies', async () => {
            await adapter.saveGame(game);
            const games = await adapter.loadAllGames();
            games[0].completeGame('1-0');
            // Original should be unchanged
            const loaded = await adapter.loadGame(game.id);
            expect(loaded.status).toBe('active');
        });
    });
    describe('loadGamesByStatus', () => {
        it('should filter games by status', async () => {
            const game1 = new Game('p1', 'p2');
            const game2 = new Game('p3', 'p4');
            const game3 = new Game('p5', 'p6');
            game2.completeGame('1-0');
            game3.pauseGame('p5');
            await adapter.saveGame(game1);
            await adapter.saveGame(game2);
            await adapter.saveGame(game3);
            const active = await adapter.loadGamesByStatus('active');
            expect(active).toHaveLength(1);
            expect(active[0].id).toBe(game1.id);
            const completed = await adapter.loadGamesByStatus('completed');
            expect(completed).toHaveLength(1);
            expect(completed[0].id).toBe(game2.id);
            const paused = await adapter.loadGamesByStatus('paused');
            expect(paused).toHaveLength(1);
            expect(paused[0].id).toBe(game3.id);
        });
        it('should return empty array when no games match', async () => {
            await adapter.saveGame(game); // Active game
            const completed = await adapter.loadGamesByStatus('completed');
            expect(completed).toEqual([]);
        });
    });
    describe('loadGamesByPlayer', () => {
        it('should find games where player is white', async () => {
            const game1 = new Game('player1', 'player2');
            const game2 = new Game('player3', 'player1');
            const game3 = new Game('player2', 'player3');
            await adapter.saveGame(game1);
            await adapter.saveGame(game2);
            await adapter.saveGame(game3);
            const games = await adapter.loadGamesByPlayer('player1');
            expect(games).toHaveLength(2);
            expect(games.map(g => g.id).sort()).toEqual([game1.id, game2.id].sort());
        });
        it('should find games where player is black', async () => {
            const game1 = new Game('player2', 'player1');
            const game2 = new Game('player1', 'player3');
            await adapter.saveGame(game1);
            await adapter.saveGame(game2);
            const games = await adapter.loadGamesByPlayer('player3');
            expect(games).toHaveLength(1);
            expect(games[0].id).toBe(game2.id);
        });
        it('should return empty array when player has no games', async () => {
            await adapter.saveGame(game);
            const games = await adapter.loadGamesByPlayer('player3');
            expect(games).toEqual([]);
        });
    });
    describe('countActiveGames', () => {
        it('should count only active games', async () => {
            const game1 = new Game('p1', 'p2');
            const game2 = new Game('p3', 'p4');
            await adapter.saveGame(game1);
            await adapter.saveGame(game2);
            expect(await adapter.countActiveGames()).toBe(2);
            game1.completeGame('1-0');
            await adapter.saveGame(game1);
            expect(await adapter.countActiveGames()).toBe(1);
        });
        it('should return 0 when no active games', async () => {
            game.completeGame('1/2-1/2');
            await adapter.saveGame(game);
            expect(await adapter.countActiveGames()).toBe(0);
        });
    });
    describe('gameExists', () => {
        it('should return true for existing game', async () => {
            await adapter.saveGame(game);
            const exists = await adapter.gameExists(game.id);
            expect(exists).toBe(true);
        });
        it('should return false for non-existent game', async () => {
            const exists = await adapter.gameExists('non-existent');
            expect(exists).toBe(false);
        });
    });
    describe('isHealthy', () => {
        it('should always return true for in-memory storage', async () => {
            const healthy = await adapter.isHealthy();
            expect(healthy).toBe(true);
        });
    });
    describe('close', () => {
        it('should clear all games', async () => {
            await adapter.saveGame(game);
            await adapter.close();
            expect(adapter.size()).toBe(0);
        });
    });
    describe('helper methods', () => {
        it('size() should return number of stored games', async () => {
            expect(adapter.size()).toBe(0);
            await adapter.saveGame(game);
            expect(adapter.size()).toBe(1);
            const game2 = new Game('p3', 'p4');
            await adapter.saveGame(game2);
            expect(adapter.size()).toBe(2);
        });
        it('clear() should remove all games', async () => {
            await adapter.saveGame(game);
            adapter.clear();
            expect(adapter.size()).toBe(0);
            const loaded = await adapter.loadGame(game.id);
            expect(loaded).toBeNull();
        });
    });
});
//# sourceMappingURL=in-memory-adapter.test.js.map