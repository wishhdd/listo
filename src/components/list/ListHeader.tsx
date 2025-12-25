import { ChevronLeft, Plus, Search, Trash2, X } from "lucide-react";
import React, { type RefObject } from "react";

interface ListHeaderProps {
  title: string;
  themeColor: string;
  progress: number;
  completedCount: number;
  inputValue: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onBack: () => void;
  onClearCompleted: () => void;
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
  onAddItem,
  onInputChange,
  onClearInput,
}: ListHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm transition-all">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-bold text-lg truncate flex-1 text-center px-2">
          {title}
        </h2>
        <button
          onClick={onClearCompleted}
          disabled={completedCount === 0}
          className="p-2 -mr-2 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
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
        <form onSubmit={onAddItem} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Что купить?"
            className="w-full pl-11 pr-4 py-3.5 bg-slate-100 text-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all text-lg shadow-inner placeholder:text-slate-400"
          />
          <div className="absolute left-3.5 top-3.5 text-slate-400">
            {inputValue.length > 0 ? (
              <Plus
                size={24}
                className={
                  inputValue.length > 2 ? "text-blue-500 transition-colors" : ""
                }
              />
            ) : (
              <Search size={22} />
            )}
          </div>
          {inputValue && (
            <button
              type="button"
              onClick={onClearInput}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 p-1 bg-slate-200 rounded-full"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
