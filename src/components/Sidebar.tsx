import type { FC } from 'react';

const menuItems = [
  { icon: '♟', label: 'Play' },
  { icon: '🧩', label: 'Puzzles' },
  { icon: '🎓', label: 'Learn' },
  { icon: '⚙️', label: 'Settings' },
];

export const Sidebar: FC = () => (
  <div className="hidden w-20 flex-col items-center gap-8 bg-chess-card py-6 md:flex lg:w-40">
    <div className="mb-4 text-4xl font-black text-chess-green">♞</div>
    {menuItems.map((item) => (
      <button
        key={item.label}
        type="button"
        className="flex flex-col items-center gap-2 text-gray-400 transition-colors hover:text-white lg:flex-row"
      >
        <span className="text-2xl">{item.icon}</span>
        <span className="hidden text-xs font-bold uppercase lg:block lg:text-sm">
          {item.label}
        </span>
      </button>
    ))}
  </div>
);
