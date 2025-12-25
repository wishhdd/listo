import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TodoList } from "../../types";

interface EditListFormProps {
  list: TodoList;
  onSave: (val: string) => void;
  onCancel: () => void;
}

export function EditListForm({ list, onSave, onCancel }: EditListFormProps) {
  const [val, setVal] = useState(list.title);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(val);
      }}
      className="h-24 mb-3 bg-white p-4 rounded-2xl shadow-md border-2 border-blue-100 flex items-center gap-2"
    >
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
    </form>
  );
}
