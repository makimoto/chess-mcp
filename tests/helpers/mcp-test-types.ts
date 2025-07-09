/**
 * Type definitions for MCP test assertions
 */

// MCP Tool execution result
export interface MCPResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Specific response types for each tool
export interface CreateGameResponse {
  gameId: string;
  status: string;
  whitePlayerId: string;
  blackPlayerId: string;
  currentTurn: string;
}

export interface GameStatusResponse {
  gameId: string;
  status: string;
  whitePlayerId: string;
  blackPlayerId: string;
  currentTurn: string;
  fen: string;
  pgn: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MakeMoveResponse {
  gameId: string;
  moveResult: boolean;
  status: string;
  currentTurn: string;
  fen: string;
  pgn: string;
}

export interface ListGamesResponse {
  games: Array<{
    gameId: string;
    status: string;
    whitePlayerId: string;
    blackPlayerId: string;
    currentTurn: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface ResignGameResponse {
  gameId: string;
  status: string;
  result: string;
  resignedBy: string;
}

export interface DrawOfferResponse {
  gameId: string;
  drawOfferFrom: string;
  message: string;
}

export interface DrawActionResponse {
  gameId: string;
  status: string;
  result?: string;
  message: string;
}

// Type assertion helpers
export function assertCreateGameResult(
  result: MCPResult
): asserts result is MCPResult<CreateGameResponse> & {
  data: CreateGameResponse;
} {
  if (!result.success || !result.data) {
    throw new Error('Expected successful create_game result');
  }
  const data = result.data as CreateGameResponse;
  if (!data.gameId || !data.status) {
    throw new Error('Invalid create_game response structure');
  }
}

export function assertListGamesResult(
  result: MCPResult
): asserts result is MCPResult<ListGamesResponse> & {
  data: ListGamesResponse;
} {
  if (!result.success || !result.data) {
    throw new Error('Expected successful list_games result');
  }
  const data = result.data as ListGamesResponse;
  if (!Array.isArray(data.games)) {
    throw new Error('Invalid list_games response structure');
  }
}

export function assertGameStatusResult(
  result: MCPResult
): asserts result is MCPResult<GameStatusResponse> {
  if (!result.success || !result.data) {
    throw new Error('Expected successful get_game_status result');
  }
  const data = result.data as GameStatusResponse;
  if (!data.gameId || !data.status) {
    throw new Error('Invalid get_game_status response structure');
  }
}
