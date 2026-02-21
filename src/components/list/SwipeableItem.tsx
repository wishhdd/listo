import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import type { MotionValue } from "framer-motion";
import { animate, motion, useMotionValue } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Edit2,
  GripVertical,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { TodoItem } from "../../types";

const SNAP_THRESHOLD = 60;
const SNAP_OPEN = 80;
const DRAG_CONSTRAINTS = { left: -SNAP_OPEN, right: SNAP_OPEN };
const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

interface SwipeableItemProps {
  item: TodoItem;
  searchTerm: string;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragging?: boolean;
}

export function SwipeableItem({
  item,
  searchTerm,
  onToggle,
  onRename,
  onDelete,
  dragHandleProps,
  isDragging,
}: SwipeableItemProps) {
  const x = useMotionValue(0);
  const [snapPosition, setSnapPosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const [prevProps, setPrevProps] = useState({
    completed: item.completed,
    searchTerm: searchTerm,
  });

  if (
    item.completed !== prevProps.completed ||
    searchTerm !== prevProps.searchTerm
  ) {
    setPrevProps({ completed: item.completed, searchTerm: searchTerm });
    x.set(0);
    queueMicrotask(() => setSnapPosition(0));
    setIsAnimating(false);
  }

  useEffect(() => {
    x.set(0);
    queueMicrotask(() => setSnapPosition(0));
  }, [item.id, x]);

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

  const isMatch =
    searchTerm.length > 0 &&
    item.text.toLowerCase().includes(searchTerm.toLowerCase());

  return (
    <motion.div
      className={`relative select-none group mb-2 ${
        isDragging ? "z-50 opacity-90 scale-[1.02]" : "z-auto"
      }`}
      animate={{
        opacity: isAnimating ? 0 : 1,
        x: isAnimating ? 10 : 0,
        scale: isAnimating ? 0.95 : 1,
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        className={`absolute inset-0 rounded-2xl flex justify-between items-center overflow-hidden mx-2 ${
          isDragging ? "hidden" : ""
        }`}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            close(onRename);
          }}
          className="w-1/2 h-full bg-blue-500 flex items-center justify-start pl-5 cursor-pointer"
        >
          <Edit2 className="text-white" size={20} />
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            close(onDelete);
          }}
          className="w-1/2 h-full bg-red-500 flex items-center justify-end pr-5 cursor-pointer"
        >
          <Trash2 className="text-white" size={20} />
        </div>
      </div>

      <motion.div
        className={`relative z-10 flex items-stretch gap-3 px-4 py-3 mx-2 rounded-2xl border transition-colors duration-200 ease-out touch-pan-y min-h-[4rem] ${
          item.completed
            ? "bg-slate-50 border-transparent"
            : "bg-white border-slate-100 shadow-sm"
        } ${isDragging ? "ring-2 ring-blue-500 shadow-xl" : ""}`}
        style={{ x }}
        drag={!isDragging ? "x" : false}
        dragDirectionLock
        dragConstraints={DRAG_CONSTRAINTS}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        transition={SPRING}
        onClick={() => {
          if (snapPosition !== 0) close();
        }}
      >
        <button
          onClick={handleToggleClick}
          className={`flex-shrink-0 self-start mt-0.5 transition-colors p-1 -m-1 rounded-full active:scale-90 ${
            item.completed
              ? "text-slate-400"
              : "text-slate-300 hover:text-blue-500"
          }`}
          aria-label={item.completed ? "Отметить как не купленное" : "Отметить как купленное"}
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

        <div className="hidden md:flex items-center gap-1 self-center transition-all duration-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="Редактировать"
            aria-label="Редактировать пункт"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Удалить"
            aria-label="Удалить пункт"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {!item.completed && !searchTerm && dragHandleProps && (
          <div
            {...dragHandleProps}
            className="flex touch-none cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 self-center p-2 -mr-2 outline-none"
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <GripVertical size={20} />
          </div>
        )}

        {snapPosition > 50 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              close(onRename);
            }}
            className="absolute inset-y-0 left-[-80px] w-[80px] z-20"
          />
        )}
        {snapPosition < -50 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              close(onDelete);
            }}
            className="absolute inset-y-0 right-[-80px] w-[80px] z-20"
          />
        )}
      </motion.div>
    </motion.div>
  );
}
