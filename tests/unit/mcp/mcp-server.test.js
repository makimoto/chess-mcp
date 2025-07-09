import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ChessMCPServer } from '../../../src/mcp/ChessMCPServer.js';
import { GameManager } from '../../../src/core/game/GameManager.js';
import { InMemoryAdapter } from '../../../src/core/storage/InMemoryAdapter.js';
describe('ChessMCPServer', () => {
    let server;
    let gameManager;
    beforeEach(() => {
        const storage = new InMemoryAdapter();
        gameManager = new GameManager(storage);
        server = new ChessMCPServer(gameManager);
    });
    afterEach(async () => {
        await server.close();
    });
    describe('server initialization', () => {
        it('should create server with game manager', () => {
            expect(server).toBeDefined();
            expect(server.name).toBe('chess-mcp-server');
            expect(server.version).toBe('0.1.0');
        });
        it('should have proper server info', () => {
            const info = server.getServerInfo();
            expect(info.name).toBe('chess-mcp-server');
            expect(info.version).toBe('0.1.0');
            expect(info.description).toContain('chess game management');
        });
    });
    describe('tool registration', () => {
        it('should register create_game tool', () => {
            const tools = server.getRegisteredTools();
            const createGameTool = tools.find(tool => tool.name === 'create_game');
            expect(createGameTool).toBeDefined();
            expect(createGameTool.description).toContain('Create a new chess game');
            expect(createGameTool.inputSchema.properties).toHaveProperty('whitePlayerId');
            expect(createGameTool.inputSchema.properties).toHaveProperty('blackPlayerId');
        });
        it('should register get_game_status tool', () => {
            const tools = server.getRegisteredTools();
            const statusTool = tools.find(tool => tool.name === 'get_game_status');
            expect(statusTool).toBeDefined();
            expect(statusTool.description).toContain('Get the current status of a chess game');
            expect(statusTool.inputSchema.properties).toHaveProperty('gameId');
        });
        it('should register make_move tool', () => {
            const tools = server.getRegisteredTools();
            const moveTool = tools.find(tool => tool.name === 'make_move');
            expect(moveTool).toBeDefined();
            expect(moveTool.description).toContain('Make a move in a chess game');
            expect(moveTool.inputSchema.properties).toHaveProperty('gameId');
            expect(moveTool.inputSchema.properties).toHaveProperty('move');
        });
        it('should register list_games tool', () => {
            const tools = server.getRegisteredTools();
            const listTool = tools.find(tool => tool.name === 'list_games');
            expect(listTool).toBeDefined();
            expect(listTool.description).toContain('List games');
            expect(listTool.inputSchema.properties).toHaveProperty('status');
            expect(listTool.inputSchema.properties).toHaveProperty('playerId');
        });
        it('should register resign_game tool', () => {
            const tools = server.getRegisteredTools();
            const resignTool = tools.find(tool => tool.name === 'resign_game');
            expect(resignTool).toBeDefined();
            expect(resignTool.description).toContain('Resign from a chess game');
            expect(resignTool.inputSchema.properties).toHaveProperty('gameId');
            expect(resignTool.inputSchema.properties).toHaveProperty('playerId');
        });
        it('should register offer_draw tool', () => {
            const tools = server.getRegisteredTools();
            const drawTool = tools.find(tool => tool.name === 'offer_draw');
            expect(drawTool).toBeDefined();
            expect(drawTool.description).toContain('Offer a draw');
            expect(drawTool.inputSchema.properties).toHaveProperty('gameId');
            expect(drawTool.inputSchema.properties).toHaveProperty('playerId');
        });
        it('should register accept_draw tool', () => {
            const tools = server.getRegisteredTools();
            const acceptTool = tools.find(tool => tool.name === 'accept_draw');
            expect(acceptTool).toBeDefined();
            expect(acceptTool.description).toContain('Accept a draw offer');
            expect(acceptTool.inputSchema.properties).toHaveProperty('gameId');
            expect(acceptTool.inputSchema.properties).toHaveProperty('playerId');
        });
        it('should register decline_draw tool', () => {
            const tools = server.getRegisteredTools();
            const declineTool = tools.find(tool => tool.name === 'decline_draw');
            expect(declineTool).toBeDefined();
            expect(declineTool.description).toContain('Decline a draw offer');
            expect(declineTool.inputSchema.properties).toHaveProperty('gameId');
            expect(declineTool.inputSchema.properties).toHaveProperty('playerId');
        });
    });
    describe('tool execution', () => {
        it('should execute create_game tool successfully', async () => {
            const result = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('gameId');
            expect(result.data).toHaveProperty('status', 'active');
            expect(result.data).toHaveProperty('whitePlayerId', 'player1');
            expect(result.data).toHaveProperty('blackPlayerId', 'player2');
        });
        it('should execute get_game_status tool successfully', async () => {
            // First create a game
            const createResult = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            const gameId = createResult.data.gameId;
            // Then get its status
            const statusResult = await server.executeTool('get_game_status', {
                gameId,
            });
            expect(statusResult.success).toBe(true);
            expect(statusResult.data).toHaveProperty('gameId', gameId);
            expect(statusResult.data).toHaveProperty('status', 'active');
            expect(statusResult.data).toHaveProperty('currentTurn', 'white');
        });
        it('should handle non-existent game in get_game_status', async () => {
            const result = await server.executeTool('get_game_status', {
                gameId: 'non-existent',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Game not found');
        });
        it('should execute make_move tool successfully', async () => {
            // Create a game first
            const createResult = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            const gameId = createResult.data.gameId;
            // Make a move
            const moveResult = await server.executeTool('make_move', {
                gameId,
                move: 'e2e4',
            });
            expect(moveResult.success).toBe(true);
            expect(moveResult.data).toHaveProperty('gameId', gameId);
            expect(moveResult.data).toHaveProperty('move', 'e2e4');
            expect(moveResult.data).toHaveProperty('currentTurn', 'black');
        });
        it('should handle invalid move in make_move tool', async () => {
            // Create a game first
            const createResult = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            const gameId = createResult.data.gameId;
            // Try invalid move
            const moveResult = await server.executeTool('make_move', {
                gameId,
                move: 'invalid',
            });
            expect(moveResult.success).toBe(false);
            expect(moveResult.error).toContain('Invalid move');
        });
        it('should handle unknown tool execution', async () => {
            const result = await server.executeTool('unknown_tool', {});
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unknown tool');
        });
        it('should execute list_games tool successfully', async () => {
            // Create some test games
            await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            await server.executeTool('create_game', {
                whitePlayerId: 'player3',
                blackPlayerId: 'player4',
            });
            // List all games
            const result = await server.executeTool('list_games', {});
            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('games');
            expect(Array.isArray(result.data.games)).toBe(true);
            expect(result.data.games).toHaveLength(2);
        });
        it('should execute list_games with status filter', async () => {
            // Create a game and complete it
            const game1 = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            await server.executeTool('resign_game', {
                gameId: game1.data.gameId,
                playerId: 'player1',
            });
            // Create another active game
            await server.executeTool('create_game', {
                whitePlayerId: 'player3',
                blackPlayerId: 'player4',
            });
            // List only active games
            const result = await server.executeTool('list_games', {
                status: 'active',
            });
            expect(result.success).toBe(true);
            const listResult = result.data;
            expect(listResult.games).toHaveLength(1);
            expect(listResult.games[0]).toHaveProperty('status', 'active');
        });
        it('should execute resign_game tool successfully', async () => {
            // Create a game first
            const createResult = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            const gameId = createResult.data.gameId;
            // Resign the game
            const resignResult = await server.executeTool('resign_game', {
                gameId,
                playerId: 'player1',
            });
            expect(resignResult.success).toBe(true);
            expect(resignResult.data).toHaveProperty('gameId', gameId);
            expect(resignResult.data).toHaveProperty('result', '0-1');
            expect(resignResult.data).toHaveProperty('status', 'completed');
        });
        it('should execute offer_draw tool successfully', async () => {
            // Create a game first
            const createResult = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            const gameId = createResult.data.gameId;
            // Offer a draw
            const drawResult = await server.executeTool('offer_draw', {
                gameId,
                playerId: 'player1',
            });
            expect(drawResult.success).toBe(true);
            expect(drawResult.data).toHaveProperty('gameId', gameId);
            expect(drawResult.data).toHaveProperty('drawOfferFrom', 'player1');
            expect(drawResult.data).toHaveProperty('status', 'active');
        });
        it('should execute accept_draw tool successfully', async () => {
            // Create a game and offer draw
            const createResult = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            const gameId = createResult.data.gameId;
            await server.executeTool('offer_draw', {
                gameId,
                playerId: 'player1',
            });
            // Accept the draw as the other player
            const acceptResult = await server.executeTool('accept_draw', {
                gameId,
                playerId: 'player2',
            });
            expect(acceptResult.success).toBe(true);
            expect(acceptResult.data).toHaveProperty('gameId', gameId);
            expect(acceptResult.data).toHaveProperty('status', 'completed');
            expect(acceptResult.data).toHaveProperty('result', '1/2-1/2');
        });
        it('should execute decline_draw tool successfully', async () => {
            // Create a game and offer draw
            const createResult = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            const gameId = createResult.data.gameId;
            await server.executeTool('offer_draw', {
                gameId,
                playerId: 'player1',
            });
            // Decline the draw
            const declineResult = await server.executeTool('decline_draw', {
                gameId,
                playerId: 'player2',
            });
            expect(declineResult.success).toBe(true);
            expect(declineResult.data).toHaveProperty('gameId', gameId);
            expect(declineResult.data).toHaveProperty('status', 'active');
            expect(declineResult.data).toHaveProperty('drawOfferFrom', undefined);
        });
    });
    describe('error handling', () => {
        it('should handle missing required parameters', async () => {
            const result = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                // missing blackPlayerId
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Missing required parameter');
        });
        it('should handle invalid parameter types', async () => {
            const result = await server.executeTool('create_game', {
                whitePlayerId: 123, // should be string
                blackPlayerId: 'player2',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid parameter type');
        });
        it('should handle resign_game for non-existent game', async () => {
            const result = await server.executeTool('resign_game', {
                gameId: 'non-existent',
                playerId: 'player1',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Game not found');
        });
        it('should handle resign_game from non-player', async () => {
            // Create a game first
            const createResult = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            const gameId = createResult.data.gameId;
            // Try to resign from someone not in the game
            const result = await server.executeTool('resign_game', {
                gameId,
                playerId: 'player3',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Player not in this game');
        });
        it('should handle offer_draw for non-existent game', async () => {
            const result = await server.executeTool('offer_draw', {
                gameId: 'non-existent',
                playerId: 'player1',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Game not found');
        });
        it('should handle accept_draw when no draw offer exists', async () => {
            // Create a game without draw offer
            const createResult = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            const gameId = createResult.data.gameId;
            // Try to accept non-existent draw offer
            const result = await server.executeTool('accept_draw', {
                gameId,
                playerId: 'player2',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('No draw offer to accept');
        });
        it('should handle accept_draw from wrong player', async () => {
            // Create a game and offer draw
            const createResult = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            const gameId = createResult.data.gameId;
            await server.executeTool('offer_draw', {
                gameId,
                playerId: 'player1',
            });
            // Try to accept draw as the player who offered (should fail)
            const result = await server.executeTool('accept_draw', {
                gameId,
                playerId: 'player1',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot accept your own draw offer');
        });
        it('should handle decline_draw when no draw offer exists', async () => {
            // Create a game without draw offer
            const createResult = await server.executeTool('create_game', {
                whitePlayerId: 'player1',
                blackPlayerId: 'player2',
            });
            const gameId = createResult.data.gameId;
            // Try to decline non-existent draw offer
            const result = await server.executeTool('decline_draw', {
                gameId,
                playerId: 'player2',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('No draw offer to decline');
        });
    });
});
//# sourceMappingURL=mcp-server.test.js.map