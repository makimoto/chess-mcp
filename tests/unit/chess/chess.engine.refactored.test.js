import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ChessEngine } from '../../../src/core/chess/ChessEngine.js';
import { Chess } from 'chess.js';
// Mock chess.js to test only our wrapper logic
jest.mock('chess.js');
describe('ChessEngine (Wrapper Functionality)', () => {
  let engine;
  let mockChess;
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Create a new instance
    engine = new ChessEngine();
    mockChess = engine.getChessInstance();
  });
  describe('Constructor', () => {
    it('should initialize chess.js with no FEN when no parameter provided', () => {
      new ChessEngine();
      expect(Chess).toHaveBeenCalledWith(undefined);
    });
    it('should initialize chess.js with provided FEN string', () => {
      const fen = 'test-fen-string';
      new ChessEngine(fen);
      expect(Chess).toHaveBeenCalledWith(fen);
    });
  });
  describe('Type Conversion', () => {
    it('should convert chess.js turn "w" to "white"', () => {
      mockChess.turn.mockReturnValue('w');
      const result = engine.getTurn();
      expect(result).toBe('white');
      expect(mockChess.turn).toHaveBeenCalled();
    });
    it('should convert chess.js turn "b" to "black"', () => {
      mockChess.turn.mockReturnValue('b');
      const result = engine.getTurn();
      expect(result).toBe('black');
      expect(mockChess.turn).toHaveBeenCalled();
    });
    it('should transform verbose history to our MoveDetail format', () => {
      const mockHistory = [
        {
          san: 'e4',
          from: 'e2',
          to: 'e4',
          piece: 'p',
          captured: undefined,
          promotion: undefined,
          flags: 'n',
        },
      ];
      mockChess.history.mockReturnValue(mockHistory);
      const result = engine.getHistory();
      expect(mockChess.history).toHaveBeenCalledWith({ verbose: true });
      expect(result).toEqual([
        {
          san: 'e4',
          from: 'e2',
          to: 'e4',
          piece: 'p',
          captured: undefined,
          promotion: undefined,
          flags: 'n',
        },
      ]);
    });
  });
  describe('Error Handling', () => {
    it('should return false when isValidMove throws error (coordinate notation)', () => {
      mockChess.moves.mockImplementation(() => {
        throw new Error('Invalid square');
      });
      const result = engine.isValidMove('invalid', 'square');
      expect(result).toBe(false);
    });
    it('should return false when isValidMove throws error (algebraic notation)', () => {
      mockChess.moves.mockImplementation(() => {
        throw new Error('Invalid move');
      });
      const result = engine.isValidMove('invalidMove');
      expect(result).toBe(false);
    });
    it('should return false when makeMove throws error', () => {
      mockChess.move.mockImplementation(() => {
        throw new Error('Invalid move');
      });
      const result = engine.makeMove('e2', 'e4');
      expect(result).toBe(false);
    });
    it('should return false when loadFen throws error', () => {
      mockChess.load.mockImplementation(() => {
        throw new Error('Invalid FEN');
      });
      const result = engine.loadFen('invalid-fen');
      expect(result).toBe(false);
    });
    it('should return false when loadPgn throws error', () => {
      mockChess.loadPgn.mockImplementation(() => {
        throw new Error('Invalid PGN');
      });
      const result = engine.loadPgn('invalid-pgn');
      expect(result).toBe(false);
    });
    it('should return empty array when getLegalMovesFrom throws error', () => {
      mockChess.moves.mockImplementation(() => {
        throw new Error('Invalid square');
      });
      const result = engine.getLegalMovesFrom('invalid');
      expect(result).toEqual([]);
    });
    it('should return null when getPiece throws error', () => {
      mockChess.get.mockImplementation(() => {
        throw new Error('Invalid square');
      });
      const result = engine.getPiece('invalid');
      expect(result).toBe(null);
    });
    it('should return false when isSquareAttacked throws error', () => {
      mockChess.isAttacked.mockImplementation(() => {
        throw new Error('Invalid parameters');
      });
      const result = engine.isSquareAttacked('invalid');
      expect(result).toBe(false);
    });
  });
  describe('API Unification', () => {
    it('should handle coordinate notation for move validation', () => {
      const mockMoves = [{ to: 'e4', from: 'e2' }];
      mockChess.moves.mockReturnValue(mockMoves);
      engine.isValidMove('e2', 'e4');
      expect(mockChess.moves).toHaveBeenCalledWith({
        square: 'e2',
        verbose: true,
      });
    });
    it('should handle algebraic notation for move validation', () => {
      const mockMoves = ['e4', 'Nf3'];
      mockChess.moves.mockReturnValue(mockMoves);
      engine.isValidMove('e4');
      expect(mockChess.moves).toHaveBeenCalledWith();
    });
    it('should handle coordinate notation for move execution', () => {
      mockChess.move.mockReturnValue({ san: 'e4' });
      engine.makeMove('e2', 'e4');
      expect(mockChess.move).toHaveBeenCalledWith({ from: 'e2', to: 'e4' });
    });
    it('should handle algebraic notation for move execution', () => {
      mockChess.move.mockReturnValue({ san: 'e4' });
      engine.makeMove('e4');
      expect(mockChess.move).toHaveBeenCalledWith('e4');
    });
  });
  describe('Null/Undefined Normalization', () => {
    it('should return true when chess.js move succeeds', () => {
      mockChess.move.mockReturnValue({ san: 'e4' });
      const result = engine.makeMove('e4');
      expect(result).toBe(true);
    });
    it('should return false when chess.js move returns null', () => {
      mockChess.move.mockReturnValue(null);
      const result = engine.makeMove('invalid');
      expect(result).toBe(false);
    });
    it('should return true when chess.js undo succeeds', () => {
      mockChess.undo.mockReturnValue({ san: 'e4' });
      const result = engine.undo();
      expect(result).toBe(true);
    });
    it('should return false when chess.js undo returns null', () => {
      mockChess.undo.mockReturnValue(null);
      const result = engine.undo();
      expect(result).toBe(false);
    });
    it('should return piece when chess.js get returns piece', () => {
      const mockPiece = { type: 'p', color: 'w' };
      mockChess.get.mockReturnValue(mockPiece);
      const result = engine.getPiece('e2');
      expect(result).toEqual(mockPiece);
    });
    it('should return null when chess.js get returns null', () => {
      mockChess.get.mockReturnValue(null);
      const result = engine.getPiece('e4');
      expect(result).toBe(null);
    });
    it('should return null when chess.js get returns undefined', () => {
      mockChess.get.mockReturnValue(undefined);
      const result = engine.getPiece('e4');
      expect(result).toBe(null);
    });
  });
  describe('Color Parameter Handling for Attack Detection', () => {
    it('should convert "white" to "w" for isSquareAttacked', () => {
      mockChess.isAttacked.mockReturnValue(true);
      engine.isSquareAttacked('e4', 'white');
      expect(mockChess.isAttacked).toHaveBeenCalledWith('e4', 'w');
    });
    it('should convert "black" to "b" for isSquareAttacked', () => {
      mockChess.isAttacked.mockReturnValue(true);
      engine.isSquareAttacked('e4', 'black');
      expect(mockChess.isAttacked).toHaveBeenCalledWith('e4', 'b');
    });
    it('should use opponent color when no color specified', () => {
      mockChess.turn.mockReturnValue('w'); // White to move
      mockChess.isAttacked.mockReturnValue(true);
      engine.isSquareAttacked('e4');
      expect(mockChess.isAttacked).toHaveBeenCalledWith('e4', 'b'); // Check black attacks
    });
    it('should use opponent color when black to move', () => {
      mockChess.turn.mockReturnValue('b'); // Black to move
      mockChess.isAttacked.mockReturnValue(true);
      engine.isSquareAttacked('e4');
      expect(mockChess.isAttacked).toHaveBeenCalledWith('e4', 'w'); // Check white attacks
    });
  });
  describe('Direct Delegation', () => {
    it('should delegate getFen to chess.js', () => {
      const mockFen = 'test-fen';
      mockChess.fen.mockReturnValue(mockFen);
      const result = engine.getFen();
      expect(result).toBe(mockFen);
      expect(mockChess.fen).toHaveBeenCalled();
    });
    it('should delegate isGameOver to chess.js', () => {
      mockChess.isGameOver.mockReturnValue(true);
      const result = engine.isGameOver();
      expect(result).toBe(true);
      expect(mockChess.isGameOver).toHaveBeenCalled();
    });
    it('should delegate isCheckmate to chess.js', () => {
      mockChess.isCheckmate.mockReturnValue(true);
      const result = engine.isCheckmate();
      expect(result).toBe(true);
      expect(mockChess.isCheckmate).toHaveBeenCalled();
    });
    it('should delegate isStalemate to chess.js', () => {
      mockChess.isStalemate.mockReturnValue(true);
      const result = engine.isStalemate();
      expect(result).toBe(true);
      expect(mockChess.isStalemate).toHaveBeenCalled();
    });
    it('should delegate isCheck to chess.js inCheck method', () => {
      mockChess.inCheck.mockReturnValue(true);
      const result = engine.isCheck();
      expect(result).toBe(true);
      expect(mockChess.inCheck).toHaveBeenCalled();
    });
    it('should delegate reset to chess.js', () => {
      engine.reset();
      expect(mockChess.reset).toHaveBeenCalled();
    });
    it('should delegate getLegalMoves to chess.js', () => {
      const mockMoves = ['e4', 'Nf3'];
      mockChess.moves.mockReturnValue(mockMoves);
      const result = engine.getLegalMoves();
      expect(result).toEqual(mockMoves);
      expect(mockChess.moves).toHaveBeenCalled();
    });
    it('should delegate ascii to chess.js', () => {
      const mockAscii = 'ascii-board';
      mockChess.ascii.mockReturnValue(mockAscii);
      const result = engine.ascii();
      expect(result).toBe(mockAscii);
      expect(mockChess.ascii).toHaveBeenCalled();
    });
    it('should delegate getPgn to chess.js', () => {
      const mockPgn = '1. e4 e5';
      mockChess.pgn.mockReturnValue(mockPgn);
      const result = engine.getPgn();
      expect(result).toBe(mockPgn);
      expect(mockChess.pgn).toHaveBeenCalled();
    });
  });
  describe('Success Case Handling', () => {
    it('should return true when loadFen succeeds', () => {
      mockChess.load.mockReturnValue(undefined); // Successful load returns undefined
      const result = engine.loadFen('valid-fen');
      expect(result).toBe(true);
    });
    it('should return true when loadPgn succeeds', () => {
      mockChess.loadPgn.mockReturnValue(undefined); // Successful load returns undefined
      const result = engine.loadPgn('1. e4 e5');
      expect(result).toBe(true);
    });
  });
});
//# sourceMappingURL=chess.engine.refactored.test.js.map
