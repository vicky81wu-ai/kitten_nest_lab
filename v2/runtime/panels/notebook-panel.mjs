import { resolveNotebookState } from '../core/notebook-state.mjs';
import {
  buildNotebookDeletePatch,
  buildNotebookFavoritePatch,
  buildNotebookSavePatch,
  notebookWriteFields
} from '../core/notebook-mutations.mjs';

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function actionButton(label, action, className = '') {
  const button = element('button', `v2-notebook__action ${className}`.trim(), label);
  button.type = 'button';
  button.dataset.notebookAction = action;
  return button;
}

export class NotebookPanelSession {
  constructor({ body, object, state, writer, onCommit, canWrite = false, confirmDelete }) {
    this.body = body;
    this.object = object;
    this.state = state || {};
    this.writer = writer || null;
    this.onCommit = onCommit || (() => {});
    this.canWrite = Boolean(canWrite);
    this.confirmDelete = confirmDelete || ((message) => globalThis.confirm?.(message) === true);
    this.index = 0;
    this.busy = false;
    this.editingKey = false;
    this.boundKeydown = (event) => this.handleKeydown(event);
  }

  mount() {
    this.body.classList.add('v2-panel__body--notebook');
    this.root = element('section', 'v2-notebook');

    this.page = element('article', 'v2-notebook__page');
    this.pageHead = element('div', 'v2-notebook__page-head');
    this.pageLabel = element('strong', 'v2-notebook__page-label');
    this.pageDate = element('span', 'v2-notebook__page-date');
    this.pageHead.append(this.pageLabel, this.pageDate);
    this.pageText = element('p', 'v2-notebook__page-text');
    this.page.append(this.pageHead, this.pageText);
    this.root.appendChild(this.page);

    this.actions = element('div', 'v2-notebook__actions');
    this.newButton = actionButton('写新页', 'new');
    this.loadButton = actionButton('载入编辑', 'load');
    this.favoriteButton = actionButton('收藏', 'favorite');
    this.deleteButton = actionButton('删除', 'delete', 'v2-notebook__action--danger');
    this.actions.append(this.newButton, this.loadButton, this.favoriteButton, this.deleteButton);
    this.root.appendChild(this.actions);

    this.editor = element('section', 'v2-notebook__editor');
    this.editor.hidden = true;
    this.textarea = element('textarea', 'v2-notebook__textarea');
    this.textarea.placeholder = '写新页，保存后会立刻住进永久档案……';
    this.textarea.maxLength = this.object.maxChars || 5000;
    this.textarea.setAttribute('aria-label', '粉本本编辑页');
    const editorButtons = element('div', 'v2-notebook__editor-buttons');
    editorButtons.append(
      actionButton('收起', 'cancelEdit', 'v2-notebook__action--quiet'),
      actionButton('保存到档案', 'save', 'v2-notebook__action--primary')
    );
    this.editor.append(this.textarea, editorButtons);
    this.root.appendChild(this.editor);

    this.tabs = element('div', 'v2-notebook__tabs');
    this.tabs.setAttribute('aria-label', '粉本本页签');
    this.root.appendChild(this.tabs);

    this.empty = element('p', 'v2-notebook__empty');
    this.root.appendChild(this.empty);

    this.auth = element('div', 'v2-notebook__auth');
    this.keyInput = element('input', 'v2-notebook__key');
    this.keyInput.type = 'password';
    this.keyInput.autocomplete = 'off';
    this.keyInput.placeholder = 'Nest key（只保存在这台设备）';
    this.keyInput.setAttribute('aria-label', 'Nest key');
    this.changeKeyButton = actionButton('🐾 更换钥匙', 'changeKey', 'v2-notebook__action--quiet');
    this.authNote = element('span', 'v2-notebook__auth-note');
    this.auth.append(this.keyInput, this.changeKeyButton, this.authNote);
    this.root.appendChild(this.auth);

    this.status = element('p', 'v2-notebook__status');
    this.status.setAttribute('role', 'status');
    this.status.setAttribute('aria-live', 'polite');
    this.root.appendChild(this.status);
    this.meta = element('p', 'v2-notebook__meta');
    this.root.appendChild(this.meta);

    this.body.replaceChildren(this.root);
    this.root.addEventListener('keydown', this.boundKeydown);
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
    this.empty.textContent = '永久档案里暂时没有历史页。写一页，它就会住进来。';
    this.renderWriteMode();
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
    this.renderActions();
  }

  renderActions() {
    if (!this.newButton) return;
    const page = this.pages?.[this.index];
    const writable = this.writable();
    this.actions.hidden = !writable;
    this.newButton.hidden = !writable || page?.kind !== 'current';
    this.loadButton.hidden = !writable || page?.kind !== 'archive';
    this.favoriteButton.hidden = !writable || page?.kind !== 'archive';
    this.deleteButton.hidden = !writable || page?.kind !== 'archive';
    this.favoriteButton.textContent = page?.favorite ? '取消收藏' : '收藏';
  }

