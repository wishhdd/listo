import { Edit2, Trash2 } from "lucide-react";
import React, { useRef, useState } from "react";
import type { TodoList } from "../../types";

interface SwipeableListCardProps {
  list: TodoList;
  onSelect: () => void;
  onDelete: () => void;
  onRename: () => void;
}

export function SwipeableListCard({
  list,
  onSelect,
  onDelete,
  onRename,
}: SwipeableListCardProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const [prevList, setPrevList] = useState(list);

  if (list !== prevList) {
    setPrevList(list);
    setOffset(0);
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    if (diff > -120 && diff < 120) {
      setOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!startX.current) return;
    if (offset < -50) setOffset(-80);
    else if (offset > 50) setOffset(80);
    else setOffset(0);
    startX.current = null;
  };

  return (
    <div className="relative h-24 mb-3 select-none">
      <div className="absolute inset-0 rounded-2xl flex justify-between items-center overflow-hidden">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onRename();
            setOffset(0);
          }}
          className={`w-1/2 h-full bg-blue-500 flex items-center justify-start pl-6 transition-opacity cursor-pointer ${
            offset > 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <Edit2 className="text-white" size={24} />
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`w-1/2 h-full bg-red-500 flex items-center justify-end pr-6 transition-opacity cursor-pointer ${
            offset < 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <Trash2 className="text-white" size={24} />
        </div>
      </div>

      <div
        className="relative z-10 h-full bg-white p-5 rounded-2xl shadow-lg border-slate-100 active:scale-[0.98] transition-transform duration-200 ease-out cursor-pointer flex items-center justify-between group touch-pan-y overflow-hidden"
        style={{ transform: `translateX(${offset}px)` }}
        onClick={() => {
          if (offset === 0) onSelect();
          else setOffset(0);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl ${list.themeColor}`}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="hidden sm:flex opacity-0 group-hover:opacity-100 -ml-2 p-2 text-slate-300 hover:text-blue-500 transition-all items-center justify-center"
        >
          <Edit2 size={18} />
        </button>

        <div className="pl-2 flex-1 min-w-0">
          <h3 className="font-bold text-lg text-slate-800 truncate">
            {list.title}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {list.items.filter((i) => !i.completed).length} активных •{" "}
            {list.items.length} всего
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="hidden sm:block opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
        >
          <Trash2 size={18} />
        </button>

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
    </div>
  );
}
