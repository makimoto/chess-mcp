/**
 * Common test constants and data used across multiple test files
 */
export declare const CHESS_POSITIONS: {
  readonly STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  readonly AFTER_E4: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
  readonly FOOLS_MATE: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
  readonly STALEMATE: 'k1K5/8/1Q6/8/8/8/8/8 b - - 0 1';
  readonly CHECK_POSITION: 'rnbqkbnr/pppp1Qpp/8/4p3/4P3/8/PPPP1PPP/RNB1KB1R b KQkq - 1 2';
  readonly CASTLING_READY: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1';
  readonly EN_PASSANT: 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3';
  readonly PROMOTION_READY: '8/P7/8/8/8/8/8/K6k w - - 0 1';
};
export declare const TEST_PLAYERS: {
  readonly WHITE_PLAYER: 'player1';
  readonly BLACK_PLAYER: 'player2';
  readonly AGGRESSIVE_PLAYER: 'claude_aggressive';
  readonly DEFENSIVE_PLAYER: 'copilot_defensive';
  readonly REUSED_PLAYER: 'reusedPlayer';
  readonly PLAYER_3: 'player3';
  readonly PLAYER_4: 'player4';
  readonly PLAYER_5: 'player5';
  readonly PLAYER_6: 'player6';
};
export declare const TEST_MOVES: {
  readonly E2_E4: 'e2';
  readonly E2_E4_TO: 'e4';
  readonly E2_E3: 'e3';
  readonly D2_D4: 'd4';
  readonly G1_F3: 'g1';
  readonly G1_F3_TO: 'f3';
  readonly B1_C3: 'b1';
  readonly B1_C3_TO: 'c3';
  readonly E4_ALG: 'e4';
  readonly NF3_ALG: 'Nf3';
  readonly NC6_ALG: 'Nc6';
  readonly E5_ALG: 'e5';
  readonly CASTLE_KINGSIDE: 'O-O';
  readonly CASTLE_QUEENSIDE: 'O-O-O';
  readonly EN_PASSANT_CAPTURE: 'exf6';
};
export declare const TEST_TIME_CONTROLS: {
  readonly BLITZ: {
    readonly initialTime: 300000;
    readonly increment: 3000;
  };
  readonly RAPID: {
    readonly initialTime: 600000;
    readonly increment: 5000;
  };
  readonly CLASSICAL: {
    readonly initialTime: 1800000;
    readonly increment: 30000;
  };
  readonly INCREMENT_ONLY: {
    readonly increment: 5000;
  };
};
export declare const GAME_RESULTS: {
  readonly WHITE_WINS: '1-0';
  readonly BLACK_WINS: '0-1';
  readonly DRAW: '1/2-1/2';
};
export declare const TEST_PGNS: {
  readonly SIMPLE_OPENING: '1. e4 e5 2. Nf3 Nc6';
  readonly INVALID_PGN: 'invalid pgn string';
};
//# sourceMappingURL=test-constants.d.ts.map
