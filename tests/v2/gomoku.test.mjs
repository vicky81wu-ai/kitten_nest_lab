import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALEX_STONE,
  KITTEN_STONE,
  boardIndex,
  candidateMoves,
  chooseGomokuMove,
  createGomokuGame,
  isWinningMove,
  playGomokuMove,
  undoGomokuRound
} from '../../v2/runtime/core/gomoku.mjs';

function place(game, index, player) {
  const result = playGomokuMove(game, index, player);
  assert.equal(result.accepted, true);
  return result.game;
}

test('gomoku starts as an empty fifteen by fifteen game', () => {
  const game = createGomokuGame();
  assert.equal(game.size, 15);
  assert.equal(game.board.length, 225);
  assert.equal(game.board.every((cell) => cell === 0), true);
  assert.deepEqual(candidateMoves(game.board, game.size), [112]);
});

test('five kitten stones finish a horizontal line', () => {
  let game = createGomokuGame();
  for (let column = 3; column <= 7; column += 1) {
    game = place(game, boardIndex(column, 6, game.size), KITTEN_STONE);
  }
  assert.equal(game.status, 'won');
  assert.equal(game.winner, KITTEN_STONE);
  assert.equal(isWinningMove(game.board, boardIndex(7, 6, game.size), KITTEN_STONE, game.size), true);
});

test('occupied cells and post-game moves are rejected without mutation', () => {
  let game = createGomokuGame();
  game = place(game, 112, KITTEN_STONE);
  const occupied = playGomokuMove(game, 112, ALEX_STONE);
  assert.equal(occupied.accepted, false);
  assert.equal(occupied.game, game);

  for (let column = 0; column < 5; column += 1) {
    game = place(game, boardIndex(column, 0, game.size), KITTEN_STONE);
  }
  assert.equal(game.status, 'won');
  assert.equal(playGomokuMove(game, 1, ALEX_STONE).accepted, false);
});

test('undo removes the latest kitten and Alex round and reopens a finished game', () => {
  let game = createGomokuGame();
  game = place(game, 112, KITTEN_STONE);
  game = place(game, 113, ALEX_STONE);
  const undone = undoGomokuRound({ ...game, status: 'won', winner: ALEX_STONE });
  assert.deepEqual(undone.moves, []);
  assert.equal(undone.board[112], 0);
  assert.equal(undone.board[113], 0);
  assert.equal(undone.status, 'playing');
  assert.equal(undone.winner, 0);
});

test('Alex takes an immediate winning move before considering a block', () => {
  let game = createGomokuGame({ difficulty: 'wolf' });
  for (let column = 4; column <= 7; column += 1) {
    game = place(game, boardIndex(column, 7, game.size), ALEX_STONE);
    game = place(game, boardIndex(column, 9, game.size), KITTEN_STONE);
  }
  const move = chooseGomokuMove(game, { random: () => 0 });
  const result = playGomokuMove(game, move, ALEX_STONE);
  assert.equal(result.game.status, 'won');
  assert.equal(result.game.winner, ALEX_STONE);
});

test('Alex blocks an immediate kitten win on normal and wolf modes', () => {
  for (const difficulty of ['normal', 'wolf']) {
    let game = createGomokuGame({ difficulty });
    for (let column = 5; column <= 8; column += 1) {
      game = place(game, boardIndex(column, 8, game.size), KITTEN_STONE);
    }
    const move = chooseGomokuMove(game, { random: () => 0 });
    const blockingBoard = game.board.slice();
    blockingBoard[move] = KITTEN_STONE;
    assert.equal(isWinningMove(blockingBoard, move, KITTEN_STONE, game.size), true);
  }
});

test('soft mode samples a nearby legal move', () => {
  let game = createGomokuGame({ difficulty: 'soft' });
  game = place(game, 112, KITTEN_STONE);
  const candidates = candidateMoves(game.board, game.size);
  const move = chooseGomokuMove(game, { random: () => 0.999999 });
  assert.equal(candidates.includes(move), true);
  assert.equal(game.board[move], 0);
});
