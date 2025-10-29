let teardown = null;

export function render(outlet, options = {}){
  if (!(outlet instanceof Element)) {
    throw new Error('MFE1 render precisa de um elemento host valido.');
  }

  teardown?.();

  const container = document.createElement('section');
  container.style = 'padding:8px;border:1px solid #ccc;border-radius:8px';
  container.innerHTML = `<h2>MFE1 (Native Federation demo ESM)</h2>
    <button id="nf-ping">Emitir BUS (NF)</button>`;

  outlet.innerHTML = '';
  outlet.appendChild(container);

  const pingBtn = container.querySelector('#nf-ping');
  const onBus = (event) => {
    if (options.onBus) {
      options.onBus(event.detail);
    }
  };
  window.addEventListener('BUS', onBus);

  pingBtn.onclick = () => window.dispatchEvent(new CustomEvent('BUS', { detail: { type: 'NF-PING' } }));

  teardown = () => {
    pingBtn.onclick = null;
    window.removeEventListener('BUS', onBus);
    if (container.isConnected) {
      container.remove();
    }
    if (outlet) {
      outlet.innerHTML = '';
    }
    teardown = null;
  };

  return teardown;
}

export function unmount() {
  teardown?.();
}
