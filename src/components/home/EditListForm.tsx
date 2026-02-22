import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TodoList } from "../../types";
import { THEME_COLORS } from "../../utils/theme";

interface EditListFormProps {
  list: TodoList;
  onSave: (title: string, color: string) => void;
  onCancel: () => void;
}

export function EditListForm({ list, onSave, onCancel }: EditListFormProps) {
  const [val, setVal] = useState(list.title);
  const [selectedColor, setSelectedColor] = useState(list.themeColor);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(val.trim(), selectedColor);
      }}
      className="min-h-[6rem] p-4 mb-3 bg-white rounded-2xl shadow-md border-2 border-blue-100 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="flex-1 text-lg font-bold text-slate-800 outline-none bg-transparent"
          placeholder="Название..."
        />
        <button
          type="submit"
          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
        >
          <Check size={20} />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-1.5">
        <div className="grid grid-cols-[repeat(auto-fill,2.29rem)] gap-2 justify-center">
          {THEME_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`${color} w-8 h-8 rounded-full flex-shrink-0 transition-transform flex items-center justify-center justify-self-center ${
                color === selectedColor
                  ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                  : ""
              }`}
              aria-label={`Выбрать цвет ${color}`}
            >
              {color === selectedColor ? (
                <Check size={16} className="text-white" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
