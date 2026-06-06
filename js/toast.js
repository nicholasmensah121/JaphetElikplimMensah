// Toast Notification System
// Simple and elegant toast notifications for user feedback

class Toast {
  constructor(options = {}) {
    this.duration = options.duration || 4000;
    this.container = this.getOrCreateContainer();
  }

  getOrCreateContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      document.body.appendChild(container);
    }
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    container.classList.add('toast-container');
    return container;
  }

  show(message, type = 'info', duration = null) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: 'OK',
      error: 'X',
      warning: '!',
      info: 'i'
    };

    const iconElement = document.createElement('div');
    iconElement.className = 'toast-icon';
    iconElement.textContent = icons[type] || icons.info;

    const messageElement = document.createElement('div');
    messageElement.className = 'toast-message';
    messageElement.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.textContent = 'x';

    toast.appendChild(iconElement);
    toast.appendChild(messageElement);
    toast.appendChild(closeBtn);

    closeBtn.addEventListener('click', () => this.removeToast(toast));

    this.container.appendChild(toast);

    const displayDuration = duration || this.duration;
    const timeoutId = setTimeout(() => this.removeToast(toast), displayDuration);

    toast.addEventListener('mouseenter', () => clearTimeout(timeoutId));
    toast.addEventListener('mouseleave', () => {
      setTimeout(() => this.removeToast(toast), displayDuration);
    });

    return toast;
  }

  removeToast(toast) {
    toast.classList.add('exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  success(message, duration = null) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = null) {
    return this.show(message, 'error', duration || 5000);
  }

  warning(message, duration = null) {
    return this.show(message, 'warning', duration || 4000);
  }

  info(message, duration = null) {
    return this.show(message, 'info', duration);
  }

  clearAll() {
    const toasts = this.container.querySelectorAll('.toast');
    toasts.forEach((toastElement) => this.removeToast(toastElement));
  }
}

const toast = new Toast({
  duration: 4000
});

window.toast = toast;
window.showToast = (message, type = 'info', duration = null) => {
  return toast.show(message, type, duration);
};
