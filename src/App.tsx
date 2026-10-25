import { useEffect, useState, type FC } from 'react';
import type { Color } from 'chess.js';
import { Board } from './components/Board/Board';
import { MoveList } from './components/MoveList';
import { PlayerCard } from './components/PlayerCard';
import { Sidebar } from './components/Sidebar';
import { useChessGame } from './hooks/useChessGame';
import { useStockfish } from './hooks/useStockfish';

const ELO_LEVELS = [400, 600, 800, 1000, 1200, 1320, 1500, 1800, 2000, 2200, 2500, 2800, 3000];
const INITIAL_TIME_SECONDS = 10 * 60;

const App: FC = () => {
  const { state, makeMove, resetGame, undoMove, chess } = useChessGame();
  const [isFlipped, setIsFlipped] = useState(false);
  const [gameMode, setGameMode] = useState<'local' | 'stockfish'>('local');
  const [playerColor, setPlayerColor] = useState<Color>('w');
  const [elo, setElo] = useState(1500);
  const [clocks, setClocks] = useState<Record<Color, number>>({
    w: INITIAL_TIME_SECONDS,
    b: INITIAL_TIME_SECONDS,
  });
  const [timedOutColor, setTimedOutColor] = useState<Color | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const engineColor: Color = playerColor === 'w' ? 'b' : 'w';
  const { status: engineStatus, error: engineError, searchBestMove, cancelSearch } =
    useStockfish(gameMode === 'stockfish');
  const isClockGameOver = timedOutColor !== null;

  useEffect(() => {
    if (state.isGameOver || isClockGameOver) {
      return;
    }

    const clockColor = state.turn;
    const timer = window.setInterval(() => {
      setClocks((currentClocks) => {
        const remainingSeconds = currentClocks[clockColor];
        if (remainingSeconds <= 1) {
          setTimedOutColor(clockColor);
          return { ...currentClocks, [clockColor]: 0 };
        }

        return { ...currentClocks, [clockColor]: remainingSeconds - 1 };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isClockGameOver, state.isGameOver, state.turn]);

  const startNewGame = () => {
    resetGame();
    setClocks({ w: INITIAL_TIME_SECONDS, b: INITIAL_TIME_SECONDS });
    setTimedOutColor(null);
  };

  useEffect(() => {
    if (
      gameMode !== 'stockfish' ||
      engineStatus !== 'ready' ||
      state.turn !== engineColor ||
      state.isGameOver ||
      isClockGameOver
    ) {
      setIsThinking(false);
      return;
    }

    let isCurrentSearch = true;
    setIsThinking(true);
    setMoveError(null);

    searchBestMove(state.fen, elo)
      .then((bestMove) => {
        if (!isCurrentSearch || !bestMove) {
          return;
        }

        const move = {
          from: bestMove.slice(0, 2),
          to: bestMove.slice(2, 4),
          promotion: bestMove[4] ?? 'q',
        };

        if (!makeMove(move)) {
          setMoveError('Stockfish returned a move that could not be played.');
        }
      })
      .catch((error: unknown) => {
        if (isCurrentSearch) {
          setMoveError(
            error instanceof Error ? error.message : 'Stockfish could not find a move.',
          );
        }
      })
      .finally(() => {
        if (isCurrentSearch) {
          setIsThinking(false);
        }
      });

    return () => {
      isCurrentSearch = false;
      cancelSearch();
    };
  }, [
    cancelSearch,
    elo,
    engineColor,
    engineStatus,
    gameMode,
    isClockGameOver,
    makeMove,
    searchBestMove,
    state.fen,
    state.isGameOver,
    state.turn,
  ]);

  const topColor: Color = isFlipped ? 'w' : 'b';
  const bottomColor: Color = isFlipped ? 'b' : 'w';
  const opponentName =
    gameMode === 'stockfish' ? `Stockfish · ${elo}` : 'Opponent';
  const undoCount =
    gameMode === 'stockfish' &&
    state.turn === playerColor &&
    !state.isGameOver &&
    state.history.length > 1
      ? 2
      : 1;
  const boardIsLocked =
    state.isGameOver ||
    isClockGameOver ||
    (gameMode === 'stockfish' &&
      (state.turn !== playerColor || engineStatus !== 'ready' || isThinking));

  const getPlayerName = (color: Color) =>
    color === playerColor ? 'You' : opponentName;

  return (
    <div className="flex h-screen overflow-hidden bg-[#312e2b] font-sans text-white">
      <Sidebar />

      <main className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-4 lg:flex-row">
        <div className="flex w-full max-w-[600px] flex-col gap-2">
          <PlayerCard
            name={getPlayerName(topColor)}
            color={topColor}
            isTurn={state.turn === topColor}
            captured={state.capturedPieces[topColor]}
            remainingSeconds={clocks[topColor]}
          />

          <div className={boardIsLocked ? 'pointer-events-none opacity-80' : undefined}>
            <Board
              chess={chess}
              lastMove={state.lastMove}
              onMove={makeMove}
              isFlipped={isFlipped}
              isInputDisabled={boardIsLocked}
            />
          </div>

          <PlayerCard
            name={getPlayerName(bottomColor)}
            color={bottomColor}
            isTurn={state.turn === bottomColor}
            captured={state.capturedPieces[bottomColor]}
            remainingSeconds={clocks[bottomColor]}
          />
        </div>

        <div className="flex h-[600px] w-full flex-col rounded border border-white/5 bg-[#262421] shadow-xl lg:w-80">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/20 p-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Moves
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => undoMove(undoCount)}
                disabled={isThinking || state.history.length === 0}
                className="rounded bg-white/5 px-3 py-1 text-xs transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={() => setIsFlipped((flipped) => !flipped)}
                disabled={isThinking}
                className="rounded bg-white/5 px-3 py-1 text-xs transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Flip
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-white/5 p-4">
            <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-gray-400">
              Game mode
              <select
                value={gameMode}
                disabled={isThinking}
                onChange={(event) => {
                  const mode = event.target.value === 'stockfish' ? 'stockfish' : 'local';
                  setGameMode(mode);
                  if (mode === 'local') {
                    setPlayerColor('w');
                    setIsFlipped(false);
                  }
                  startNewGame();
                }}
                className="rounded bg-[#312e2b] px-3 py-2 text-sm font-normal normal-case tracking-normal text-white disabled:opacity-50"
              >
                <option value="local">Two players</option>
                <option value="stockfish">Play against Stockfish</option>
              </select>
            </label>

            {gameMode === 'stockfish' && (
              <>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                  Your color
                  <select
                    value={playerColor}
                    disabled={isThinking}
                    onChange={(event) => {
                      const color: Color = event.target.value === 'b' ? 'b' : 'w';
                      setPlayerColor(color);
                      setIsFlipped(color === 'b');
                      startNewGame();
                    }}
                    className="rounded bg-[#312e2b] px-3 py-2 text-sm font-normal normal-case tracking-normal text-white disabled:opacity-50"
                  >
                    <option value="w">White</option>
                    <option value="b">Black</option>
                  </select>
                </label>

                <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                  Stockfish strength · Elo
                  <select
                    value={elo}
                    disabled={isThinking}
                    onChange={(event) => setElo(Number(event.target.value))}
                    className="rounded bg-[#312e2b] px-3 py-2 text-sm font-normal normal-case tracking-normal text-white disabled:opacity-50"
                  >
                    {ELO_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level} Elo{level < 1320 ? ' · approximate' : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <p aria-live="polite" className="text-xs text-gray-400">
                  {engineError ??
                    moveError ??
                    (engineStatus === 'loading'
                      ? 'Loading Stockfish…'
                      : isThinking
                        ? 'Stockfish is thinking…'
                        : 'Stockfish is ready')}
                </p>
              </>
            )}
          </div>

          <MoveList history={state.history} />

          <div className="border-t border-white/5 bg-black/30 p-4">
            {(state.isGameOver || isClockGameOver) && (
              <div className="mb-4 rounded border border-[#81b64c] bg-[#81b64c]/10 p-4 text-center">
                <div className="text-xs font-black uppercase tracking-widest text-[#81b64c]">
                  Game Over
                </div>
                <div className="text-2xl font-black">
                  {isClockGameOver
                    ? `${timedOutColor === 'w' ? 'White' : 'Black'} ran out of time · ${
                        timedOutColor === 'w' ? 'Black' : 'White'
                      } wins!`
                    : state.winner === 'draw'
                      ? 'Draw!'
                      : `${state.winner === 'w' ? 'White' : 'Black'} Won!`}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={startNewGame}
              disabled={isThinking}
              className="w-full rounded-lg bg-[#81b64c] py-4 text-lg font-black text-white shadow-[0_4px_0_rgb(69,103,40)] transition-all hover:bg-[#a3d160] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              NEW GAME
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
