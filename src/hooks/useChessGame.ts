import { useCallback, useState } from 'react';
import { Chess, type Move } from 'chess.js';
import type { GameState } from '../types/chess';

export const useChessGame = () => {
  const [chess] = useState(new Chess());
  const [state, setState] = useState<GameState>({
    fen: chess.fen(),
    turn: chess.turn(),
    isCheck: false,
    isCheckmate: false,
    isDraw: false,
    isGameOver: false,
    winner: null,
    history: [],
    lastMove: null,
    capturedPieces: { w: [], b: [] }
  });

  const updateState = useCallback(() => {
    const history = chess.history();
    const historyVerbose = chess.history({ verbose: true });
    const lastMoveRaw = historyVerbose[historyVerbose.length - 1];
    
    const captured: GameState['capturedPieces'] = { w: [], b: [] };
    historyVerbose.forEach((m: Move) => {
      if (m.captured) {
        captured[m.color].push(m.captured);
      }
    });

    setState({
      fen: chess.fen(),
      turn: chess.turn(),
      isCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw(),
      isGameOver: chess.isGameOver(),
      winner: chess.isCheckmate() ? (chess.turn() === 'w' ? 'b' : 'w') : chess.isDraw() ? 'draw' : null,
      history,
      lastMove: lastMoveRaw ? { from: lastMoveRaw.from, to: lastMoveRaw.to } : null,
      capturedPieces: captured
    });
  }, [chess]);

  const makeMove = useCallback((move: string | { from: string; to: string; promotion?: string }) => {
    const legalMove = chess.moves({ verbose: true }).find((candidate) => {
      if (typeof move === 'string') {
        return candidate.san === move;
      }

      return (
        candidate.from === move.from &&
        candidate.to === move.to &&
        (!candidate.promotion || candidate.promotion === (move.promotion ?? 'q'))
      );
    });

    if (!legalMove) {
      return false;
    }

    chess.move({
      from: legalMove.from,
      to: legalMove.to,
      promotion: legalMove.promotion,
    });
    updateState();
    return true;
  }, [chess, updateState]);

  const undoMove = useCallback((count = 1) => {
    let changed = false;
    for (let index = 0; index < count; index += 1) {
      if (!chess.undo()) {
        break;
      }
      changed = true;
    }

    if (changed) {
      updateState();
    }
  }, [chess, updateState]);

  const resetGame = useCallback(() => {
    chess.reset();
    updateState();
  }, [chess, updateState]);

  return { state, makeMove, undoMove, resetGame, chess };
};