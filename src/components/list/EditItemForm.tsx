import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EditItemFormProps {
  initialValue: string;
  onSave: (val: string) => void;
  onCancel: () => void;
}

export function EditItemForm({
  initialValue,
  onSave,
  onCancel,
}: EditItemFormProps) {
  const [val, setVal] = useState(initialValue);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <li className="list-none mb-2 px-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(val);
        }}
        className="h-16 bg-white px-2 rounded-2xl shadow-md border-2 border-blue-100 flex items-center gap-2"
      >
        <input
          ref={ref}
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="flex-1 px-2 text-lg font-medium text-slate-800 outline-none bg-transparent"
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
    </li>
  );
}
