import type { Color, PieceSymbol } from 'chess.js';

export interface GameState {
  fen: string;
  turn: Color;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  winner: Color | 'draw' | null;
  history: string[];
  lastMove: { from: string; to: string } | null;
  capturedPieces: {
    w: PieceSymbol[];
    b: PieceSymbol[];
  };
}

export type PlayerType = 'human' | 'ai';