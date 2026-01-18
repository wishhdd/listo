import { useMemo, useRef, useState } from "react";
import { useBackNavigation } from "../../hooks/useBackNavigation";
import type { TodoItem, TodoList } from "../../types";
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

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null); // ЧТО тащим
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null); // КУДА тащим

  const handleUiBack = useBackNavigation(onBack);

  const activeItems = useMemo(
    () => list.items.filter((i) => !i.completed),
    [list.items]
  );
  const sortedActiveItems = useMemo(
    () =>
      [...activeItems].sort((a, b) => (a.position || 0) - (b.position || 0)),
    [activeItems]
  );
  const completedItems = list.items.filter((i) => i.completed);

  const displayActive = sortedActiveItems.filter(
    (i) =>
      !inputValue || i.text.toLowerCase().includes(inputValue.toLowerCase())
  );
  const displayCompleted = completedItems.filter(
    (i) =>
      !inputValue || i.text.toLowerCase().includes(inputValue.toLowerCase())
  );
  const displayItems = [...displayActive, ...displayCompleted];

  const completedCount = completedItems.length;
  const totalCount = list.items.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

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

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedItemIndex === null || dragOverIndex === null) {
      setDraggedItemIndex(null);
      setDragOverIndex(null);
      return;
    }

    const movedItem = sortedActiveItems[draggedItemIndex];
    if (!movedItem) return;

    if (dragOverIndex === -1) {
      const lastActive = sortedActiveItems[sortedActiveItems.length - 1];
      const lastPos = lastActive ? lastActive.position || 0 : 0;
      const newPosition = lastPos + 1024;
      onUpdateItem(movedItem.id, { position: newPosition });
    } else if (draggedItemIndex !== dragOverIndex) {
      const targetItem = sortedActiveItems[dragOverIndex];

      if (targetItem) {
        let newPosition = 0;

        if (dragOverIndex === 0) {
          const firstPos = sortedActiveItems[0].position || 0;
          newPosition = firstPos - 1024;
        } else if (dragOverIndex === sortedActiveItems.length - 1) {
          const lastPos =
            sortedActiveItems[sortedActiveItems.length - 1].position || 0;
          newPosition = lastPos + 1024;
        } else {
          if (draggedItemIndex < dragOverIndex) {
            const afterTarget = sortedActiveItems[dragOverIndex + 1];
            const targetPos = targetItem.position || 0;
            const nextPos = afterTarget
              ? afterTarget.position || 0
              : targetPos + 2048;
            newPosition = (targetPos + nextPos) / 2;
          } else {
            const beforeTarget = sortedActiveItems[dragOverIndex - 1];
            const targetPos = targetItem.position || 0;
            const prevPos = beforeTarget
              ? beforeTarget.position || 0
              : targetPos - 2048;
            newPosition = (prevPos + targetPos) / 2;
          }
        }
        onUpdateItem(movedItem.id, { position: newPosition });
      }
    }
    setDraggedItemIndex(null);
    setDragOverIndex(null);
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
                Начните вводить текст, чтобы добавить элемент'.
              </p>
            </div>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center mt-20 opacity-40 px-6">
            <p>Ничего не найдено.</p>
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {displayItems.map((item) => {
              const isActive = !item.completed;
              const activeIndex = isActive
                ? sortedActiveItems.findIndex((i) => i.id === item.id)
                : -1;

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
