// toast.js
class ToastEmitter {
  constructor() {
    this.listeners = [];
  }

  // subscribe React component to toast events
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // emit a new toast
  show(type, message) {
    this.listeners.forEach((listener) => listener({ type, message }));
  }
}

const toast = new ToastEmitter();
export default toast;
