import { useState, type FC } from 'react';
import { Square } from './Square';
import { Chess, type Move, type Square as ChessSquare } from 'chess.js';
import { PIECE_IMAGES } from '../../utils/chess-utils';

interface BoardProps {
  chess: Chess;
  lastMove: { from: string; to: string } | null;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  isFlipped: boolean;
  isInputDisabled?: boolean;
}

export const Board: FC<BoardProps> = ({
  chess,
  lastMove,
  onMove,
  isFlipped,
  isInputDisabled = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
    color: 'w' | 'b';
  } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const board = chess.board();

  const handleSquareClick = (square: string) => {
    if (isInputDisabled) {
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    const possibleMove = possibleMoves.find((move) => move.to === square);
    if (selectedSquare && possibleMove) {
      const movingPiece = chess.get(selectedSquare as ChessSquare);
      if (possibleMove.promotion && movingPiece) {
        setPendingPromotion({
          from: selectedSquare,
          to: square,
          color: movingPiece.color,
        });
        return;
      }

      onMove({ from: selectedSquare, to: square });
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    const piece = chess.get(square as ChessSquare);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square: square as ChessSquare, verbose: true });
      setPossibleMoves(moves);
    }
  };

  const handleDrop = (to: string, from: string) => {
    if (isInputDisabled || !from) {
      return;
    }

    const movingPiece = chess.get(from as ChessSquare);
    if (!movingPiece || movingPiece.color !== chess.turn()) {
      return;
    }

    const legalMove = chess.moves({
      square: from as ChessSquare,
      verbose: true,
    }).find((move) => move.to === to);

    if (legalMove) {
      if (legalMove.promotion) {
        setPendingPromotion({ from, to, color: movingPiece.color });
      } else {
        onMove({ from, to });
      }
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;
  const displayFiles = isFlipped ? [...files].reverse() : files;

  return (
    <div className="relative aspect-square w-full max-w-[600px]">
      <div className="grid h-full w-full grid-cols-8 grid-rows-8 border-2 border-[#222] shadow-2xl">
        {displayRanks.map((rank, i) => (
          displayFiles.map((file, j) => {
            const squareId = `${file}${rank}`;
            const boardRow = ranks.indexOf(rank);
            const boardCol = files.indexOf(file);
            const piece = board[boardRow][boardCol];

            return (
              <Square
                key={squareId}
                id={squareId}
                color={(i + j) % 2 === 0 ? 'light' : 'dark'}
                piece={piece}
                isLastMove={lastMove?.from === squareId || lastMove?.to === squareId}
                isPossibleMove={possibleMoves.some((move) => move.to === squareId)}
                isCaptureMove={possibleMoves.some((move) => move.to === squareId && move.captured)}
                isCheck={chess.inCheck() && piece?.type === 'k' && piece?.color === chess.turn()}
                onSelect={handleSquareClick}
                onDragStart={(square) => {
                  if (!isInputDisabled) {
                    setSelectedSquare(square);
                    setPossibleMoves(chess.moves({
                      square: square as ChessSquare,
                      verbose: true,
                    }));
                  }
                }}
                onDrop={handleDrop}
                showCoordinates={{
                  file: i === 7 ? file : undefined,
                  rank: j === 0 ? rank : undefined
                }}
              />
            );
          })
        ))}
      </div>
      {pendingPromotion && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/65">
          <p className="text-sm font-bold text-white">Choose a promotion piece</p>
          <div className="flex gap-2">
            {(['q', 'r', 'b', 'n'] as const).map((piece) => (
              <button
                key={piece}
                type="button"
                aria-label={`Promote to ${{
                  q: 'queen',
                  r: 'rook',
                  b: 'bishop',
                  n: 'knight',
                }[piece]}`}
                onClick={() => {
                  onMove({
                    from: pendingPromotion.from,
                    to: pendingPromotion.to,
                    promotion: piece,
                  });
                  setPendingPromotion(null);
                  setSelectedSquare(null);
                  setPossibleMoves([]);
                }}
                className="rounded bg-white p-2 transition-transform hover:scale-110"
              >
                <img
                  src={PIECE_IMAGES[`${pendingPromotion.color}${piece.toUpperCase()}`]}
                  alt=""
                  className="h-12 w-12"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPendingPromotion(null)}
            className="text-xs text-white/80 underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};