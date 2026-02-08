import { ChevronLeft, Share2, Trash2 } from "lucide-react";
import type { RefObject } from "react";
import { AddItemInput } from "./AddItemInput";

interface ListHeaderProps {
  title: string;
  themeColor: string;
  progress: number;
  completedCount: number;
  inputValue: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onBack: () => void;
  onClearCompleted: () => void;
  onShare?: () => void;
  onAddItem: (e: React.FormEvent) => void;
  onInputChange: (value: string) => void;
  onClearInput: () => void;
}

export function ListHeader({
  title,
  themeColor,
  progress,
  completedCount,
  inputValue,
  inputRef,
  onBack,
  onClearCompleted,
  onShare,
  onAddItem,
  onInputChange,
  onClearInput,
}: ListHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm transition-all">
      <div className="flex items-center justify-between px-4 py-3 gap-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 shrink-0 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Назад к спискам"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-bold text-lg truncate flex-1 text-center px-2 min-w-0">
          {title}
        </h2>
        {onShare && (
          <button
            onClick={onShare}
            className="p-2 shrink-0 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors mr-1"
            title="Поделиться"
            aria-label="Поделиться списком"
          >
            <Share2 size={20} />
          </button>
        )}
        <button
          onClick={onClearCompleted}
          disabled={completedCount === 0}
          className="p-2 -mr-2 shrink-0 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors rounded-full"
          title="Удалить завершённые"
          aria-label="Удалить все завершённые товары"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="h-1 w-full bg-slate-100">
        <div
          className={`h-full transition-all duration-500 ease-out ${themeColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4 pb-2">
        <AddItemInput
          value={inputValue}
          onChange={onInputChange}
          onSubmit={onAddItem}
          onClear={onClearInput}
          inputRef={inputRef}
          placeholder="Что купить?"
        />
      </div>
    </div>
  );
}
