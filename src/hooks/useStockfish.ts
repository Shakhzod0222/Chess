import { useCallback, useEffect, useRef, useState } from 'react';

type EngineStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PendingSearch {
  resolve: (move: string | null) => void;
}

export const useStockfish = (enabled: boolean) => {
  const workerRef = useRef<Worker | null>(null);
  const pendingSearchRef = useRef<PendingSearch | null>(null);
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);

    let worker: Worker;
    try {
      worker = new Worker(
        `${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js`,
      );
    } catch (workerError) {
      setError(
        workerError instanceof Error
          ? workerError.message
          : 'Stockfish engine could not be started.',
      );
      setStatus('error');
      return;
    }

    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data !== 'string') {
        return;
      }

      if (event.data === 'uciok') {
        worker.postMessage('isready');
      } else if (event.data === 'readyok') {
        setStatus('ready');
      } else if (event.data.startsWith('bestmove ')) {
        const pendingSearch = pendingSearchRef.current;
        pendingSearchRef.current = null;
        const move = event.data.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/)?.[1] ?? null;
        pendingSearch?.resolve(move);
      }
    };

    worker.onerror = (event) => {
      setError(event.message || 'Stockfish engine could not be loaded.');
      setStatus('error');
      pendingSearchRef.current?.resolve(null);
      pendingSearchRef.current = null;
    };

    worker.postMessage('uci');

    return () => {
      pendingSearchRef.current?.resolve(null);
      pendingSearchRef.current = null;
      worker.terminate();
      workerRef.current = null;
    };
  }, [enabled]);

  const cancelSearch = useCallback(() => {
    if (pendingSearchRef.current) {
      pendingSearchRef.current.resolve(null);
      pendingSearchRef.current = null;
      workerRef.current?.postMessage('stop');
    }
  }, []);

  const searchBestMove = useCallback(
    (fen: string, elo: number) =>
      new Promise<string | null>((resolve, reject) => {
        const worker = workerRef.current;
        if (!worker || status !== 'ready') {
          reject(new Error('Stockfish engine is not ready.'));
          return;
        }

        cancelSearch();
        pendingSearchRef.current = { resolve };
        if (elo < 1320) {
          const skillLevel = Math.round(((elo - 400) / 800) * 5);
          worker.postMessage('setoption name UCI_LimitStrength value false');
          worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
        } else {
          worker.postMessage('setoption name Skill Level value 20');
          worker.postMessage('setoption name UCI_LimitStrength value true');
          worker.postMessage(`setoption name UCI_Elo value ${elo}`);
        }
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage('go movetime 1000');
      }),
    [cancelSearch, status],
  );

  return { status, error, searchBestMove, cancelSearch };
};