  renderWriteMode() {
    const writable = this.writable();
    this.root.dataset.notebookMode = writable ? 'writable' : 'readonly';
    this.auth.hidden = !writable;
    if (!writable) {
      this.editor.hidden = true;
      this.meta.textContent = '云端档案未连接，现在只读翻阅；不会把预览稿写进真实档案。';
      this.renderActions();
      return;
    }
    const hasToken = Boolean(this.writer.token());
    const showInput = this.editingKey || !hasToken;
    this.keyInput.hidden = !showInput;
    this.changeKeyButton.hidden = !hasToken;
    this.authNote.textContent = showInput ? '钥匙验证成功后才会记住。' : '这台设备已记住钥匙。';
    this.meta.textContent = '保存会进入永久档案；删除只会移入回收篮。';
    this.renderActions();
  }

  writable() {
    return this.canWrite && Boolean(this.writer?.configured?.());
  }

  selectedPage() {
    return this.pages?.[this.index] || null;
  }

  openEditor(value = '', source = 'new') {
    if (!this.writable()) return;
    this.editor.hidden = false;
    this.textarea.value = value;
    this.textarea.dataset.editSource = source;
    this.setStatus(source === 'archive' ? '这页已经载入；改完再保存，会成为一页新档案。' : '新页和当前预览分开，放心写。');
    requestAnimationFrame(() => {
      this.textarea.focus();
      this.editor.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  closeEditor() {
    this.editor.hidden = true;
    this.textarea.value = '';
    delete this.textarea.dataset.editSource;
  }

  setStatus(message = '', error = false) {
    this.status.textContent = message;
    this.status.dataset.error = error ? '1' : '0';
  }

  setBusy(busy) {
    this.busy = busy;
    this.root.setAttribute('aria-busy', String(busy));
    this.root.querySelectorAll('button, input, textarea').forEach((control) => {
      control.disabled = busy;
    });
  }

  requireToken() {
    const supplied = this.keyInput.hidden ? '' : this.keyInput.value.trim();
    if (supplied || this.writer.token()) return supplied;
    this.editingKey = true;
    this.renderWriteMode();
    this.keyInput.focus();
    throw new Error('先填 Nest key 才能保存。');
  }

  async persist(patch) {
    const token = this.requireToken();
    const value = await this.writer.write({
      patch,
      allowedFields: notebookWriteFields(this.object),
      token
    });
    this.state = value;
    this.editingKey = false;
    this.keyInput.value = '';
    this.onCommit(value);
    this.renderWriteMode();
    return value;
  }

  async runAction(action) {
    if (this.busy) return;
    const page = this.selectedPage();
    if (action === 'new') {
      this.openEditor('', 'new');
      return;
    }
    if (action === 'load' && page?.kind === 'archive') {
      this.openEditor(page.text, 'archive');
      return;
    }
    if (action === 'cancelEdit') {
      this.closeEditor();
      this.setStatus('编辑页收好了，没有写入。');
      return;
    }
    if (action === 'changeKey') {
      this.editingKey = true;
      this.keyInput.value = '';
      this.renderWriteMode();
      this.keyInput.focus();
      return;
    }

    this.setBusy(true);
    try {
      if (action === 'save') {
        const patch = buildNotebookSavePatch(this.textarea.value, this.state, this.object);
        await this.persist(patch);
        this.closeEditor();
        this.setStatus('保存好了：当前页和永久档案已经一起更新。');
        return;
      }
      if (action === 'favorite' && page?.kind === 'archive') {
        const result = buildNotebookFavoritePatch(page.key, this.state, this.object);
        await this.persist(result.patch);
        this.setStatus(result.favorite ? '这页已经收藏。' : '这页已经取消收藏。');
        return;
      }
      if (action === 'delete' && page?.kind === 'archive') {
        if (!this.confirmDelete('删除这页档案？它会移入回收篮，不会永久消失。')) return;
        const result = buildNotebookDeletePatch(page.key, this.state, this.object);
        await this.persist(result.patch);
        this.setStatus('这页已移入回收篮，没有永久删除。');
      }
    } finally {
      this.setBusy(false);
    }
  }

  handleError(error) {
    if (error?.status === 401) {
      this.editingKey = true;
      this.keyInput.value = '';
      this.renderWriteMode();
      requestAnimationFrame(() => this.keyInput.focus());
    }
    this.setStatus(error?.message || '粉本本没有保存成功。', true);
  }

  handleClick(target) {
    const tab = target.closest?.('[data-notebook-index]');
    if (tab) {
      const index = Number(tab.dataset.notebookIndex);
      if (!Number.isInteger(index) || !this.pages[index]) return false;
      this.index = index;
      this.renderPage();
      return true;
    }
    const actionButton = target.closest?.('[data-notebook-action]');
    if (!actionButton) return false;
    void this.runAction(actionButton.dataset.notebookAction).catch((error) => this.handleError(error));
    return true;
  }

  handleKeydown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !this.editor.hidden) {
      event.preventDefault();
      void this.runAction('save').catch((error) => this.handleError(error));
    }
  }

  update(state, options = {}) {
    if (typeof options.canWrite === 'boolean') this.canWrite = options.canWrite;
    this.applyState(state, true);
  }

  destroy() {
    this.root?.removeEventListener('keydown', this.boundKeydown);
    this.pages = [];
    this.body.classList.remove('v2-panel__body--notebook');
  }
}
