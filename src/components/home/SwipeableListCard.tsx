import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { Edit2, GripVertical, LogOut, Share2, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import type { TodoList } from "../../types";

interface SwipeableListCardProps {
  list: TodoList;
  onSelect: () => void;
  onDelete: () => void;
  onRename: () => void;
  onLeave?: () => void;
  onShare?: () => void;
  isOwner: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragging?: boolean;
}

export function SwipeableListCard({
  list,
  onSelect,
  onDelete,
  onRename,
  onLeave,
  onShare,
  isOwner,
  dragHandleProps,
  isDragging,
}: SwipeableListCardProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const [prevList, setPrevList] = useState(list);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  const isDraggingFromHandle = useRef(false);
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover)");
    setHasHover(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setHasHover(e.matches);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (list !== prevList) {
    setPrevList(list);
    setOffset(0);
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDragging) {
      isDraggingFromHandle.current = true;
      return;
    }
    
    const target = e.target as HTMLElement;
    if (dragHandleRef.current && dragHandleRef.current.contains(target)) {
      isDraggingFromHandle.current = true;
      return;
    }
    
    isDraggingFromHandle.current = false;
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging || isDraggingFromHandle.current || !startX.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    if (diff > -120 && diff < 120) {
      setOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging || isDraggingFromHandle.current) {
      isDraggingFromHandle.current = false;
      return;
    }
    if (!startX.current) return;
    if (offset < -50) setOffset(-80);
    else if (offset > 50) setOffset(80);
    else setOffset(0);
    startX.current = null;
  };

  const showLeaveSwipe = !isOwner || (list.members && list.members.length > 0);

  return (
    <div className="relative h-24 mb-3 select-none">
      <div className="absolute inset-0 rounded-2xl flex justify-between items-center overflow-hidden">
        {isOwner ? (
          <>
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
          </>
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onLeave?.();
              setOffset(0);
            }}
            className={`w-1/2 h-full bg-amber-500 flex items-center justify-end pr-6 gap-2 transition-opacity cursor-pointer ${
              offset < 0 ? "opacity-100" : "opacity-0"
            }`}
          >
            <LogOut className="text-white" size={24} />
            <span className="text-white font-medium">Выйти</span>
          </div>
        )}
      </div>

      <div
        className={`relative z-10 h-full bg-white p-5 rounded-2xl shadow-lg border-slate-100 active:scale-[0.98] transition-transform duration-200 ease-out cursor-pointer flex items-center justify-between touch-pan-y overflow-hidden ${
          isDragging ? "ring-2 ring-blue-500 shadow-xl" : ""
        } ${hasHover ? "group" : ""}`}
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

        {dragHandleProps && (
          <div
            {...dragHandleProps}
            ref={dragHandleRef}
            className="flex items-center justify-center p-2 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={() => {
              isDraggingFromHandle.current = true;
            }}
            onTouchStart={() => {
              isDraggingFromHandle.current = true;
            }}
          >
            <GripVertical size={20} />
          </div>
        )}

        <div
          className={`max-md:hidden md:flex items-center gap-1 transition-all duration-200 ${
            hasHover ? "opacity-0 invisible group-hover:opacity-100 group-hover:visible" : "opacity-0 invisible"
          }`}
        >
          {isOwner && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRename();
                }}
                className={`p-2 text-slate-300 rounded-lg transition-colors ${
                  hasHover ? "hover:text-blue-500 hover:bg-blue-50" : ""
                }`}
                title="Редактировать"
              >
                <Edit2 size={18} />
              </button>
              {onShare && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                  className={`p-2 text-slate-300 rounded-lg transition-colors ${
                    hasHover ? "hover:text-blue-500 hover:bg-blue-50" : ""
                  }`}
                  title="Поделиться"
                >
                  <Share2 size={18} />
                </button>
              )}
            </>
          )}
        </div>

        <div className="pl-2 flex-1 min-w-0">
          <h3 className="font-bold text-lg text-slate-800 truncate">
            {list.title}
          </h3>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            {!isOwner && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-medium">
                С вами поделился
                {list.ownerName ? `: ${list.ownerName}` : ""}
              </span>
            )}
            {isOwner && list.members && list.members.length > 0 && (
              <span className="text-slate-500">
                {list.members.length} участн.
              </span>
            )}
            <span>
              {list.items.filter((i) => !i.completed).length} активных •{" "}
              {list.items.length} всего
            </span>
          </p>
        </div>

        <div
          className={`max-md:hidden md:flex items-center gap-1 transition-all duration-200 ${
            hasHover ? "opacity-0 invisible group-hover:opacity-100 group-hover:visible" : "opacity-0 invisible"
          }`}
        >
          {isOwner ? (
            <>
              {showLeaveSwipe && onLeave && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLeave();
                  }}
                  className={`p-2 text-slate-300 rounded-lg transition-colors ${
                    hasHover ? "hover:text-amber-600 hover:bg-amber-50" : ""
                  }`}
                  title="Выйти из списка"
                >
                  <LogOut size={18} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className={`p-2 text-slate-300 rounded-lg transition-colors ${
                  hasHover ? "hover:text-red-500 hover:bg-red-50" : ""
                }`}
                title="Удалить"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            onLeave && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLeave();
                }}
                className={`p-2 text-slate-300 rounded-lg transition-colors ${
                  hasHover ? "hover:text-amber-600 hover:bg-amber-50" : ""
                }`}
                title="Выйти из списка"
              >
                <LogOut size={18} />
              </button>
            )
          )}
        </div>

        {offset > 50 && isOwner && (
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
              if (isOwner) onDelete();
              else onLeave?.();
              setOffset(0);
            }}
            className="absolute inset-y-0 right-[-80px] w-[80px] z-20"
          />
        )}
      </div>
    </div>
  );
}
