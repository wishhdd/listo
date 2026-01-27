import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
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

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const movedItem = sortedActiveItems.find((i) => i.id === draggableId);
    if (!movedItem) return;

    if (destination.droppableId === "zone-top") {
      const first = sortedActiveItems[0];
      const firstPos = first ? first.position || 0 : 0;
      const newPosition = firstPos - 1024;

      console.log(`Drop to TOP: ${newPosition}`);
      onUpdateItem(movedItem.id, { position: newPosition });
      return;
    }

    if (destination.droppableId === "zone-bottom") {
      const last = sortedActiveItems[sortedActiveItems.length - 1];
      const lastPos = last ? last.position || 0 : 0;
      const newPosition = lastPos + 1024;

      console.log(`Drop to BOTTOM: ${newPosition}`);
      onUpdateItem(movedItem.id, { position: newPosition });
      return;
    }

    if (destination.droppableId === "active-list") {
      const reorderedList = Array.from(sortedActiveItems);
      const [removed] = reorderedList.splice(source.index, 1);
      reorderedList.splice(destination.index, 0, removed);

      let newPosition = 0;

      if (destination.index === 0) {
        const first = reorderedList[1];
        newPosition = (first?.position || 0) - 1024;
      } else if (destination.index === reorderedList.length - 1) {
        const last = reorderedList[destination.index - 1];
        newPosition = (last?.position || 0) + 1024;
      } else {
        const prev = reorderedList[destination.index - 1];
        const next = reorderedList[destination.index + 1];
        newPosition = ((prev?.position || 0) + (next?.position || 0)) / 2;
      }

      onUpdateItem(movedItem.id, { position: newPosition });
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto min-h-screen flex flex-col bg-white relative h-full">
        <Droppable droppableId="zone-top">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="sticky top-0 z-40 bg-white"
            >
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
              <div className="hidden">{provided.placeholder}</div>
            </div>
          )}
        </Droppable>

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
          {list.items.length === 0 ? (
            <div className="text-center mt-20 opacity-40 px-6">
              <div className="flex flex-col items-center gap-2">
                <p>Список пуст.</p>
                <p className="text-sm">Начните вводить текст...</p>
              </div>
            </div>
          ) : displayActive.length === 0 && displayCompleted.length === 0 ? (
            <div className="text-center mt-20 opacity-40 px-6">
              <p>Ничего не найдено.</p>
            </div>
          ) : (
            <>
              <Droppable droppableId="active-list">
                {(provided) => (
                  <div
                    className="p-2 min-h-[10px]"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {displayActive.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                        isDragDisabled={
                          !!inputValue ||
                          item.completed ||
                          editingItemId === item.id
                        }
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="outline-none"
                          >
                            {editingItemId === item.id ? (
                              <EditItemForm
                                initialValue={item.text}
                                onSave={(val) => handleRenameItem(item.id, val)}
                                onCancel={() => setEditingItemId(null)}
                              />
                            ) : (
                              <SwipeableItem
                                item={item}
                                searchTerm={inputValue}
                                onToggle={() => handleToggleItem(item)}
                                onRename={() => setEditingItemId(item.id)}
                                onDelete={() => onDeleteItem(item.id)}
                                isDragging={snapshot.isDragging}
                                dragHandleProps={provided.dragHandleProps}
                              />
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {displayCompleted.length > 0 && (
                <Droppable droppableId="zone-bottom">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 pt-0 mt-2 transition-colors duration-200 ${
                        snapshot.isDraggingOver ? "bg-slate-50 rounded-xl" : ""
                      }`}
                    >
                      <div className="opacity-60">
                        {displayActive.length > 0 && (
                          <hr className="my-2 border-slate-100" />
                        )}
                        {displayCompleted.map((item) => (
                          <SwipeableItem
                            key={item.id}
                            item={item}
                            searchTerm={inputValue}
                            onToggle={() => handleToggleItem(item)}
                            onRename={() => setEditingItemId(item.id)}
                            onDelete={() => onDeleteItem(item.id)}
                          />
                        ))}
                      </div>
                      <div className="hidden">{provided.placeholder}</div>
                    </div>
                  )}
                </Droppable>
              )}
            </>
          )}
        </main>
      </div>
    </DragDropContext>
  );
}
