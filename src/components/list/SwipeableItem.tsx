import { Check, Trash2 } from "lucide-react";
import React, { useRef, useState } from "react";
import type { TodoItem } from "../../types";

interface SwipeableItemProps {
  item: TodoItem;
  searchTerm: string;
  onToggle: () => void;
  onDelete: () => void;
}

export function SwipeableItem({
  item,
  searchTerm,
  onToggle,
  onDelete,
}: SwipeableItemProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const isSwiping = useRef(false);

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
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    if (diff < 0 && diff > -150) {
      setOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!startX.current) return;
    isSwiping.current = false;
    startX.current = null;

    if (offset < -60) {
      setOffset(-80);
    } else {
      setOffset(0);
    }
  };

  const isMatch =
    searchTerm.length > 2 &&
    item.text.toLowerCase().includes(searchTerm.toLowerCase());

  return (
    <li className="relative overflow-hidden mb-1">
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-xl mx-2 my-0.5">
        <Trash2 className="text-white" size={24} />
      </div>

      <div
        className={`relative z-10 flex items-center gap-3 p-3 mx-2 rounded-xl border border-transparent transition-transform duration-200 ease-out bg-white ${
          item.completed ? "opacity-60 bg-slate-50" : "shadow-sm"
        }`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
            item.completed
              ? `border-slate-300 bg-slate-200 text-slate-500`
              : `border-slate-300 text-transparent hover:border-blue-400`
          }`}
        >
          <Check size={14} strokeWidth={3} />
        </button>

        <span
          onClick={onToggle}
          className={`flex-1 text-lg leading-snug cursor-pointer select-none py-1 ${
            item.completed
              ? "line-through text-slate-400 decoration-slate-300"
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

        {offset < -10 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center"
          ></button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="hidden sm:block opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-opacity"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </li>
  );
}
