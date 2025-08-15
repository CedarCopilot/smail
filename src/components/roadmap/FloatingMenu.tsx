import React from 'react';

export type ChatMode = 'floating' | 'sidepanel' | 'caption';

interface FloatingMenuProps {
  onChatModeChange: (mode: ChatMode) => void;
  currentChatMode: ChatMode;
}

export function FloatingMenu({ onChatModeChange, currentChatMode }: FloatingMenuProps) {
  return (
    <div className="absolute top-4 left-4 bg-white/80 dark:bg-gray-800/80 rounded shadow p-2 flex gap-2 z-20">
      {(['caption', 'floating', 'sidepanel'] as ChatMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onChatModeChange(mode)}
          className={`text-xs px-2 py-1 rounded ${currentChatMode === mode ? 'font-bold bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </div>
  );
}

export default FloatingMenu;
