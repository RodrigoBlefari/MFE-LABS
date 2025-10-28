let el;
export function bootstrap(){}
export function mount(props){
  el = props.outlet || document.createElement('div');
  el.innerHTML = `<section style="padding:8px;border:1px solid #ccc;border-radius:8px">
    <h2>MFE-A (Single-SPA demo)</h2>
    <button id="ping">Emitir PING</button>
    <div id="log"></div>
  </section>`;
  (props.outlet || document.body).appendChild(el);
  document.getElementById('ping').onclick = () => window.dispatchEvent(new CustomEvent('BUS', { detail: { type: 'PING' } }));
  function onMsg(ev){ if(ev.type==='BUS'){ el.querySelector('#log').textContent = 'Recebido BUS'; } }
  window.addEventListener('BUS', onMsg);
  el._onMsg = onMsg;
}
export function unmount(){
  if (!el) return;
  window.removeEventListener('BUS', el._onMsg);
  el.remove();
  el = null;
}
