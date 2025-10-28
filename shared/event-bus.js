export const bus = {
  on(type, cb){ window.addEventListener(type, cb); },
  off(type, cb){ window.removeEventListener(type, cb); },
  emit(type, detail){ window.dispatchEvent(new CustomEvent(type, { detail })); }
};
