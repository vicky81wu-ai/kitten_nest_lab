import { readLegacyMemorySlots } from '../core/legacy-memory-source.mjs';

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function memorySource(value) {
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return { url: URL.createObjectURL(value), owned: true };
  }
  if (typeof value === 'string' && value.startsWith('data:image/')) {
    return { url: value, owned: false };
  }
  return null;
}

export class MemoriesPanelSession {
  constructor({ body, object }) {
    this.body = body;
    this.object = object;
    this.sources = [];
    this.index = 0;
    this.destroyed = false;
  }

  mount() {
    this.body.classList.add('v2-panel__body--memories');
    this.root = element('section', 'v2-memories');
    this.root.dataset.memoryStatus = 'loading';

    const intro = element(
      'p',
      'v2-memories__intro',
      this.object.intro || 'Paw-picked little moments.'
    );
    this.root.appendChild(intro);

    this.frame = element('div', 'v2-memories__frame');
    const previous = element('button', 'v2-memories__nav v2-memories__nav--previous', '‹');
    previous.type = 'button';
    previous.dataset.memoryCommand = 'previous';
    previous.setAttribute('aria-label', '上一张照片');
    this.image = element('img', 'v2-memories__image');
    this.image.hidden = true;
    this.empty = element('div', 'v2-memories__empty', '正在翻找这台设备的旧照片墙…');
    const next = element('button', 'v2-memories__nav v2-memories__nav--next', '›');
    next.type = 'button';
    next.dataset.memoryCommand = 'next';
    next.setAttribute('aria-label', '下一张照片');
    this.frame.append(previous, this.image, this.empty, next);
    this.root.appendChild(this.frame);

    this.dots = element('div', 'v2-memories__dots');
    this.dots.setAttribute('aria-label', '照片槽');
    this.root.appendChild(this.dots);

    this.meta = element('p', 'v2-memories__meta', '只读检查中，不会新建或改动照片库。');
    this.root.appendChild(this.meta);

    this.fallback = element('div', 'v2-memories__fallback');
    this.fallback.hidden = true;
    (this.object.items || []).forEach((item) => {
      const card = element('article', 'v2-panel__item');
      card.append(
        element('h3', '', item.title || ''),
        element('p', '', item.text || '')
      );
      this.fallback.appendChild(card);
    });
    this.root.appendChild(this.fallback);

    this.body.replaceChildren(this.root);
    this.load();
  }

  async load() {
    const source = this.object.memorySource || {};
    const result = await readLegacyMemorySlots({
      databaseName: source.database,
      storeName: source.store,
      keys: source.keys
    });
    if (this.destroyed) return;

    this.sources = result.slots.map(memorySource);
    const first = this.sources.findIndex(Boolean);
    if (first >= 0) {
      this.index = first;
      this.root.dataset.memoryStatus = 'ready';
      this.root.dataset.memorySource = 'legacy-readonly';
      this.meta.textContent = '这台设备原来的照片墙 · 只读载入';
      this.buildDots();
      this.renderPhoto();
      return;
    }

    this.root.dataset.memoryStatus = 'fallback';
    this.root.dataset.memorySource = result.status;
    this.frame.hidden = true;
    this.dots.hidden = true;
    this.fallback.hidden = false;
    this.meta.textContent = result.status === 'unsupported'
      ? '当前浏览器不开放安全只读探测，旧照片库保持原样。'
      : '这台设备没有可读取的旧照片槽，先保留回忆卡片。';
  }

  buildDots() {
    this.dots.replaceChildren();
    this.sources.forEach((source, index) => {
      const dot = element('button', 'v2-memories__dot');
      dot.type = 'button';
      dot.dataset.memoryIndex = String(index);
      dot.dataset.filled = source ? '1' : '0';
      dot.setAttribute('aria-label', '照片槽 ' + (index + 1));
      this.dots.appendChild(dot);
    });
  }

  renderPhoto() {
    const source = this.sources[this.index];
    if (source) {
      this.image.src = source.url;
      this.image.alt = '回忆照片 ' + (this.index + 1);
      this.image.hidden = false;
      this.empty.hidden = true;
    } else {
      this.image.removeAttribute('src');
      this.image.alt = '';
      this.image.hidden = true;
      this.empty.hidden = false;
      this.empty.textContent = '照片槽 ' + (this.index + 1) + ' 还空着。';
    }
    [...this.dots.children].forEach((dot, index) => {
      dot.setAttribute('aria-pressed', String(index === this.index));
    });
  }

  move(delta) {
    if (!this.sources.length) return;
    this.index = (this.index + delta + this.sources.length) % this.sources.length;
    this.renderPhoto();
  }

  handleClick(target) {
    const indexButton = target.closest?.('[data-memory-index]');
    if (indexButton) {
      this.index = Number(indexButton.dataset.memoryIndex);
      this.renderPhoto();
      return true;
    }
    const command = target.closest?.('[data-memory-command]')?.dataset.memoryCommand;
    if (command === 'previous') this.move(-1);
    else if (command === 'next') this.move(1);
    else return false;
    return true;
  }

  destroy() {
    this.destroyed = true;
    this.sources.forEach((source) => {
      if (source?.owned) URL.revokeObjectURL(source.url);
    });
    this.sources = [];
    this.body.classList.remove('v2-panel__body--memories');
  }
}
