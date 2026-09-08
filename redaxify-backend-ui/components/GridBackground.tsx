"use client";
import { useEffect, useRef } from "react";

const GridBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gridSize = 30;
    const cellSize = 50;

    interface GridCell {
      x: number;
      y: number;
      opacity: number;
    }

    const grid: GridCell[][] = [];
    for (let x = 0; x < gridSize; x++) {
      grid[x] = [];
      for (let y = 0; y < gridSize; y++) {
        grid[x][y] = {
          x: x * cellSize,
          y: y * cellSize,
          opacity: Math.random() * 0.3,
        };
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          const cell = grid[x][y];

          // Update opacity
          cell.opacity += Math.random() * 0.02 - 0.01;
          cell.opacity = Math.max(0.05, Math.min(0.3, cell.opacity));

          // Draw cell
          ctx.beginPath();
          ctx.strokeStyle = `rgba(100, 150, 255, ${cell.opacity})`;
          ctx.lineWidth = 0.5;
          ctx.rect(cell.x, cell.y, cellSize, cellSize);
          ctx.stroke();

          // Draw connecting lines
          if (x < gridSize - 1 && y < gridSize - 1) {
            const nextCell = grid[x + 1][y + 1];
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 150, 255, ${cell.opacity * 0.5})`;
            ctx.moveTo(cell.x + cellSize / 2, cell.y + cellSize / 2);
            ctx.lineTo(nextCell.x + cellSize / 2, nextCell.y + cellSize / 2);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default GridBackground;
