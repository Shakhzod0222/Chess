import type { FC } from 'react';
import { PIECE_IMAGES } from '../../utils/chess-utils';
import type { Color, PieceSymbol } from 'chess.js';

interface SquareProps {
  id: string;
  color: 'light' | 'dark';
  piece: { type: PieceSymbol; color: Color } | null;
  isLastMove: boolean;
  isPossibleMove: boolean;
  isCaptureMove: boolean;
  isCheck: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string, from: string) => void;
  showCoordinates: { file?: string; rank?: string };
}

export const Square: FC<SquareProps> = ({ 
  id, color, piece, isLastMove, isPossibleMove, isCaptureMove, isCheck, onSelect,
  onDragStart, onDrop, showCoordinates
}) => {
  return (
    <div 
      data-square={id}
      draggable={Boolean(piece)}
      className={`relative w-full h-full flex items-center justify-center cursor-pointer select-none
        ${color === 'light' ? 'bg-[#eeeed2]' : 'bg-[#769656]'}
        ${isLastMove ? 'after:absolute after:inset-0 after:bg-yellow-400/40' : ''}
        ${isCheck ? 'bg-red-500/80' : ''}`}
      onClick={() => onSelect(id)}
      onDragStart={(event) => {
        if (!piece) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData('text/plain', id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(id);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(id, event.dataTransfer.getData('text/plain'));
      }}
    >
      {showCoordinates.file && (
        <span className={`absolute bottom-0.5 right-0.5 text-[10px] font-bold ${color === 'light' ? 'text-[#769656]' : 'text-[#eeeed2]'}`}>
          {showCoordinates.file}
        </span>
      )}
      {showCoordinates.rank && (
        <span className={`absolute top-0.5 left-0.5 text-[10px] font-bold ${color === 'light' ? 'text-[#769656]' : 'text-[#eeeed2]'}`}>
          {showCoordinates.rank}
        </span>
      )}

      {piece && (
        <img 
          src={PIECE_IMAGES[`${piece.color}${piece.type.toUpperCase()}`]} 
          alt=""
          className="w-[90%] h-[90%] z-10"
        />
      )}

      {isPossibleMove && (
        <div className={`pointer-events-none z-20 ${isCaptureMove ? 'w-[85%] h-[85%] border-[6px] border-black/10 rounded-full' : 'w-4 h-4 bg-black/10 rounded-full'}`} />
      )}
    </div>
  );
};