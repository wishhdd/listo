import { Plus, Search, X } from "lucide-react";
import { type RefObject } from "react";

interface AddItemInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  placeholder?: string;
  className?: string;
}

export function AddItemInput({
  value,
  onChange,
  onSubmit,
  onClear,
  inputRef,
  placeholder = "Добавить продукт...",
  className = "",
}: AddItemInputProps) {
  const showPlus = value.length > 0;
  const isSearchActive = value.length > 2;

  return (
    <form onSubmit={onSubmit} className={`relative w-full ${className}`}>
      <input
        ref={inputRef as RefObject<HTMLInputElement>}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3.5 bg-slate-100 text-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all text-lg shadow-inner placeholder:text-slate-400"
      />

      <div className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none transition-colors duration-200">
        {showPlus ? (
          <Plus size={24} className={isSearchActive ? "text-blue-500" : ""} />
        ) : (
          <Search size={22} />
        )}
      </div>

      {value.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 p-1 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
          aria-label="Очистить поле"
        >
          <X size={14} />
        </button>
      )}
    </form>
  );
}
