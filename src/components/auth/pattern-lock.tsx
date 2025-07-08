'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Dot {
  id: number;
  x: number;
  y: number;
}

interface PatternLockProps {
  onComplete: (pattern: number[]) => void;
  className?: string;
}

const DOT_COUNT = 3;
const DOT_SIZE = 24;
const DOT_HITBOX_SIZE = 48;
const GRID_GAP = 60;

export function PatternLock({ onComplete, className }: PatternLockProps) {
  const [dots, setDots] = useState<Dot[]>([]);
  const [activeDots, setActiveDots] = useState<number[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generatedDots: Dot[] = [];
    for (let i = 0; i < DOT_COUNT; i++) {
      for (let j = 0; j < DOT_COUNT; j++) {
        generatedDots.push({
          id: i * DOT_COUNT + j + 1,
          x: j * (DOT_SIZE + GRID_GAP) + DOT_SIZE / 2,
          y: i * (DOT_SIZE + GRID_GAP) + DOT_SIZE / 2,
        });
      }
    }
    setDots(generatedDots);
  }, []);

  const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setActiveDots([]);
    const pos = getEventPosition(e);
    if (!pos) return;
    
    const targetDot = dots.find(dot => 
        Math.abs(dot.x - pos.x) < DOT_HITBOX_SIZE / 2 && 
        Math.abs(dot.y - pos.y) < DOT_HITBOX_SIZE / 2
    );

    if (targetDot) {
        setActiveDots([targetDot.id]);
    }
  };

  const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getEventPosition(e);
    if (!pos) return;

    setMousePos(pos);

    const targetDot = dots.find(dot => 
        Math.abs(dot.x - pos.x) < DOT_HITBOX_SIZE / 2 && 
        Math.abs(dot.y - pos.y) < DOT_HITBOX_SIZE / 2
    );
    
    if (targetDot && !activeDots.includes(targetDot.id)) {
      setActiveDots(prev => [...prev, targetDot.id]);
    }
  };

  const handleInteractionEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setMousePos(null);
    if (activeDots.length > 0) {
      onComplete(activeDots);
    }
    // Reset after a short delay for visual feedback
    setTimeout(() => setActiveDots([]), 300);
  };

  const getLinePath = () => {
    if (activeDots.length < 1) return '';
    let path = `M ${dots.find(d => d.id === activeDots[0])?.x} ${dots.find(d => d.id === activeDots[0])?.y}`;
    activeDots.slice(1).forEach(id => {
      const dot = dots.find(d => d.id === id);
      if (dot) path += ` L ${dot.x} ${dot.y}`;
    });
    return path;
  };
  
  const containerWidth = (DOT_COUNT - 1) * (DOT_SIZE + GRID_GAP) + DOT_SIZE;
  const containerHeight = containerWidth;

  return (
    <div
      ref={containerRef}
      className={cn("relative touch-none flex items-center justify-center", className)}
      style={{ width: containerWidth, height: containerHeight }}
      onMouseDown={handleInteractionStart}
      onMouseMove={handleInteractionMove}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchMove={handleInteractionMove}
      onTouchEnd={handleInteractionEnd}
    >
      <svg
        className="absolute left-0 top-0 h-full w-full"
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      >
        <motion.path
          d={getLinePath()}
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.2 }}
        />
        {isDrawing && mousePos && activeDots.length > 0 && (
          <line
            x1={dots.find(d => d.id === activeDots[activeDots.length - 1])?.x}
            y1={dots.find(d => d.id === activeDots[activeDots.length - 1])?.y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="4 8"
          />
        )}
      </svg>
      {dots.map(dot => (
        <div
          key={dot.id}
          className="absolute"
          style={{
            left: dot.x,
            top: dot.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <motion.div
            className="rounded-full bg-muted border-2 border-muted"
            style={{ width: DOT_SIZE, height: DOT_SIZE }}
            animate={{
              backgroundColor: activeDots.includes(dot.id) ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              borderColor: activeDots.includes(dot.id) ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              scale: activeDots.includes(dot.id) ? 1.2 : 1,
            }}
            transition={{ duration: 0.1 }}
          >
             <div className="absolute inset-0 flex items-center justify-center">
                <div 
                    className="h-2 w-2 rounded-full"
                    style={{
                        backgroundColor: activeDots.includes(dot.id) ? 'hsl(var(--primary-foreground))' : 'hsl(var(--background))'
                    }}
                />
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
