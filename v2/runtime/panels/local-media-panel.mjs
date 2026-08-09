import { readLegacyMemorySlots } from '../core/legacy-memory-source.mjs';
import { clearLegacyMemorySlot, writeLegacyMemorySlot } from '../core/local-memory-store.mjs';

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export class LocalMediaPanelSession {
  constructor({ body, object, onLocalAssetChange = null }) {
    this.body = body;
    this.object = object;
    this.target = object.memoryTarget || {};
    this.keys = Array.isArray(this.target.keys) ? this.target.keys : [];
    this.tabs = Array.isArray(this.target.tabs) ? this.target.tabs : [];
    this.slotDefinitions = this.tabs.flatMap((tab) => tab.slots || []);
    this.slots = new Map(this.keys.map((key) => [key, null]));
    this.slotViews = new Map();
    this.onLocalAssetChange = onLocalAssetChange;
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
    this.tabList = element('div', 'v2-local-media__tabs');
    this.tabList.setAttribute('role', 'tablist');
    this.pages = element('div', 'v2-local-media__pages');
    this.tabs.forEach((tab, index) => this.createTab(tab, index));
    this.root.append(this.tabList, this.pages);
    this.status = element('p', 'v2-local-media__status', '正在查看本机素材…');
    this.status.setAttribute('aria-live', 'polite');
    this.root.appendChild(this.status);
    this.root.addEventListener('change', this.boundChange);
    this.body.replaceChildren(this.root);
    this.load();
  }

  createTab(tab, index) {
    const button = element('button', 'v2-local-media__tab', tab.label || tab.id);
    button.type = 'button';
    button.dataset.localMediaTab = tab.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    this.tabList.appendChild(button);

    const page = element('section', 'v2-local-media__page');
    page.dataset.localMediaPage = tab.id;
    page.setAttribute('role', 'tabpanel');
    page.hidden = index !== 0;
    if (Array.isArray(tab.slots) && tab.slots.length) {
      const grid = element('div', 'v2-local-media__grid');
      tab.slots.forEach((slot) => this.createSlot(grid, slot));
      page.appendChild(grid);
    } else {
      page.appendChild(element('p', 'v2-local-media__other', tab.text || '本机素材优先，清空后恢复默认来源。'));
    }
    this.pages.appendChild(page);
  }

  createSlot(grid, slot) {
    const key = slot.key;
    const card = element('article', 'v2-local-media__slot');
    card.dataset.localMediaKind = slot.kind || 'photo';
    const title = element('strong', 'v2-local-media__slot-title', slot.label || key);
    const state = element('span', 'v2-local-media__slot-state', slot.defaultState || '空槽');
    const actions = element('div', 'v2-local-media__slot-actions');
    const picker = element('label', 'v2-local-media__picker');
    const pickerText = element('span', '', '选择本机图');
    const input = element('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.dataset.localMediaKey = key;
    picker.append(pickerText, input);
    const clear = element('button', 'v2-local-media__clear', slot.clearLabel || '清空');
    clear.type = 'button';
    clear.dataset.localMediaClear = key;
    clear.hidden = true;
    actions.append(picker, clear);
    card.append(title, state, actions);
    grid.appendChild(card);
    this.slotViews.set(key, { card, state, input, clear, pickerText, slot });
  }

  async load() {
    const result = await readLegacyMemorySlots({
      databaseName: this.target.database,
      storeName: this.target.store,
      keys: this.keys
    });
    if (this.destroyed) return;
    this.keys.forEach((key, index) => this.slots.set(key, result.slots[index] || null));
    this.render();
    this.status.textContent = result.status === 'ready'
      ? '本机素材已载入；房间图会立即应用，照片墙重新打开后刷新。'
      : '可以从这里建立本机覆盖；图片不会上传到云端。';
  }

  render() {
    this.slotViews.forEach((view, key) => {
      const filled = Boolean(this.slots.get(key));
      view.card.dataset.filled = filled ? '1' : '0';
      view.state.textContent = filled ? '本机图' : (view.slot.defaultState || '空槽');
      view.pickerText.textContent = filled ? '替换本机图' : '选择本机图';
      view.clear.hidden = !filled;
    });
  }

  async handleChange(event) {
    const input = event.target.closest?.('[data-local-media-key]');
    if (!input) return;
    const key = input.dataset.localMediaKey;
    const view = this.slotViews.get(key);
    const file = input.files?.[0];
    if (!file) return;
    this.status.textContent = `正在保存${view?.slot?.label || '图片'}…`;
    try {
      await writeLegacyMemorySlot({
        databaseName: this.target.database,
        storeName: this.target.store,
        keys: this.keys,
        key,
        value: file
      });
      this.slots.set(key, file);
      this.render();
      const applied = await this.onLocalAssetChange?.(key);
      this.status.textContent = `${view?.slot?.label || '图片'}已保存在这台设备${applied ? '，并已应用' : ''}。`;
    } catch (error) {
      this.status.textContent = error.message;
    } finally {
      input.value = '';
    }
  }

  async clear(key) {
    const view = this.slotViews.get(key);
    if (!view || !this.keys.includes(key)) return;
    this.status.textContent = `正在清除${view.slot.label || '本机图'}…`;
    try {
      await clearLegacyMemorySlot({
        databaseName: this.target.database,
        storeName: this.target.store,
        keys: this.keys,
        key
      });
      this.slots.set(key, null);
      this.render();
      const applied = await this.onLocalAssetChange?.(key);
      this.status.textContent = `${view.slot.label || '本机图'}已清除${applied ? '，并恢复默认来源' : ''}。`;
    } catch (error) {
      this.status.textContent = error.message;
    }
  }

  handleClick(target) {
    const tab = target.closest?.('[data-local-media-tab]');
    if (tab) {
      const id = tab.dataset.localMediaTab;
      [...this.tabList.children].forEach((button) => {
        button.setAttribute('aria-selected', String(button.dataset.localMediaTab === id));
      });
      [...this.pages.children].forEach((page) => {
        page.hidden = page.dataset.localMediaPage !== id;
      });
      return true;
    }
    const clear = target.closest?.('[data-local-media-clear]');
    if (!clear) return false;
    this.clear(clear.dataset.localMediaClear);
    return true;
  }

  destroy() {
    this.destroyed = true;
    this.root?.removeEventListener('change', this.boundChange);
    this.body.classList.remove('v2-panel__body--local-media');
  }
}
