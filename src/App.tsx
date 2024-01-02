import React, {useCallback, useEffect, useRef, useState} from 'react';
import './App.scss';
import {useMount, useUpdateEffect} from "ahooks";

function App() {
  const [board, setBoard] = useState(Array(15).fill(Array(15).fill(null)));
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
      newBoard[row][col] = 'black';
      setBoard(newBoard);
      isFinish.current = checkWinner(newBoard, row, col, 'black');
      if (!isFinish.current) {
        computerMove(newBoard);
      } else {
        if (isFinish.current && toastRef.current) {
          toastRef.current.style.display = 'flex';
        }
      }
    }
  };

  // 绘制棋盘
  const drawBoard = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = 450 * devicePixelRatio.current;
    canvasRef.current.height = 450 * devicePixelRatio.current;
    canvasRef.current.style.width = '450px';
    canvasRef.current.style.height = '450px';
    ctx.scale(devicePixelRatio.current, devicePixelRatio.current);

    // 绘制棋盘背景
    ctx.fillStyle = 'yellow';
    ctx.fillRect(0, 0, 450, 450);

    // 绘制网格线
    ctx.strokeStyle = 'black';
    for (let i = 0; i < 15; i++) {
      // 绘制横线
      ctx.beginPath();
      ctx.moveTo(15, i * 30 + 15);
      ctx.lineTo(435, i * 30 + 15);
      ctx.stroke();

      // 绘制竖线
      ctx.beginPath();
      ctx.moveTo(i * 30 + 15, 15);
      ctx.lineTo(i * 30 + 15, 435);
      ctx.stroke();
    }
  }, []);

  // 绘制棋子
  const drawPiece = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
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
  };

  const checkWinner = useCallback((newBoard: Array<Array<string | null>>, row: number, col: number, color: string) => {
    const directions = [
      [0, 1], // 横向
      [1, 0], // 纵向
      [1, 1], // 斜向（左上到右下）
      [1, -1] // 斜向（左下到右上）
    ];

    for (const [dx, dy] of directions) {
      let count = 1; // 当前位置已经有一颗棋子

      // 向正方向查找
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dx;
        const newCol = col + i * dy;

        if (newRow >= 0 && newRow < newBoard.length && newCol >= 0 && newCol < newBoard[0].length && newBoard[newRow][newCol] === color) {
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

        if (newRow >= 0 && newRow < newBoard.length && newCol >= 0 && newCol < newBoard[0].length && newBoard[newRow][newCol] === color) {
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

  const computerMove = useCallback((newBoard: Array<Array<string | null>>) => {
    const rows = 15, cols = 15;
    let bestScore = -Infinity;
    let bestMove = null;

    // 判断是否是刚开始下棋，如果是，则遍历所有空白位置
    const isInitialMove = newBoard.every(row => row.every(cell => cell !== 'white'));

    // 遍历棋盘上所有的白棋位置
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (isInitialMove || newBoard[i][j] === 'white') {
          // 遍历白棋附近的空白位置
          for (let m = Math.max(0, i - 1); m <= Math.min(rows - 1, i + 1); m++) {
            for (let n = Math.max(0, j - 1); n <= Math.min(cols - 1, j + 1); n++) {
              if (newBoard[m][n] === null) {
                // 尝试在当前空白位置下白棋，并评估得分
                const score = calcMove(newBoard, m, n, 'white');

                // 如果得分更高，则更新最佳得分和最佳移动位置
                if (score > bestScore) {
                  bestScore = score;
                  bestMove = { row: m, col: n };
                }
              }
            }
          }
        }
      }
    }

    // 在最佳移动位置下白棋
    if (bestMove) {
      newBoard[bestMove.row][bestMove.col] = 'white';
      setBoard(newBoard);
      isFinish.current = checkWinner(newBoard, bestMove.row, bestMove.col, 'white');
      if (isFinish.current && toastRef.current) {
        toastRef.current.style.display = 'flex';
      }
    }
  }, []);


  /**
   * 计算落子的权重
   */
  const calcMove = useCallback((newBoard: Array<Array<string | null>>, row: number, col: number, color: string) => {
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];

    let totalScore = 0;

    // 遍历四个方向，评估每个方向的得分
    for (const [dx, dy] of directions) {
      const consecutiveColor = countConsecutive(newBoard, row, col, color, dx, dy, 1) +
          countConsecutive(newBoard, row, col, color, -dx, -dy, 1) - 1;
      const countColor = countConsecutive(newBoard, row, col, null, dx, dy, 0) +
          countConsecutive(newBoard, row, col, null, -dx, -dy, 0);

      // 尝试在当前位置下对方的棋
      const opponentColor = color === 'white' ? 'black' : 'white';
      const boardCopy = copyBoard(board);
      boardCopy[row][col] = opponentColor;

      const consecutiveOpponent = countConsecutive(boardCopy, row, col, opponentColor, dx, dy, 1) +
          countConsecutive(boardCopy, row, col, opponentColor, -dx, -dy, 1) - 1;
      const countOpponent = countConsecutive(boardCopy, row, col, null, dx, dy, 0) +
          countConsecutive(boardCopy, row, col, null, -dx, -dy, 0);

      // 计算得分，分别考虑落子方和对方的得分
      totalScore += calculateScore(consecutiveColor, countColor, color) +
          calculateScore(consecutiveOpponent, countOpponent, opponentColor);
    }

    return totalScore;
  }, []);

  /**
   * 计算连续的棋子数
   */
  const countConsecutive = useCallback((newBoard: Array<Array<string | null>>, row: number, col: number, color: string | null, dx: number, dy: number, count: number) => {
    while (true) {
      row += dx;
      col += dy;

      if (row < 0 || row >= newBoard.length || col < 0 || col >= newBoard[0].length) {
        break; // 超出边界，停止计数
      }

      const currentColor = newBoard[row][col];
      if (currentColor === color || (color === null && currentColor === null)) {
        count++;
      } else {
        break; // 遇到不同颜色的棋子，停止计数
      }
    }

    return count;
  }, []);

  const calculateScore = useCallback((consecutive: number, count: number, color: string) => {
    if (consecutive >= 5) {
      return color === 'white' ? 100000 : -100000; // 胜利
    } else if (consecutive === 4) {
      if (count === 1) {
        return color === 'white' ? 1000 : -1000;    // 活四
      } else if (count === 2) {
        return color === 'white' ? 100 : -100;      // 死四
      }
    } else if (consecutive === 3) {
      if (count === 2) {
        return color === 'white' ? 100 : -100;      // 活三
      } else if (count === 3) {
        return color === 'white' ? 10 : -10;        // 死三
      }
    } else if (consecutive === 2 && count === 3) {
      return color === 'white' ? 10 : -10;          // 活二
    }

    return 0;                                       // 无得分
  }, []);

  // 复制棋盘
  const copyBoard = useCallback((newBoard: Array<Array<string | null>>) => {
    return newBoard.map(row => row.slice());
  }, []);

  const playerClickHandler = (e: MouseEvent) => {
    if (isFinish.current) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    let x = 0, y = 0;
    if (e.clientX - rect.left < 15) {
      x = 0;
    } else if (e.clientX - rect.left > 435) {
      x = 14
    } else {
      x = Math.round((e.clientX - rect.left - 15) / 30);
    }
    if (e.clientY - rect.top < 15) {
      y = 0;
    } else if (e.clientY - rect.top > 435) {
      y = 14;
    } else {
      y = Math.round((e.clientY - rect.top - 15) / 30);
    }
    handleClick(y, x);
  };

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
          width={450}
          height={450}
          onClick={(e) => {
            // @ts-ignore
            playerClickHandler(e as MouseEvent);
          }}
      ></canvas>
    </div>
  );
}

export default App;
