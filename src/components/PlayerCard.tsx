import type { FC } from 'react';
import type { PieceSymbol } from 'chess.js';
import { PIECE_IMAGES } from '../utils/chess-utils';

interface PlayerCardProps {
  name: string;
  isTurn: boolean;
  captured: PieceSymbol[];
  color: 'w' | 'b';
  remainingSeconds: number;
}

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const PlayerCard: FC<PlayerCardProps> = ({
  name,
  isTurn,
  captured,
  color,
  remainingSeconds,
}) => {
  return (
    <div className={`flex items-center justify-between p-2 rounded ${isTurn ? 'bg-white/5' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center font-bold text-xl uppercase">
          {name[0]}
        </div>
        <div>
          <div className="font-bold flex items-center gap-2">
            {name} {isTurn && <div className="w-2 h-2 bg-[#81b64c] rounded-full animate-pulse" />}
          </div>
          <div className="flex flex-wrap gap-0.5 h-5">
            {captured.map((p, i) => (
              <img 
                key={i} 
                src={PIECE_IMAGES[`${color === 'w' ? 'b' : 'w'}${p.toUpperCase()}`]} 
                className="w-4 h-4 opacity-80" 
                alt="" 
              />
            ))}
          </div>
        </div>
      </div>
      <div
        aria-label={`${name} time ${formatTime(remainingSeconds)}`}
        className={`rounded px-3 py-1 font-mono text-xl ${
          isTurn ? 'bg-[#81b64c] text-white' : 'bg-black/30'
        }`}
      >
        {formatTime(remainingSeconds)}
      </div>
    </div>
  );
};