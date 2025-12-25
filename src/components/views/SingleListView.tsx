import { AlertCircle } from "lucide-react";
import React, { useRef, useState } from "react";
import { useListSort } from "../../hooks/useListSort";
import type { TodoItem, TodoList } from "../../types";
import { ListHeader } from "../list/ListHeader";
import { SwipeableItem } from "../list/SwipeableItem";

const generateId = () => Math.random().toString(36).slice(2, 11);

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

  const processedItems = useListSort(list.items, inputValue);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newItem: TodoItem = {
      id: generateId(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    onUpdateItems([newItem, ...list.items]);
    setInputValue("");
  };

  const toggleItem = (itemId: string) => {
    onUpdateItems(
      list.items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );

    if (inputValue.length > 0) {
      setInputValue("");
    }
  };

  const deleteItem = (itemId: string) => {
    onUpdateItems(list.items.filter((i) => i.id !== itemId));
  };

  const clearCompleted = () => {
    if (confirm("Удалить все завершенные?")) {
      onUpdateItems(list.items.filter((i) => !i.completed));
    }
  };

  const completedCount = list.items.filter((i) => i.completed).length;
  const totalCount = list.items.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white">
      <ListHeader
        title={list.title}
        themeColor={list.themeColor}
        progress={progress}
        completedCount={completedCount}
        inputValue={inputValue}
        inputRef={inputRef}
        onBack={onBack}
        onClearCompleted={clearCompleted}
        onAddItem={handleAddItem}
        onInputChange={setInputValue}
        onClearInput={() => setInputValue("")}
      />

      <div className="flex-1 overflow-x-hidden">
        {processedItems.length === 0 ? (
          <div className="text-center mt-12 text-slate-400 px-6">
            {inputValue ? (
              <p>
                Ничего не найдено.
                <br />
                Нажми Enter или Плюс, чтобы добавить.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 opacity-50" />
                <p>Список пуст.</p>
              </div>
            )}
          </div>
        ) : (
          <ul className="pb-32">
            {processedItems.map((item) => (
              <SwipeableItem
                key={item.id}
                item={item}
                searchTerm={inputValue}
                onToggle={() => toggleItem(item.id)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
