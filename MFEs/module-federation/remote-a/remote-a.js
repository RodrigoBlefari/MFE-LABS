export function render(outlet){
  const el = document.createElement('section');
  el.style = 'padding:8px;border:1px solid #ccc;border-radius:8px';
  el.innerHTML = `<h2>Remote-A (MF demo ESM)</h2>
    <button id="mf-ping">Emitir BUS (MF)</button>`;
  outlet.innerHTML = '';
  outlet.appendChild(el);
  el.querySelector('#mf-ping').onclick = () => window.dispatchEvent(new CustomEvent('BUS', { detail: { type: 'MF-PING' } }));
}
