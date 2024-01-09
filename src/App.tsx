import React, { useRef, useState } from 'react';
import './App.scss';
import { useMount, useUpdateEffect } from 'ahooks';
import { SCORE_ENUM } from './utils/constant';
import { Model } from './utils/utils';
import { cloneDeep } from 'lodash';

const SIZE = 15;

function App() {
    const [board, setBoard] = useState<Array<Array<number>>>(Array(15).fill(Array(15).fill(0)));
    const canvasRef = React.createRef<HTMLCanvasElement>();
    // const isBlack = useRef<1 | 2>(1);
    const isFinish = useRef<number | null>(null);
    const devicePixelRatio = useRef(window.devicePixelRatio ?? 1);
    const pieceColor = useRef({
        1: ['#0a0a0a', '#636766'],
        2: ['#b1b1b1', '#f9f9f9'],
    });

    /**
     * 玩家落子, 计算是否胜利
     */
    const handleClick = (row: number, col: number) => {
        if (board[row][col] === 0) {
            const newBoard = JSON.parse(JSON.stringify(board));
            newBoard[row][col] = 1;
            setBoard(newBoard);
            isFinish.current = checkWinner(newBoard, row, col, 1);
            if (!isFinish.current) {
                computerMove(newBoard);
                // @ts-ignore
                // isBlack.current = 3 - isBlack.current;
            } else {
                Model({
                    content: `${isFinish.current === 1 ? '黑方' : '白方'}获胜`,
                });
            }
        }
    };

    /**
     * 绘制棋盘
     */
    const drawBoard = () => {
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
    };

    /**
     * 落子
     */
    const drawPiece = (ctx: CanvasRenderingContext2D, i: number, j: number, color: 1 | 2) => {
        ctx.beginPath();
        ctx.arc(j * 30 + 15, i * 30 + 15, 13, 0, 2 * Math.PI);
        const gradient = ctx.createRadialGradient(j * 30 + 15, i * 30 + 15, 13, j * 30 + 15, i * 30 + 15, 0);
        gradient.addColorStop(0, pieceColor.current[color][0]);
        gradient.addColorStop(1, pieceColor.current[color][1]);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();
    };

    /**
     * 监听棋盘变化, 绘制棋子
     */
    const pieceDrop = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === 1) {
                    drawPiece(ctx, i, j, 1);
                } else if (board[i][j] === 2) {
                    drawPiece(ctx, i, j, 2);
                }
            }
        }
    };

    /**
     * 判断是否有胜利者产生
     */
    const checkWinner = (newBoard: Array<Array<number>>, row: number, col: number, color: 1 | 2) => {
        const directions = [
            [0, 1], // 横向
            [1, 0], // 纵向
            [1, 1], // 斜向（左上到右下）
            [1, -1], // 斜向（左下到右上）
        ];

        for (const [dx, dy] of directions) {
            let count = 1; // 当前位置已经有一颗棋子

            // 向正方向查找
            for (let i = 1; i < 5; i++) {
                const newRow = row + i * dx;
                const newCol = col + i * dy;

                if (
                    newRow >= 0 &&
                    newRow < newBoard.length &&
                    newCol >= 0 &&
                    newCol < newBoard[0].length &&
                    newBoard[newRow][newCol] === color
                ) {
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

                if (
                    newRow >= 0 &&
                    newRow < newBoard.length &&
                    newCol >= 0 &&
                    newCol < newBoard[0].length &&
                    newBoard[newRow][newCol] === color
                ) {
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
    };

    /**
     * 获取指定点的棋子
     * @param newBoard 当前棋盘
     * @param point 当前棋子坐标
     * @param direction 方向 1-左横 2-右横 3-上竖 4-下竖 5-左上斜 6-左下斜 7-右上斜 8-右下斜
     * @param offset 偏移量
     * @returns {number} 棋子颜色 -1:越界 0:空 1:黑棋 2:白棋
     */
    const relativePoint = (
        newBoard: Array<Array<number>>,
        point: { row: number; col: number },
        direction: number,
        offset: number,
    ) => {
        let { row, col } = point;
        switch (direction) {
            case 1:
                col -= offset;
                break;
            case 2:
                col += offset;
                break;
            case 3:
                row -= offset;
                break;
            case 4:
                row += offset;
                break;
            case 5:
                col += offset;
                row -= offset;
                break;
            case 6:
                col -= offset;
                row += offset;
                break;
            case 7:
                col -= offset;
                row -= offset;
                break;
            case 8:
                col += offset;
                row += offset;
                break;
        }
        if (row < 0 || col < 0 || row >= SIZE || col >= SIZE) {
            return -1;
        }
        return newBoard[row][col];
    };

    /**
     * 拼接各个方向的棋子
     * @param newBoard 当前棋盘
     * @param str 棋子字符串
     * @param point 当前棋子坐标
     * @param color 当前棋子颜色
     * @param direction 方向 1-左横 2-右横 3-上竖 4-下竖 5-左上斜 6-左下斜 7-右上斜 8-右下斜
     * @param offset 偏移量
     * @returns {string} 拼接后的棋子字符串
     */
    const appendPiece = (
        newBoard: Array<Array<number>>,
        str: string,
        point: { row: number; col: number },
        color: 1 | 2,
        direction: number,
        offset: number,
    ) => {
        let piece = relativePoint(newBoard, point, direction, offset);
        if (piece > -1) {
            // 如果是黑棋, 需要对黑棋和白棋进行转换, 因为评估枚举是根据白棋设定的
            if (color === 1) {
                if (piece > 0) {
                    piece = 3 - piece;
                }
            }
            str += piece;
        }
        return str;
    };

    /**
     * 获取当前局势
     * @param newBoard 当前棋盘
     * @param point 当前棋子坐标
     * @param direction 方向 1-横 2-竖 3-左斜 4-右斜
     * @param color 当前棋子颜色
     * @returns {string} 当前局势
     */
    const getSituation = (
        newBoard: Array<Array<number>>,
        point: { row: number; col: number },
        direction: number,
        color: 1 | 2,
    ) => {
        direction = direction * 2 - 1;
        let str = '';
        str = appendPiece(newBoard, str, point, color, direction, 4);
        str = appendPiece(newBoard, str, point, color, direction, 3);
        str = appendPiece(newBoard, str, point, color, direction, 2);
        str = appendPiece(newBoard, str, point, color, direction, 1);
        str += '2';
        str = appendPiece(newBoard, str, point, color, direction + 1, 1);
        str = appendPiece(newBoard, str, point, color, direction + 1, 2);
        str = appendPiece(newBoard, str, point, color, direction + 1, 3);
        str = appendPiece(newBoard, str, point, color, direction + 1, 4);
        return str;
    };

    /**
     * 获取当前局势的分数
     */
    const getScore = (situation: string) => {
        const keyList = Object.keys(SCORE_ENUM);
        for (let i = 0; i < keyList.length; i++) {
            const key = keyList[i];
            if (Object.prototype.hasOwnProperty.call(SCORE_ENUM, key) && situation.includes(key)) {
                // @ts-ignore
                return SCORE_ENUM[key];
            }
        }
        return 0;
    };

    const checkSituation = (situation: string, scoreKey: string) => {
        return situation.includes(scoreKey);
    };

    /**
     * 计算电脑落子得分情况
     */
    const evaluate = (newBoard: Array<Array<number>>, point: { row: number; col: number }, color: 1 | 2) => {
        let score = 0;
        let huosanTotal = 0;
        let chongsiTotal = 0;
        let huoerTotal = 0;
        for (let i = 1; i < 5; i++) {
            const situation = getSituation(newBoard, point, i, color);
            score += getScore(situation);

            if (
                checkSituation(situation, '002220') ||
                checkSituation(situation, '022200') ||
                checkSituation(situation, '020220') ||
                checkSituation(situation, '022020')
            ) {
                huosanTotal++;
            } else if (
                checkSituation(situation, '22220') ||
                checkSituation(situation, '02222') ||
                checkSituation(situation, '20222') ||
                checkSituation(situation, '22022') ||
                checkSituation(situation, '22202')
            ) {
                chongsiTotal++;
            } else if (
                checkSituation(situation, '002200') ||
                checkSituation(situation, '022000') ||
                checkSituation(situation, '000220')
            ) {
                huoerTotal++;
            }
        }

        if (huosanTotal > 0 && huoerTotal > 0) {
            score *= 2;
        }
        if (chongsiTotal > 0 && huoerTotal > 0) {
            score *= 4;
        }
        if (huosanTotal > 1) {
            score *= 6;
        }
        if (chongsiTotal > 0 && huosanTotal > 0) {
            score *= 8;
        }
        return score;
    };

    /**
     * 电脑落子
     */
    const computerMove = (newBoard: Array<Array<number>>) => {
        let bestMove = { row: -1, col: -1, score: -Infinity };

        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (!newBoard[i][j]) {
                    const scoreWhite = evaluate(newBoard, { row: i, col: j }, 2);
                    const scoreBlack = evaluate(newBoard, { row: i, col: j }, 1);
                    const score = scoreWhite + scoreBlack;
                    if (score > bestMove.score) {
                        bestMove = { row: i, col: j, score };
                    }
                }
            }
        }

        // 在最佳移动位置下白棋
        if (bestMove) {
            newBoard[bestMove.row][bestMove.col] = 2;
            setBoard(newBoard);
            isFinish.current = checkWinner(newBoard, bestMove.row, bestMove.col, 2);
            if (isFinish.current) {
                Model({
                    content: `${isFinish.current === 1 ? '黑方' : '白方'}获胜`,
                });
            }
        }
    };

    /**
     * 计算玩家落子坐标
     */
    const playerClickHandler = (e: MouseEvent) => {
        if (isFinish.current) return;
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        let x = 0,
            y = 0;
        if (e.clientX - rect.left < 15) {
            x = 0;
        } else if (e.clientX - rect.left > 435) {
            x = 14;
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

    /**
     * 初始化绘制棋盘
     */
    useMount(() => {
        drawBoard();
    });

    /**
     * 监听棋盘变化, 绘制棋子
     */
    useUpdateEffect(() => {
        pieceDrop();
    }, [board]);

    return (
        <div className={'wrapper'}>
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
