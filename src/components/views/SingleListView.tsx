import { Check, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import type { TodoItem, TodoList } from "../../types";
import { ListHeader } from "../list/ListHeader";
import { SwipeableItem } from "../list/SwipeableItem";

interface SingleListViewProps {
  list: TodoList;
  onBack: () => void;
  onUpdateItems: (items: TodoItem[]) => void;
}

export default function SingleListView({
  list,
  onBack,
  onUpdateItems,
}: SingleListViewProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Фильтрация
  const processedItems = list.items.filter((item) => {
    if (!inputValue) return true;
    return item.text.toLowerCase().includes(inputValue.toLowerCase());
  });

  const completedCount = list.items.filter((i) => i.completed).length;
  const totalCount = list.items.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAddItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      const newItem: TodoItem = {
        id: crypto.randomUUID(),
        text: inputValue.trim(),
        completed: false,
        createdAt: Date.now(),
      };
      onUpdateItems([newItem, ...list.items]);
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  const handleToggleItem = (itemId: string) => {
    const item = list.items.find((i) => i.id === itemId);
    if (!item) return;

    const newCompleted = !item.completed;
    let newItems: TodoItem[];

    if (!newCompleted) {
      const otherItems = list.items.filter((i) => i.id !== itemId);
      newItems = [{ ...item, completed: false }, ...otherItems];
    } else {
      newItems = list.items.map((i) =>
        i.id === itemId ? { ...i, completed: true } : i
      );
    }

    onUpdateItems(newItems);
  };

  const handleRenameItem = (itemId: string, newText: string) => {
    if (newText.trim()) {
      onUpdateItems(
        list.items.map((i) =>
          i.id === itemId ? { ...i, text: newText.trim() } : i
        )
      );
    }
    setEditingItemId(null);
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdateItems(list.items.filter((i) => i.id !== itemId));
  };

  const handleClearCompleted = () => {
    if (confirm("Удалить все завершенные товары?")) {
      onUpdateItems(list.items.filter((i) => !i.completed));
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white relative h-full">
      <ListHeader
        title={list.title}
        themeColor={list.themeColor}
        progress={progress}
        completedCount={completedCount}
        inputValue={inputValue}
        inputRef={inputRef}
        onBack={onBack}
        onClearCompleted={handleClearCompleted}
        onAddItem={handleAddItem}
        onInputChange={setInputValue}
        onClearInput={() => setInputValue("")}
      />

      <main className="flex-1 overflow-y-auto pb-32">
        {list.items.length === 0 ? (
          <div className="text-center mt-20 opacity-40 px-6">
            <div className="flex flex-col items-center gap-2">
              <p>Список пуст.</p>
              <p className="text-sm">
                Начните вводить текст, чтобы добавить товары.
              </p>
            </div>
          </div>
        ) : processedItems.length === 0 ? (
          <div className="text-center mt-20 opacity-40 px-6">
            <p>Ничего не найдено.</p>
            <p className="text-sm">
              Нажмите Enter или +, чтобы создать "{inputValue}"
            </p>
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {processedItems.map((item) =>
              editingItemId === item.id ? (
                <EditItemForm
                  key={item.id}
                  initialValue={item.text}
                  onSave={(val) => handleRenameItem(item.id, val)}
                  onCancel={() => setEditingItemId(null)}
                />
              ) : (
                <SwipeableItem
                  key={item.id}
                  item={item}
                  searchTerm={inputValue}
                  onToggle={() => handleToggleItem(item.id)}
                  onRename={() => setEditingItemId(item.id)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              )
            )}
          </ul>
        )}
      </main>
    </div>
  );
}

// Вспомогательный компонент для формы редактирования
function EditItemForm({
  initialValue,
  onSave,
  onCancel,
}: {
  initialValue: string;
  onSave: (val: string) => void;
  onCancel: () => void;
}) {
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
