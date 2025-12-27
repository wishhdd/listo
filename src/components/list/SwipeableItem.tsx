import {
  CheckCircle2,
  Circle,
  Edit2,
  GripVertical,
  Trash2,
} from "lucide-react";
import React, { useRef, useState } from "react";
import type { TodoItem } from "../../types";

interface SwipeableItemProps {
  item: TodoItem;
  index: number;
  searchTerm: string;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDragStart?: (index: number) => void;
  onDragEnter?: (index: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export function SwipeableItem({
  item,
  index,
  searchTerm,
  onToggle,
  onRename,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
}: SwipeableItemProps) {
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startX = useRef<number | null>(null);

  const [prevProps, setPrevProps] = useState({
    completed: item.completed,
    searchTerm: searchTerm,
  });

  if (
    item.completed !== prevProps.completed ||
    searchTerm !== prevProps.searchTerm
  ) {
    setPrevProps({ completed: item.completed, searchTerm: searchTerm });
    setOffset(0);
    setIsAnimating(false);
  }

  const handleToggleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    if (item.completed) {
      onToggle();
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      onToggle();
    }, 400);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX.current || isAnimating) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    if (Math.abs(diff) < 10) return;

    if (diff > -150 && diff < 150) {
      setOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!startX.current) return;
    startX.current = null;

    if (offset < -60) {
      setOffset(-80);
    } else if (offset > 60) {
      setOffset(80);
    } else {
      setOffset(0);
    }
  };

  // --- DRAG AND DROP (Ручка) ---

  // Desktop (Мышь)
  const handleGripDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    if (onDragStart) onDragStart(index);
  };

  const handleGripDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragEnter) onDragEnter(index);
  };

  // Mobile (Сенсор)
  const handleGripTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );
    const listItem = targetElement?.closest("li[data-list-item-index]");

    if (listItem) {
      const targetIndex = Number(listItem.getAttribute("data-list-item-index"));
      if (!isNaN(targetIndex) && onDragEnter) {
        onDragEnter(targetIndex);
      }
    }
  };

  const isMatch =
    searchTerm.length > 0 &&
    item.text.toLowerCase().includes(searchTerm.toLowerCase());

  return (
    <li
      data-list-item-index={index}
      className={`relative select-none group list-none mb-2 transition-all duration-300 ease-out ${
        isAnimating ? "opacity-0 translate-x-10 scale-95" : "opacity-100"
      } ${isDragging ? "z-50 opacity-50" : "z-auto"}`}
      onDragEnter={handleGripDragEnter}
      onDragOver={(e) => e.preventDefault()}
    >
      <div
        className={`absolute inset-0 rounded-2xl flex justify-between items-center overflow-hidden mx-2 ${
          isDragging ? "hidden" : ""
        }`}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onRename();
            setOffset(0);
          }}
          className={`w-1/2 h-full bg-blue-500 flex items-center justify-start pl-5 transition-opacity cursor-pointer ${
            offset > 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <Edit2 className="text-white" size={20} />
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`w-1/2 h-full bg-red-500 flex items-center justify-end pr-5 transition-opacity cursor-pointer ${
            offset < 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <Trash2 className="text-white" size={20} />
        </div>
      </div>

      <div
        className={`relative z-10 flex items-stretch gap-3 px-4 py-3 mx-2 rounded-2xl border transition-transform duration-200 ease-out touch-pan-y min-h-[4rem] ${
          item.completed
            ? "bg-slate-50 border-transparent"
            : "bg-white border-slate-100 shadow-sm"
        }`}
        style={{ transform: `translateX(${offset}px)` }}
        onClick={() => {
          if (offset !== 0) setOffset(0);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={handleToggleClick}
          className={`flex-shrink-0 self-start mt-0.5 transition-colors p-1 -m-1 rounded-full active:scale-90 ${
            item.completed
              ? "text-slate-400"
              : "text-slate-300 hover:text-blue-500"
          }`}
        >
          {item.completed ? (
            <CheckCircle2 size={24} className="text-slate-400" />
          ) : (
            <Circle size={24} />
          )}
        </button>

        <span
          className={`flex-1 text-lg leading-snug break-words whitespace-pre-wrap ${
            item.completed
              ? "line-through text-slate-400 decoration-slate-300 decoration-2"
              : "text-slate-800"
          }`}
        >
          {isMatch ? (
            <>
              {item.text
                .split(new RegExp(`(${searchTerm})`, "gi"))
                .map((part, i) =>
                  part.toLowerCase() === searchTerm.toLowerCase() ? (
                    <span
                      key={i}
                      className="bg-blue-100 text-blue-700 font-bold px-0.5 rounded"
                    >
                      {part}
                    </span>
                  ) : (
                    part
                  )
                )}
            </>
          ) : (
            item.text
          )}
        </span>

        {!item.completed && !searchTerm && (
          <div
            draggable={true}
            className="flex touch-none cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 self-center p-2 -mr-2"
            onDragStart={handleGripDragStart}
            onDragEnd={onDragEnd}
            onTouchStart={() => {
              if (onDragStart) {
                onDragStart(index);
              }
            }}
            onTouchMove={handleGripTouchMove}
            onTouchEnd={onDragEnd}
          >
            <GripVertical size={20} />
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Свайп кнопки */}
        {offset > 50 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename();
              setOffset(0);
            }}
            className="absolute inset-y-0 left-[-80px] w-[80px] z-20"
          />
        )}
        {offset < -50 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute inset-y-0 right-[-80px] w-[80px] z-20"
          />
        )}
      </div>
    </li>
  );
}
