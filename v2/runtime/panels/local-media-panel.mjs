import { readLegacyMemorySlots } from '../core/legacy-memory-source.mjs';
import { clearLegacyMemorySlot, writeLegacyMemorySlot } from '../core/local-memory-store.mjs';

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export class LocalMediaPanelSession {
  constructor({ body, object }) {
    this.body = body;
    this.object = object;
    this.target = object.memoryTarget || {};
    this.keys = Array.isArray(this.target.keys) ? this.target.keys : [];
    this.slots = Array(this.keys.length).fill(null);
    this.destroyed = false;
    this.boundChange = (event) => this.handleChange(event);
  }

  mount() {
    this.body.classList.add('v2-panel__body--local-media');
    this.root = element('section', 'v2-local-media');
    this.root.appendChild(element(
      'p',
      'v2-local-media__intro',
      this.object.intro || '照片只保存在这台设备的猫窝里。'
    ));
    this.grid = element('div', 'v2-local-media__grid');
    this.slotViews = this.keys.map((key, index) => this.createSlot(key, index));
    this.root.appendChild(this.grid);
    this.status = element('p', 'v2-local-media__status', '正在查看本机照片槽…');
    this.status.setAttribute('aria-live', 'polite');
    this.root.appendChild(this.status);
    this.root.addEventListener('change', this.boundChange);
    this.body.replaceChildren(this.root);
    this.load();
  }

  createSlot(key, index) {
    const card = element('article', 'v2-local-media__slot');
    card.dataset.slotIndex = String(index);
    const title = element('strong', 'v2-local-media__slot-title', `照片 ${index + 1}`);
    const state = element('span', 'v2-local-media__slot-state', '空槽');
    const picker = element('label', 'v2-local-media__picker', '选择图片');
    const input = element('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.dataset.localMediaIndex = String(index);
    input.dataset.localMediaKey = key;
    picker.appendChild(input);
    const clear = element('button', 'v2-local-media__clear', '清空');
    clear.type = 'button';
    clear.dataset.localMediaClear = String(index);
    clear.hidden = true;
    card.append(title, state, picker, clear);
    this.grid.appendChild(card);
    return { card, state, input, clear };
  }

  async load() {
    const result = await readLegacyMemorySlots({
      databaseName: this.target.database,
      storeName: this.target.store,
      keys: this.keys
    });
    if (this.destroyed) return;
    this.slots = result.slots;
    this.render();
    this.status.textContent = result.status === 'ready'
      ? '本机照片槽已载入。替换后重新打开照片墙即可看到。'
      : '可以从这里建立本机照片槽；不会上传到云端。';
  }

  render() {
    this.slotViews.forEach((view, index) => {
      const filled = Boolean(this.slots[index]);
      view.card.dataset.filled = filled ? '1' : '0';
      view.state.textContent = filled ? '已保存' : '空槽';
      view.clear.hidden = !filled;
    });
  }

  async handleChange(event) {
    const input = event.target.closest?.('[data-local-media-key]');
    if (!input) return;
    const index = Number(input.dataset.localMediaIndex);
    const file = input.files?.[0];
    if (!file) return;
    this.status.textContent = `正在保存照片 ${index + 1}…`;
    try {
      await writeLegacyMemorySlot({
        databaseName: this.target.database,
        storeName: this.target.store,
        keys: this.keys,
        key: input.dataset.localMediaKey,
        value: file
      });
      this.slots[index] = file;
      this.render();
      this.status.textContent = `照片 ${index + 1} 已保存在这台设备。`;
    } catch (error) {
      this.status.textContent = error.message;
    } finally {
      input.value = '';
    }
  }

  async clear(index) {
    const key = this.keys[index];
    if (!key) return;
    this.status.textContent = `正在清空照片 ${index + 1}…`;
    try {
      await clearLegacyMemorySlot({
        databaseName: this.target.database,
        storeName: this.target.store,
        keys: this.keys,
        key
      });
      this.slots[index] = null;
      this.render();
      this.status.textContent = `照片 ${index + 1} 已清空。`;
    } catch (error) {
      this.status.textContent = error.message;
    }
  }

  handleClick(target) {
    const clear = target.closest?.('[data-local-media-clear]');
    if (!clear) return false;
    this.clear(Number(clear.dataset.localMediaClear));
    return true;
  }

  destroy() {
    this.destroyed = true;
    this.root?.removeEventListener('change', this.boundChange);
    this.body.classList.remove('v2-panel__body--local-media');
  }
}
