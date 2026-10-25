import { useEffect, useRef, type FC } from 'react';

export const MoveList: FC<{ history: string[] }> = ({ history }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const pairs: string[][] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push([history[i], history[i + 1] || '']);
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-2">
      <div className="flex flex-col">
        {pairs.map((pair, idx) => (
          <div key={idx} className={`grid grid-cols-3 p-1.5 text-sm ${idx % 2 === 0 ? 'bg-white/5' : ''}`}>
            <div className="text-gray-500 font-mono">{idx + 1}.</div>
            <div className="font-semibold">{pair[0]}</div>
            <div className="font-semibold">{pair[1]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};