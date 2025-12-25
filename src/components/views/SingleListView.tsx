import { useEffect, useRef, useState } from "react";
import type { TodoItem, TodoList } from "../../types";
import { EditItemForm } from "../list/EditItemForm";
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

  const processedItems = list.items
    .filter((item) => {
      if (!inputValue) return true;
      return item.text.toLowerCase().includes(inputValue.toLowerCase());
    })
    .sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
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

      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
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
