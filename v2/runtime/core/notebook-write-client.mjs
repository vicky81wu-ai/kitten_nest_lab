function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function storageKeys(config = {}) {
  return Array.isArray(config.tokenStorageKeys) && config.tokenStorageKeys.length
    ? config.tokenStorageKeys
    : ['kittenNestToken', 'nestToken'];
}

function safeStorage(storage) {
  return {
    get(key) {
      try { return clean(storage?.getItem?.(key)); } catch { return ''; }
    },
    set(key, value) {
      try { storage?.setItem?.(key, value); } catch { /* Device storage can be unavailable. */ }
    },
    remove(key) {
      try { storage?.removeItem?.(key); } catch { /* Device storage can be unavailable. */ }
    }
  };
}

async function responseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export class NotebookWriteClient {
  constructor(options = {}) {
    const config = options.config || {};
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    let storage = options.storage;
    if (storage === undefined) {
      try { storage = globalThis.localStorage; } catch { storage = null; }
    }
    this.endpoint = config.endpoint || '';
    this.authHeader = config.authHeader || 'X-Nest-Token';
    this.tokenKeys = storageKeys(config);
    this.fetchImpl = fetchImpl;
    this.storage = safeStorage(storage);
  }

  configured() {
    return Boolean(this.endpoint && this.authHeader && typeof this.fetchImpl === 'function');
  }

  token() {
    for (const key of this.tokenKeys) {
      const value = this.storage.get(key);
      if (value) return value;
    }
    return '';
  }

  rememberToken(value) {
    const token = clean(value);
    if (token) this.storage.set(this.tokenKeys[0], token);
  }

  forgetToken() {
    this.tokenKeys.forEach((key) => this.storage.remove(key));
  }

  async write({ patch, allowedFields, token: suppliedToken }) {
    if (!this.configured()) throw new Error('粉本本写接口还没有接好。');
    const token = clean(suppliedToken) || this.token();
    if (!token) throw new Error('先填 Nest key 才能保存。');

    const allowlist = new Set(allowedFields || []);
    const fields = Object.keys(patch || {});
    if (!fields.length || fields.some((field) => !allowlist.has(field))) {
      throw new Error('粉本本拒绝了越界写入。');
    }

    const response = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [this.authHeader]: token
      },
      body: JSON.stringify(patch),
      cache: 'no-store'
    });
    const data = await responseJson(response);
    if (!response.ok || !data.ok) {
      const error = new Error(
        response.status === 401
          ? 'Nest key 不对，重新填一下。'
          : data.error || data.message || `保存失败（${response.status}）`
      );
      error.status = response.status;
      if (response.status === 401) this.forgetToken();
      throw error;
    }
    if (!data.value || typeof data.value !== 'object' || Array.isArray(data.value)) {
      throw new Error('保存接口没有返回完整档案。');
    }
    this.rememberToken(token);
    return data.value;
  }
}
