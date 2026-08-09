import {
  ALEX_STONE,
  KITTEN_STONE,
  chooseGomokuMove,
  createGomokuGame,
  playGomokuMove,
  undoGomokuRound
} from '../core/gomoku.mjs';

const DEFAULT_COPY = {
  ready: 'Alex: your move, kitten.',
  thinking: 'Alex: thinking…',
  kittenWin: 'Alex: smug little thing. Fine, you win.',
  alexWin: 'Alex: that’s my kitten. Consolation cuddle?',
  draw: 'Alex: a draw. Keep your seat; we go again.',
  undo: 'Alex: cheating already? Cute.'
};

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export class GomokuPanelSession {
  constructor({ body, object, onBack }) {
    this.body = body;
    this.object = object;
    this.onBack = onBack;
    this.copy = { ...DEFAULT_COPY, ...(object.game?.copy || {}) };
    this.difficulty = object.game?.defaultDifficulty || 'normal';
    this.aiDelayMs = Number.isFinite(object.game?.aiDelayMs) ? object.game.aiDelayMs : 180;
    this.cells = [];
    this.difficultyButtons = new Map();
    this.aiTimer = null;
    this.destroyed = false;
    this.thinking = false;
    this.message = this.copy.ready;
  }

  mount() {
    this.body.classList.add('v2-panel__body--gomoku');
    const root = element('section', 'v2-gomoku');

    this.line = element('p', 'v2-gomoku__line', this.message);
    this.line.setAttribute('aria-live', 'polite');
    root.appendChild(this.line);

    const difficultyBar = element('div', 'v2-gomoku__difficulty');
    difficultyBar.setAttribute('role', 'group');
    difficultyBar.setAttribute('aria-label', '难度');
    const options = this.object.game?.difficulties || [
      { id: 'soft', label: 'Soft' },
      { id: 'normal', label: 'Normal' },
      { id: 'wolf', label: 'Wolf' }
    ];
    options.forEach((option) => {
      const button = element('button', 'v2-gomoku__chip', option.label || option.id);
      button.type = 'button';
      button.dataset.gomokuDifficulty = option.id;
      difficultyBar.appendChild(button);
      this.difficultyButtons.set(option.id, button);
    });
    root.appendChild(difficultyBar);

    const legend = element('div', 'v2-gomoku__legend');
    const kittenLegend = element('span', 'v2-gomoku__legend-item', '小猫');
    kittenLegend.dataset.stone = 'kitten';
    const alexLegend = element('span', 'v2-gomoku__legend-item', 'Alex');
    alexLegend.dataset.stone = 'alex';
    legend.append(kittenLegend, alexLegend);
    root.appendChild(legend);

    this.boardElement = element('div', 'v2-gomoku__board');
    this.boardElement.setAttribute('role', 'grid');
    this.boardElement.setAttribute('aria-label', '十五乘十五五子棋棋盘');
    const size = this.object.game?.size || 15;
    for (let index = 0; index < size * size; index += 1) {
      const cell = element('button', 'v2-gomoku__cell');
      cell.type = 'button';
      cell.dataset.gomokuCell = String(index);
      cell.setAttribute('role', 'gridcell');
      this.boardElement.appendChild(cell);
      this.cells.push(cell);
    }
    root.appendChild(this.boardElement);

    const toolbar = element('div', 'v2-gomoku__toolbar');
    this.undoButton = element('button', 'v2-gomoku__button', '悔棋耍赖');
    this.undoButton.type = 'button';
    this.undoButton.dataset.gomokuCommand = 'undo';
    const restart = element('button', 'v2-gomoku__button', '重开');
    restart.type = 'button';
    restart.dataset.gomokuCommand = 'restart';
    const menu = element('button', 'v2-gomoku__button', '游戏菜单');
    menu.type = 'button';
    menu.dataset.gomokuCommand = 'back';
    toolbar.append(this.undoButton, restart, menu);
    root.appendChild(toolbar);

    this.body.replaceChildren(root);
    this.newGame(this.difficulty);
  }

  cancelAi() {
    if (this.aiTimer !== null) clearTimeout(this.aiTimer);
    this.aiTimer = null;
    this.thinking = false;
  }

  newGame(difficulty = this.difficulty) {
    this.cancelAi();
    this.difficulty = difficulty;
    this.game = createGomokuGame({
      size: this.object.game?.size || 15,
      difficulty
    });
    const option = (this.object.game?.difficulties || []).find((item) => item.id === difficulty);
    this.message = option?.line || this.copy.ready;
    this.render();
  }

  play(index) {
    if (this.thinking || this.game.status !== 'playing') return;
    const result = playGomokuMove(this.game, index, KITTEN_STONE);
    if (!result.accepted) return;
    this.game = result.game;
    if (this.game.status === 'won') {
      this.message = this.copy.kittenWin;
      this.render();
      return;
    }
    if (this.game.status === 'draw') {
      this.message = this.copy.draw;
      this.render();
      return;
    }

    this.thinking = true;
    this.message = this.copy.thinking;
    this.render();
    this.aiTimer = setTimeout(() => this.playAlex(), this.aiDelayMs);
  }

  playAlex() {
    this.aiTimer = null;
    if (this.destroyed || this.game.status !== 'playing') return;
    const index = chooseGomokuMove(this.game);
    if (index < 0) {
      this.thinking = false;
      this.message = this.copy.draw;
      this.render();
      return;
    }
    const result = playGomokuMove(this.game, index, ALEX_STONE);
    this.game = result.game;
    this.thinking = false;
    if (this.game.status === 'won') this.message = this.copy.alexWin;
    else if (this.game.status === 'draw') this.message = this.copy.draw;
    else this.message = this.copy.ready;
    this.render();
  }

  undo() {
    if (!this.game.moves.length) return;
    this.cancelAi();
    this.game = undoGomokuRound(this.game);
    this.message = this.copy.undo;
    this.render();
  }

  render() {
    this.line.textContent = this.message;
    this.boardElement.dataset.status = this.game.status;
    this.cells.forEach((cell, index) => {
      const stone = this.game.board[index];
      if (stone === KITTEN_STONE) cell.dataset.stone = 'kitten';
      else if (stone === ALEX_STONE) cell.dataset.stone = 'alex';
      else cell.removeAttribute('data-stone');
      cell.disabled = this.thinking || this.game.status !== 'playing' || Boolean(stone);
      const row = Math.floor(index / this.game.size) + 1;
      const column = index % this.game.size + 1;
      const owner = stone === KITTEN_STONE ? '小猫' : stone === ALEX_STONE ? 'Alex' : '空位';
      cell.setAttribute('aria-label', '第 ' + row + ' 行第 ' + column + ' 列，' + owner);
    });
    this.difficultyButtons.forEach((button, id) => {
      button.setAttribute('aria-pressed', String(id === this.game.difficulty));
    });
    this.undoButton.disabled = !this.game.moves.length;
  }

  handleClick(target) {
    const cell = target.closest?.('[data-gomoku-cell]');
    if (cell) {
      this.play(Number(cell.dataset.gomokuCell));
      return true;
    }

    const difficulty = target.closest?.('[data-gomoku-difficulty]');
    if (difficulty) {
      this.newGame(difficulty.dataset.gomokuDifficulty);
      return true;
    }

    const command = target.closest?.('[data-gomoku-command]')?.dataset.gomokuCommand;
    if (command === 'undo') this.undo();
    else if (command === 'restart') this.newGame();
    else if (command === 'back') this.onBack?.();
    else return false;
    return true;
  }

  destroy() {
    this.destroyed = true;
    this.cancelAi();
    this.body.classList.remove('v2-panel__body--gomoku');
  }
}
