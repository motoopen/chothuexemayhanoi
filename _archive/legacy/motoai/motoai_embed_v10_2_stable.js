<!-- MotoAI v10.2 Stable Full -->
(function(){
  if(window.MotoAI_v10_2_LOADED) return;
  window.MotoAI_v10_2_LOADED = true;

  // === HTML ===
  const html = `
  <div id="motoai-root">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">🤖</div>
    <div id="motoai-backdrop"></div>
    <div id="motoai-card" aria-hidden="true">
      <div id="motoai-handle"></div>
      <div id="motoai-header">
        <span>MotoAI Assistant</span>
        <button id="motoai-close" title="Đóng">✕</button>
      </div>
      <div id="motoai-body">
        <div class="m-msg bot">👋 Xin chào! Mình là MotoAI. Hỏi thử “Xe ga”, “Xe số”, “Thủ tục” hoặc “Xe 50cc” nhé!</div>
      </div>
      <div id="motoai-suggestions">
        <button data-q="Xe số">🏍 Xe số</button>
        <button data-q="Xe ga">🛵 Xe ga</button>
        <button data-q="Xe 50cc">🚲 Xe 50cc</button>
        <button data-q="Thủ tục">📄 Thủ tục</button>
      </div>
      <div id="motoai-footer">
        <input id="motoai-input" placeholder="Nhập câu hỏi..." autocomplete="off"/>
        <button id="motoai-send">Gửi</button>
      </div>
      <button id="motoai-clear" title="Xóa cuộc trò chuyện">🗑</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // === CSS ===
  const style = document.createElement('style');
  style.textContent = `
  :root {
    --m10-accent:#007aff;
    --m10-bg-light:#fff;
    --m10-bg-dark:#1b1c1f;
  }

  #motoai-root {
    position:fixed;left:16px;bottom:100px;z-index:99997;
  }
  #motoai-bubble {
    width:58px;height:58px;border-radius:14px;
    display:flex;align-items:center;justify-content:center;
    font-size:28px;background:var(--m10-accent);color:#fff;
    cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.25);
    transition:transform .25s;
  }
  #motoai-bubble:hover { transform:scale(1.05); }
  #motoai-backdrop {
    position:fixed;inset:0;background:rgba(0,0,0,0.25);
    opacity:0;pointer-events:none;transition:opacity .3s;z-index:99998;
  }
  #motoai-backdrop.show { opacity:1;pointer-events:auto; }

  #motoai-card {
    position:fixed;left:0;right:0;bottom:0;
    width:min(900px,calc(100% - 30px));
    margin:auto;height:70vh;max-height:720px;
    border-radius:18px 18px 0 0;
    background:var(--m10-bg-light);
    box-shadow:0 -12px 40px rgba(0,0,0,.18);
    transform:translateY(110%);opacity:0;
    display:flex;flex-direction:column;
    overflow:hidden;z-index:99999;
    transition:transform .4s cubic-bezier(.2,.9,.2,1),opacity .3s;
  }
  #motoai-card.open { transform:translateY(0);opacity:1; }
  #motoai-handle {
    width:60px;height:6px;background:#d0d6dc;border-radius:6px;margin:10px auto;
  }
  #motoai-header {
    display:flex;align-items:center;justify-content:space-between;
    padding:6px 14px;font-weight:700;color:var(--m10-accent);
    border-bottom:1px solid rgba(0,0,0,.08);
  }
  #motoai-close {
    background:none;border:none;font-size:22px;cursor:pointer;color:var(--m10-accent);opacity:.85;
  }
  #motoai-body {
    flex:1;overflow-y:auto;padding:10px 14px;font-size:15px;background:rgba(250,250,250,.6);
  }
  .m-msg { margin:8px 0;padding:10px 12px;border-radius:12px;max-width:84%;line-height:1.4;word-break:break-word; }
  .m-msg.user { background:linear-gradient(180deg,var(--m10-accent),#00b6ff);color:#fff;margin-left:auto; }
  .m-msg.bot { background:rgba(240,240,246,.95);color:#111; }

  #motoai-suggestions {
    display:flex;gap:6px;justify-content:center;flex-wrap:wrap;
    padding:6px 10px;border-top:1px solid rgba(0,0,0,.05);
    background:rgba(255,255,255,.85);
  }
  #motoai-suggestions button {
    border:none;background:rgba(0,122,255,.08);color:var(--m10-accent);
    padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:500;
  }

  #motoai-footer {
    display:flex;align-items:center;justify-content:flex-start;
    gap:6px;padding:10px 12px 12px;
    border-top:1px solid rgba(0,0,0,0.06);
    background:rgba(255,255,255,0.7);
    backdrop-filter:blur(8px);
  }
  #motoai-input {
    flex:1;padding:11px 12px;
    border-radius:16px;border:1px solid rgba(0,0,0,0.08);
    font-size:15px;margin-left:2px;
  }
  #motoai-send {
    background:var(--m10-accent);color:#fff;border:none;border-radius:14px;
    padding:10px 16px;font-weight:600;
    box-shadow:0 2px 6px rgba(0,0,0,0.12);
    transition:transform 0.15s ease;
  }
  #motoai-send:active { transform:scale(0.94); }

  #motoai-clear {
    position:absolute;top:10px;right:40px;background:none;border:none;
    font-size:18px;cursor:pointer;opacity:.8;
  }

  @media(prefers-color-scheme:dark){
    #motoai-card{background:var(--m10-bg-dark)}
    .m-msg.bot{background:rgba(40,40,50,.9);color:#eee}
    #motoai-footer{background:rgba(25,25,30,.9)}
    #motoai-suggestions{background:rgba(25,25,30,.95)}
  }
  `;
  document.head.appendChild(style);

  // === JS ===
  const $ = s => document.querySelector(s);
  const bubble = $('#motoai-bubble');
  const card = $('#motoai-card');
  const backdrop = $('#motoai-backdrop');
  const closeBtn = $('#motoai-close');
  const sendBtn = $('#motoai-send');
  const input = $('#motoai-input');
  const clear = $('#motoai-clear');
  const bodyEl = $('#motoai-body');
  const state = { msgs: [], userName:null };

  function addMsg(role,text){
    const d=document.createElement('div');
    d.className='m-msg '+role;
    d.textContent=text;
    bodyEl.appendChild(d);
    bodyEl.scrollTop=bodyEl.scrollHeight;
  }

  function openChat(){
    card.classList.add('open');
    backdrop.classList.add('show');
    bubble.style.display='none';
  }
  function closeChat(){
    card.classList.remove('open');
    backdrop.classList.remove('show');
    bubble.style.display='flex';
  }
  function clearChat(){
    localStorage.removeItem('motoai_memory');
    bodyEl.innerHTML='<div class="m-msg bot">🗑 Đã xóa hội thoại.</div>';
  }

  async function ask(q){
    if(!q.trim()) return;
    addMsg('user', q);
    input.value='';
    sendBtn.disabled=true;
    await new Promise(r=>setTimeout(r,400));

    // "Tự học từ web" nhẹ: tìm câu tương đồng trong nội dung trang
    const txt = document.body.innerText || '';
    const found = txt.split(/[.?!]/).find(s=>s.toLowerCase().includes(q.toLowerCase()));
    const ans = found ? found.trim() : '🤔 Mình chưa rõ, nhưng sẽ học thêm từ nội dung web này!';
    addMsg('bot', ans);

    sendBtn.disabled=false;
  }

  bubble.onclick=openChat;
  backdrop.onclick=closeChat;
  closeBtn.onclick=closeChat;
  clear.onclick=clearChat;
  sendBtn.onclick=()=>ask(input.value);
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(input.value);}
  });
  document.querySelectorAll('#motoai-suggestions button').forEach(btn=>{
    btn.onclick=()=>ask(btn.dataset.q);
  });

  console.log('✅ MotoAI v10.2 Stable Full Loaded');
})();
