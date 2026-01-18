import { useRef, useState } from "react";
import type { TodoItem, TodoList } from "../../types";
// Теперь пути верные, так как файлы восстановлены
import { useBackNavigation } from "../../hooks/useBackNavigation";
import { EditItemForm } from "../list/EditItemForm";
import { ListHeader } from "../list/ListHeader";
import { SwipeableItem } from "../list/SwipeableItem";

interface SingleListViewProps {
  list: TodoList;
  onBack: () => void;
  onAddItem: (text: string) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<TodoItem>) => void;
}

export default function SingleListView({
  list,
  onBack,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
}: SingleListViewProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleUiBack = useBackNavigation(onBack);

  // --- ЛОГИКА СОРТИРОВКИ ДЛЯ ОТОБРАЖЕНИЯ ---
  const activeItems = list.items.filter((i) => !i.completed);
  const completedItems = list.items.filter((i) => i.completed);

  const filteredActive = activeItems.filter(
    (i) =>
      !inputValue || i.text.toLowerCase().includes(inputValue.toLowerCase())
  );
  const filteredCompleted = completedItems.filter(
    (i) =>
      !inputValue || i.text.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Сортировка активных по position (для Drag-and-Drop)
  filteredActive.sort((a, b) => (a.position || 0) - (b.position || 0));

  const displayItems = [...filteredActive, ...filteredCompleted];
  const completedCount = completedItems.length;
  const totalCount = list.items.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  // --- HANDLERS ---

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const onFormSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      onAddItem(inputValue.trim());
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  const handleToggleItem = (item: TodoItem) => {
    onUpdateItem(item.id, { completed: !item.completed });
  };

  const handleRenameItem = (itemId: string, newText: string) => {
    if (newText.trim()) {
      onUpdateItem(itemId, { text: newText.trim() });
    }
    setEditingItemId(null);
  };

  const handleClearCompleted = () => {
    if (confirm("Удалить все завершенные товары?")) {
      completedItems.forEach((item) => onDeleteItem(item.id));
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
        onBack={handleUiBack}
        onClearCompleted={handleClearCompleted}
        onAddItem={onFormSubmit}
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
        ) : displayItems.length === 0 ? (
          <div className="text-center mt-20 opacity-40 px-6">
            <p>Ничего не найдено.</p>
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {displayItems.map((item, index) => {
              const isActive = !item.completed;
              const activeIndex = isActive ? index : -1;

              return editingItemId === item.id ? (
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
                  index={activeIndex}
                  searchTerm={inputValue}
                  onToggle={() => handleToggleItem(item)}
                  onRename={() => setEditingItemId(item.id)}
                  onDelete={() => onDeleteItem(item.id)}
                  isDragging={draggedItemIndex === activeIndex && isActive}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                />
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
