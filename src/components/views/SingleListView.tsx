import { useRef, useState } from "react";
import { useBackNavigation } from "../../hooks/useBackNavigation";
import type { TodoItem, TodoList } from "../../types";
import { generateId } from "../../utils/generateId";
import { EditItemForm } from "../list/EditItemForm";
import { ListHeader } from "../list/ListHeader";
import { SwipeableItem } from "../list/SwipeableItem";

interface SingleListViewProps {
  list: TodoList;
  onBack: () => void;
  onUpdateItems: (items: TodoItem[]) => void;
}

const createTodoItem = (text: string): TodoItem => {
  return {
    id: generateId(),
    text: text,
    completed: false,
    createdAt: Date.now(),
  };
};

export default function SingleListView({
  list,
  onBack,
  onUpdateItems,
}: SingleListViewProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleUiBack = useBackNavigation(onBack);

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

  const displayItems = [...filteredActive, ...filteredCompleted];

  const completedCount = completedItems.length;
  const totalCount = list.items.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) {
      return;
    }
    let targetIndex = index;
    const maxActiveIndex = filteredActive.length - 1;

    if (index === -1 || index > maxActiveIndex) {
      targetIndex = maxActiveIndex;
    }
    if (targetIndex === draggedItemIndex) {
      return;
    }
    const newActiveItems = [...filteredActive];
    const draggedItem = newActiveItems[draggedItemIndex];

    if (!draggedItem) {
      return;
    }
    newActiveItems.splice(draggedItemIndex, 1);
    newActiveItems.splice(targetIndex, 0, draggedItem);

    onUpdateItems([...newActiveItems, ...completedItems]);
    setDraggedItemIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const handleAddItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedText = inputValue.trim();
    if (!trimmedText) return;
    const newItem = createTodoItem(trimmedText);
    onUpdateItems([newItem, ...activeItems, ...completedItems]);
    setInputValue("");
    inputRef.current?.focus();
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
      const otherItems = list.items.filter((i) => i.id !== itemId);
      newItems = [...otherItems, { ...item, completed: true }];
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
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col bg-white relative h-full">
      <ListHeader
        title={list.title}
        themeColor={list.themeColor}
        progress={progress}
        completedCount={completedCount}
        inputValue={inputValue}
        inputRef={inputRef}
        onBack={handleUiBack}
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
        ) : displayItems.length === 0 ? (
          <div className="text-center mt-20 opacity-40 px-6">
            <p>Ничего не найдено.</p>
            <p className="text-sm">
              Нажмите Enter или +, чтобы создать "{inputValue}"
            </p>
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
                  onToggle={() => handleToggleItem(item.id)}
                  onRename={() => setEditingItemId(item.id)}
                  onDelete={() => handleDeleteItem(item.id)}
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
