import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import type { MotionValue } from "framer-motion";
import { animate, motion, useMotionValue } from "framer-motion";
import { Edit2, GripVertical, LogOut, Share2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { TodoList } from "../../types";

const SNAP_THRESHOLD = 50;
const SNAP_OPEN = 80;
const DRAG_CONSTRAINTS = { left: -SNAP_OPEN, right: SNAP_OPEN };
const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

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
  const x = useMotionValue(0);
  const [snapPosition, setSnapPosition] = useState(0);
  const [hasHover, setHasHover] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover)");
    const handleChange = (e: MediaQueryListEvent) => {
      setHasHover(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    x.set(0);
    queueMicrotask(() => setSnapPosition(0));
  }, [list.id, x]);

  const runSnap = (target: number) => {
    (animate as (value: MotionValue<number>, keyframes: number, options?: { transition: typeof SPRING }) => unknown)(x, target, { transition: SPRING });
  };

  const handleDragEnd = () => {
    const current = x.get();
    const snap = current < -SNAP_THRESHOLD ? -SNAP_OPEN : current > SNAP_THRESHOLD ? SNAP_OPEN : 0;
    setSnapPosition(snap);
    runSnap(snap);
  };

  const close = (fn?: () => void) => {
    fn?.();
    setSnapPosition(0);
    runSnap(0);
  };

  const showLeaveSwipe = !isOwner || (list.members && list.members.length > 0);

  return (
    <div className="relative h-24 mb-3 select-none">
      <div className="absolute inset-0 rounded-2xl flex justify-between items-center overflow-hidden">
        {isOwner ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                close(onRename);
              }}
              aria-label="Редактировать список"
              className="w-1/2 h-full bg-blue-500 flex items-center justify-start pl-6 cursor-pointer border-0 appearance-none"
            >
              <Edit2 className="text-white" size={24} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Удалить список"
              className="w-1/2 h-full bg-red-500 flex items-center justify-end pr-6 cursor-pointer border-0 appearance-none"
            >
              <Trash2 className="text-white" size={24} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close(onLeave);
            }}
            aria-label="Выйти из списка"
            className="w-1/2 h-full bg-amber-500 flex items-center justify-end pr-6 gap-2 cursor-pointer border-0 appearance-none"
          >
            <LogOut className="text-white" size={24} />
            <span className="text-white font-medium">Выйти</span>
          </button>
        )}
      </div>

      <motion.div
        className={`relative z-10 h-full bg-white p-5 rounded-2xl shadow-lg border-slate-100 active:scale-[0.98] transition-transform duration-200 ease-out cursor-pointer flex items-center justify-between touch-pan-y overflow-hidden ${
          isDragging ? "ring-2 ring-blue-500 shadow-xl" : ""
        } ${hasHover ? "group" : ""}`}
        style={{ x }}
        drag={!isDragging ? "x" : false}
        dragDirectionLock
        dragConstraints={DRAG_CONSTRAINTS}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        transition={SPRING}
        onClick={() => {
          if (snapPosition === 0) onSelect();
          else close();
        }}
      >
        <div
          className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl ${list.themeColor}`}
        />

        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="flex items-center justify-center p-2 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
            onPointerDownCapture={(e) => e.stopPropagation()}
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
                aria-label="Переименовать список"
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
                  aria-label="Поделиться списком"
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
                  aria-label="Выйти из списка"
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
                aria-label="Удалить список"
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
                aria-label="Выйти из списка"
              >
                <LogOut size={18} />
              </button>
            )
          )}
        </div>

        {snapPosition > SNAP_THRESHOLD && isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              close(onRename);
            }}
            className="absolute inset-y-0 left-[-80px] w-[80px] z-20"
          />
        )}
        {snapPosition < -SNAP_THRESHOLD && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isOwner) onDelete();
              else onLeave?.();
              close();
            }}
            className="absolute inset-y-0 right-[-80px] w-[80px] z-20"
          />
        )}
      </motion.div>
    </div>
  );
}
