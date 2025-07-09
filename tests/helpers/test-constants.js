/**
 * Common test constants and data used across multiple test files
 */
// Standard chess positions
export const CHESS_POSITIONS = {
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  AFTER_E4: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  FOOLS_MATE: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
  STALEMATE: 'k1K5/8/1Q6/8/8/8/8/8 b - - 0 1',
  CHECK_POSITION:
    'rnbqkbnr/pppp1Qpp/8/4p3/4P3/8/PPPP1PPP/RNB1KB1R b KQkq - 1 2',
  CASTLING_READY: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
  EN_PASSANT: 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3',
  PROMOTION_READY: '8/P7/8/8/8/8/8/K6k w - - 0 1',
};
// Common player IDs for testing
export const TEST_PLAYERS = {
  WHITE_PLAYER: 'player1',
  BLACK_PLAYER: 'player2',
  AGGRESSIVE_PLAYER: 'claude_aggressive',
  DEFENSIVE_PLAYER: 'copilot_defensive',
  REUSED_PLAYER: 'reusedPlayer',
  PLAYER_3: 'player3',
  PLAYER_4: 'player4',
  PLAYER_5: 'player5',
  PLAYER_6: 'player6',
};
// Common chess moves for testing
export const TEST_MOVES = {
  // Pawn moves
  E2_E4: 'e2',
  E2_E4_TO: 'e4',
  E2_E3: 'e3',
  D2_D4: 'd4',
  // Knight moves
  G1_F3: 'g1',
  G1_F3_TO: 'f3',
  B1_C3: 'b1',
  B1_C3_TO: 'c3',
  // Algebraic notation
  E4_ALG: 'e4',
  NF3_ALG: 'Nf3',
  NC6_ALG: 'Nc6',
  E5_ALG: 'e5',
  // Special moves
  CASTLE_KINGSIDE: 'O-O',
  CASTLE_QUEENSIDE: 'O-O-O',
  EN_PASSANT_CAPTURE: 'exf6',
};
// Time control configurations
export const TEST_TIME_CONTROLS = {
  BLITZ: { initialTime: 300000, increment: 3000 }, // 5 min + 3 sec
  RAPID: { initialTime: 600000, increment: 5000 }, // 10 min + 5 sec
  CLASSICAL: { initialTime: 1800000, increment: 30000 }, // 30 min + 30 sec
  INCREMENT_ONLY: { increment: 5000 },
};
// Game results
export const GAME_RESULTS = {
  WHITE_WINS: '1-0',
  BLACK_WINS: '0-1',
  DRAW: '1/2-1/2',
};
// Sample PGN games
export const TEST_PGNS = {
  SIMPLE_OPENING: '1. e4 e5 2. Nf3 Nc6',
  INVALID_PGN: 'invalid pgn string',
};
//# sourceMappingURL=test-constants.js.map
