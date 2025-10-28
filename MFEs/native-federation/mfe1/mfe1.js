export function render(outlet){
  const el = document.createElement('section');
  el.style = 'padding:8px;border:1px solid #ccc;border-radius:8px';
  el.innerHTML = `<h2>MFE1 (Native Federation demo ESM)</h2>
    <button id="nf-ping">Emitir BUS (NF)</button>`;
  outlet.innerHTML = '';
  outlet.appendChild(el);
  el.querySelector('#nf-ping').onclick = () => window.dispatchEvent(new CustomEvent('BUS', { detail: { type: 'NF-PING' } }));
}
