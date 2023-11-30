import React, {useCallback, useEffect, useRef, useState} from 'react';
import './App.scss';
import {useMount, useUpdateEffect} from "ahooks";

function App() {
  const [board, setBoard] = useState(Array(20).fill(Array(20).fill(null)));
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  const canvasRef = React.createRef<HTMLCanvasElement>();
  const toastRef = React.createRef<HTMLDivElement>();
  const isFinish = useRef<string | null>(null);
  const devicePixelRatio = useRef(window.devicePixelRatio ?? 1);
  const pieceColor = useRef({
    black: ['#0a0a0a', '#636766'],
    white: ['#b1b1b1', '#f9f9f9'],
  })

  const handleClick = (row: number, col: number) => {
    if (board[row][col] === null) {
      const newBoard = board.map(row => row.slice());
      newBoard[row][col] = isBlackTurn ? 'black' : 'white';
      setBoard(newBoard);
      isFinish.current = checkWinner(board, row, col, isBlackTurn ? 'black' : 'white');
      setIsBlackTurn(!isBlackTurn);
    }
  };

  // 绘制棋盘
  const drawBoard = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = 600 * devicePixelRatio.current;
    canvasRef.current.height = 600 * devicePixelRatio.current;
    canvasRef.current.style.width = '600px';
    canvasRef.current.style.height = '600px';
    ctx.scale(devicePixelRatio.current, devicePixelRatio.current);

    // 绘制棋盘背景
    ctx.fillStyle = 'yellow';
    ctx.fillRect(0, 0, 600, 600);

    // 绘制网格线
    ctx.strokeStyle = 'black';
    for (let i = 0; i < 20; i++) {
      // 绘制横线
      ctx.beginPath();
      ctx.moveTo(15, i * 30 + 15);
      ctx.lineTo(585, i * 30 + 15);
      ctx.stroke();

      // 绘制竖线
      ctx.beginPath();
      ctx.moveTo(i * 30 + 15, 15);
      ctx.lineTo(i * 30 + 15, 585);
      ctx.stroke();
    }
  }, []);

  // 绘制棋子
  const drawPiece = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const drawPiece = (color: 'white' | 'black') => {
          ctx.beginPath();
          ctx.arc(j * 30 + 15, i * 30 + 15, 13, 0, 2 * Math.PI);
          const gradient = ctx.createRadialGradient(j * 30 + 15, i * 30 + 15, 13, j * 30 + 15, i * 30 + 15, 0);
          gradient.addColorStop(0, pieceColor.current[color][0]);
          gradient.addColorStop(1, pieceColor.current[color][1]);
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.closePath();
        };
        if (board[i][j] === 'black') {
          drawPiece('black');
        } else if (board[i][j] === 'white') {
          drawPiece('white');
        }
      }
    }

    if (isFinish.current && toastRef.current) {
      toastRef.current.style.display = 'flex';
      // setTimeout(() => {
      //   if (toastRef.current) {
      //     toastRef.current.style.display = 'none';
      //   }
      // }, 3000);
    }
  };

  const checkWinner = useCallback((board: Array<Array<string | null>>, row: number, col: number, color: string) => {
    const directions = [
      [0, 1],   // 横向
      [1, 0],   // 纵向
      [1, 1],   // 斜向（左上到右下）
      [1, -1]   // 斜向（左下到右上）
    ];

    for (const [dx, dy] of directions) {
      let count = 1; // 当前位置已经有一颗棋子

      // 向正方向查找
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dx;
        const newCol = col + i * dy;

        if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board[0].length && board[newRow][newCol] === color) {
          count++;
        } else {
          // 超出边界或不是相同颜色的棋子，停止查找
          break;
        }
      }

      // 向负方向查找
      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dx;
        const newCol = col - i * dy;

        if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board[0].length && board[newRow][newCol] === color) {
          count++;
        } else {
          // 超出边界或不是相同颜色的棋子，停止查找
          break;
        }
      }

      // 如果在某个方向上达到了5颗相同颜色的棋子，返回获胜方的颜色
      if (count >= 5) {
        return color;
      }
    }

    // 没有获胜
    return null;
  }, []);

  useMount(() => {
    drawBoard();
  });

  useUpdateEffect(() => {
    drawPiece();
  }, [board]);

  return (
    <div className={'wrapper'}>
      <div
          ref={toastRef}
          className={'toast'}
      >
        {`${isFinish.current === 'black' ? '黑方' : '白方'}获胜`}
      </div>
      <canvas
          ref={canvasRef}
          width={600}
          height={600}
          onClick={(e) => {
            if (isFinish.current) return;
            const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
            let x = 0, y = 0;
            if (e.clientX - rect.left < 15) {
              x = 0;
            } else if (e.clientX - rect.left > 585) {
              x = 19
            } else {
              x = Math.round((e.clientX - rect.left - 15) / 30);
            }
            if (e.clientY - rect.top < 15) {
              y = 0;
            } else if (e.clientY - rect.top > 585) {
              y = 19;
            } else {
              y = Math.round((e.clientY - rect.top - 15) / 30);
            }
            handleClick(y, x);
          }}
      ></canvas>
    </div>
  );
}

export default App;
