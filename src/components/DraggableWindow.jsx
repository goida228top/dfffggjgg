import React, { useState, useRef, useEffect } from "react";
import { motion, useDragControls } from "motion/react";

export const DraggableWindow = ({ children, title, defaultPosition = { x: 0, y: 0 }, className = "", handleClassName = "", zIndex = 50, style = {}, ...props }) => {
  const dragControls = useDragControls();
  const [currentZIndex, setCurrentZIndex] = useState(zIndex);

  const bringToFront = () => {
    // Simple way to bring to front without a global state manager
    const windows = document.querySelectorAll('.draggable-window');
    let maxZ = 50;
    windows.forEach(w => {
      const z = parseInt(window.getComputedStyle(w).zIndex) || 50;
      if (z > maxZ) maxZ = z;
    });
    setCurrentZIndex(maxZ + 1);
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={defaultPosition}
      onPointerDown={bringToFront}
      className={`draggable-window fixed flex flex-col bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl border border-white/20 overflow-hidden ${className}`}
      style={{ touchAction: "none", zIndex: currentZIndex, ...style }}
      {...props}
    >
      <div
        className={`h-8 bg-slate-200/80 hover:bg-slate-300/80 cursor-grab active:cursor-grabbing flex items-center justify-center border-b border-black/5 select-none shrink-0 ${handleClassName}`}
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="w-12 h-1.5 bg-slate-400/50 rounded-full" />
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </motion.div>
  );
};
