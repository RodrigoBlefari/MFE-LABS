let destroyCurrent = null;

export function render(outlet, options = {}){
  if (!(outlet instanceof Element)) {
    throw new Error('Remote-A render precisa de um elemento host valido.');
  }

  destroyCurrent?.();

  const container = document.createElement('section');
  container.style = 'padding:8px;border:1px solid #ccc;border-radius:8px';
  container.innerHTML = `<h2>${options.title || 'Remote-A (MF demo ESM)'}</h2>
    <button id="mf-ping">Emitir BUS (MF)</button>`;

  outlet.innerHTML = '';
  outlet.appendChild(container);

  const pingBtn = container.querySelector('#mf-ping');
  pingBtn.onclick = () => window.dispatchEvent(new CustomEvent('BUS', { detail: { type: 'MF-PING' } }));

  destroyCurrent = () => {
    pingBtn.onclick = null;
    if (container.isConnected) {
      container.remove();
    }
    if (outlet) {
      outlet.innerHTML = '';
    }
    destroyCurrent = null;
  };

  return destroyCurrent;
}

export function unmount() {
  destroyCurrent?.();
}
