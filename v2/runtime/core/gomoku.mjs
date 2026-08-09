export const GOMOKU_SIZE = 15;
export const KITTEN_STONE = 1;
export const ALEX_STONE = 2;

const DIFFICULTIES = new Set(['soft', 'normal', 'wolf']);

export function createGomokuGame({
  size = GOMOKU_SIZE,
  difficulty = 'normal'
} = {}) {
  const boardSize = Number.isInteger(size) && size >= 5 ? size : GOMOKU_SIZE;
  return {
    size: boardSize,
    difficulty: DIFFICULTIES.has(difficulty) ? difficulty : 'normal',
    board: Array(boardSize * boardSize).fill(0),
    moves: [],
    status: 'playing',
    winner: 0
  };
}

export function coordinates(index, size = GOMOKU_SIZE) {
  return [index % size, Math.floor(index / size)];
}

export function boardIndex(x, y, size = GOMOKU_SIZE) {
  return y * size + x;
}

function inside(x, y, size) {
  return x >= 0 && y >= 0 && x < size && y < size;
}

export function isWinningMove(board, index, player, size = GOMOKU_SIZE) {
  if (!board || board[index] !== player) return false;
  const [x, y] = coordinates(index, size);
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  return directions.some(([dx, dy]) => {
    let count = 1;
    for (const sign of [-1, 1]) {
      let nextX = x + dx * sign;
      let nextY = y + dy * sign;
      while (inside(nextX, nextY, size) && board[boardIndex(nextX, nextY, size)] === player) {
        count += 1;
        nextX += dx * sign;
        nextY += dy * sign;
      }
    }
    return count >= 5;
  });
}

export function playGomokuMove(game, index, player) {
  const validPlayer = player === KITTEN_STONE || player === ALEX_STONE;
  const validIndex = Number.isInteger(index) && index >= 0 && index < game.board.length;
  if (game.status !== 'playing' || !validPlayer || !validIndex || game.board[index]) {
    return { game, accepted: false };
  }

  const board = game.board.slice();
  board[index] = player;
  const won = isWinningMove(board, index, player, game.size);
  const draw = !won && game.moves.length + 1 === board.length;
  const next = {
    ...game,
    board,
    moves: [...game.moves, index],
    status: won ? 'won' : draw ? 'draw' : 'playing',
    winner: won ? player : 0
  };
  return { game: next, accepted: true };
}

export function undoGomokuRound(game) {
  if (!game.moves.length) return game;
  const removeCount = Math.min(2, game.moves.length);
  const moves = game.moves.slice(0, -removeCount);
  const board = game.board.slice();
  game.moves.slice(-removeCount).forEach((index) => {
    board[index] = 0;
  });
  return {
    ...game,
    board,
    moves,
    status: 'playing',
    winner: 0
  };
}

export function candidateMoves(board, size = GOMOKU_SIZE, radius = 2) {
  const occupied = [];
  board.forEach((value, index) => {
    if (value) occupied.push(index);
  });
  if (!occupied.length) {
    const center = Math.floor(size / 2);
    return [boardIndex(center, center, size)];
  }

  const candidates = new Set();
  occupied.forEach((index) => {
    const [x, y] = coordinates(index, size);
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        const nextX = x + dx;
        const nextY = y + dy;
        const nextIndex = boardIndex(nextX, nextY, size);
        if (inside(nextX, nextY, size) && !board[nextIndex]) candidates.add(nextIndex);
      }
    }
  });
  return [...candidates];
}

function wouldWin(board, index, player, size) {
  board[index] = player;
  const won = isWinningMove(board, index, player, size);
  board[index] = 0;
  return won;
}

function lineScore(board, index, player, size) {
  board[index] = player;
  const [x, y] = coordinates(index, size);
  let score = 0;

  for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    let count = 1;
    let openEnds = 0;
    for (const sign of [-1, 1]) {
      let nextX = x + dx * sign;
      let nextY = y + dy * sign;
      while (inside(nextX, nextY, size) && board[boardIndex(nextX, nextY, size)] === player) {
        count += 1;
        nextX += dx * sign;
        nextY += dy * sign;
      }
      if (inside(nextX, nextY, size) && !board[boardIndex(nextX, nextY, size)]) openEnds += 1;
    }
    if (count >= 5) score += 99999;
    else if (count === 4) score += 9000 + openEnds * 500;
    else if (count === 3) score += 800 + openEnds * 120;
    else if (count === 2) score += 80 + openEnds * 20;
    else score += 10;
  }

  board[index] = 0;
  return score;
}

export function chooseGomokuMove(game, { random = Math.random } = {}) {
  if (game.status !== 'playing') return -1;
  const candidates = candidateMoves(game.board, game.size);
  if (!candidates.length) return -1;

  if (game.difficulty === 'soft') {
    const sampled = Math.floor(Math.max(0, Math.min(0.999999, random())) * candidates.length);
    return candidates[sampled];
  }

  const immediateWin = candidates.find((index) => wouldWin(game.board, index, ALEX_STONE, game.size));
  if (immediateWin !== undefined) return immediateWin;
  const immediateBlock = candidates.find((index) => wouldWin(game.board, index, KITTEN_STONE, game.size));
  if (immediateBlock !== undefined) return immediateBlock;

  let best = candidates[0];
  let bestScore = -Infinity;
  candidates.forEach((index) => {
    const attack = lineScore(game.board, index, ALEX_STONE, game.size);
    const block = lineScore(game.board, index, KITTEN_STONE, game.size);
    const blockWeight = game.difficulty === 'wolf' ? 1.15 : 1;
    const noise = game.difficulty === 'wolf' ? 0 : random() * 120;
    const score = attack + block * blockWeight + noise;
    if (score > bestScore) {
      best = index;
      bestScore = score;
    }
  });
  return best;
}
