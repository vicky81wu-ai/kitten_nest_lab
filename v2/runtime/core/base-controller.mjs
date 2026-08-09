export class BaseController {
  constructor(id, context) {
    this.id = id;
    this.context = context;
    this.status = 'created';
    this.lastSnapshot = null;
  }

  mark(status, detail = '') {
    this.status = status;
    this.context?.setControllerStatus?.(this.id, status, detail);
  }

  async mount() {
    this.mark('mounted');
  }

  async ready() {
    this.mark('ready');
  }

  async reconcile(snapshot) {
    this.lastSnapshot = snapshot || null;
    this.mark('ready');
  }

  async suspend(reason = 'suspend') {
    this.mark('suspended', reason);
  }

  async destroy() {
    this.mark('destroyed');
  }
}
