import { CheckCircle2, Circle, Edit2, Trash2 } from "lucide-react";
import React, { useRef, useState } from "react";
import type { TodoItem } from "../../types";

interface SwipeableItemProps {
  item: TodoItem;
  searchTerm: string;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function SwipeableItem({
  item,
  searchTerm,
  onToggle,
  onRename,
  onDelete,
}: SwipeableItemProps) {
  const [offset, setOffset] = useState(0);
  const [prevProps, setPrevProps] = useState({
    completed: item.completed,
    searchTerm: searchTerm,
  });

  const startX = useRef<number | null>(null);

  if (
    item.completed !== prevProps.completed ||
    searchTerm !== prevProps.searchTerm
  ) {
    setPrevProps({ completed: item.completed, searchTerm: searchTerm });
    setOffset(0);
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

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

  const isMatch =
    searchTerm.length > 0 &&
    item.text.toLowerCase().includes(searchTerm.toLowerCase());

  return (
    <li className="relative h-16 select-none group list-none mb-2">
      <div className="absolute inset-0 rounded-2xl flex justify-between items-center overflow-hidden mx-2">
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
        className={`relative z-10 h-full flex items-center gap-3 px-4 mx-2 rounded-2xl border transition-transform duration-200 ease-out touch-pan-y ${
          item.completed
            ? "bg-slate-50 border-transparent"
            : "bg-white border-slate-100 shadow-sm"
        }`}
        style={{ transform: `translateX(${offset}px)` }}
        onClick={() => {
          if (offset === 0) onToggle();
          else setOffset(0);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`flex-shrink-0 transition-colors ${
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
          className={`flex-1 text-lg leading-snug truncate select-none ${
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

        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
