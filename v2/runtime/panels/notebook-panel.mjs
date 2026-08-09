import { resolveNotebookState } from '../core/notebook-state.mjs';

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export class NotebookPanelSession {
  constructor({ body, object, state }) {
    this.body = body;
    this.object = object;
    this.state = state || {};
    this.index = 0;
  }

  mount() {
    this.body.classList.add('v2-panel__body--notebook');
    this.root = element('section', 'v2-notebook');
    this.root.dataset.notebookMode = 'readonly';

    this.page = element('article', 'v2-notebook__page');
    this.pageHead = element('div', 'v2-notebook__page-head');
    this.pageLabel = element('strong', 'v2-notebook__page-label');
    this.pageDate = element('span', 'v2-notebook__page-date');
    this.pageHead.append(this.pageLabel, this.pageDate);
    this.pageText = element('p', 'v2-notebook__page-text');
    this.page.append(this.pageHead, this.pageText);
    this.root.appendChild(this.page);

    this.tabs = element('div', 'v2-notebook__tabs');
    this.tabs.setAttribute('aria-label', '粉本本页签');
    this.root.appendChild(this.tabs);

    this.empty = element('p', 'v2-notebook__empty');
    this.root.appendChild(this.empty);
    this.root.appendChild(element('p', 'v2-notebook__meta', '只读翻阅，不会改动档案。'));
    this.body.replaceChildren(this.root);
    this.applyState(this.state, false);
  }

  applyState(state, preserveSelection = true) {
    const selectedKey = preserveSelection ? this.pages?.[this.index]?.key : null;
    this.state = state || {};
    const resolved = resolveNotebookState(this.state, this.object);
    this.pages = resolved.pages;
    const preservedIndex = selectedKey
      ? this.pages.findIndex((page) => page.key === selectedKey)
      : -1;
    this.index = preservedIndex >= 0
      ? preservedIndex
      : resolved.current.empty && resolved.archive.length ? 1 : 0;
    this.buildTabs();
    this.renderPage();
    this.empty.hidden = resolved.archive.length > 0;
    this.empty.textContent = '永久档案里暂时没有可翻阅的历史页。';
  }

  buildTabs() {
    this.tabs.replaceChildren();
    this.pages.forEach((page, index) => {
      const tab = element(
        'button',
        'v2-notebook__tab',
        `${page.favorite ? '★ ' : ''}${page.label}`
      );
      tab.type = 'button';
      tab.dataset.notebookIndex = String(index);
      tab.setAttribute('aria-pressed', String(index === this.index));
      this.tabs.appendChild(tab);
    });
  }

  renderPage() {
    const page = this.pages[this.index] || this.pages[0];
    this.page.dataset.pageKind = page.kind;
    this.pageLabel.textContent = `${page.favorite ? '★ ' : ''}${page.label}`;
    this.pageDate.textContent = page.date;
    this.pageDate.hidden = !page.date;
    this.pageText.textContent = page.text;
    [...this.tabs.children].forEach((tab, index) => {
      tab.setAttribute('aria-pressed', String(index === this.index));
    });
  }

  handleClick(target) {
    const tab = target.closest?.('[data-notebook-index]');
    if (!tab) return false;
    const index = Number(tab.dataset.notebookIndex);
    if (!Number.isInteger(index) || !this.pages[index]) return false;
    this.index = index;
    this.renderPage();
    return true;
  }

  update(state) {
    this.applyState(state, true);
  }

  destroy() {
    this.pages = [];
    this.body.classList.remove('v2-panel__body--notebook');
  }
}
