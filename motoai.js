// MotoAI Embed Script by Motoopen 😎 (v1.0.1)
(function(){
  // ====== Inject HTML ======
  const html = `
  <div id="motoai-root" aria-hidden="false">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">👩‍💻</div>
    <div id="motoai-backdrop" tabindex="-1" aria-hidden="true"></div>
    <div id="motoai-card" role="dialog" aria-modal="true" aria-hidden="true">
      <div id="motoai-handle"></div>
      <div id="motoai-header">Motoopen AI</div>
      <div id="motoai-body"></div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off" />
        <button id="motoai-send">Gửi</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  // ====== Inject CSS ======
  const css = `
  :root{
    --accent:#007aff;
    --card-bg:rgba(255,255,255,0.96);
    --card-bg-dark:rgba(20,20,22,0.94);
    --text:#111;
  }

  /* ✅ Apple Light Mode Fix */
  body {
    background:#f5f5f7;  /* Apple-style light gray */
    color:#111;
    transition: background .3s ease, color .3s ease;
  }

  @media(prefers-color-scheme:dark){
    :root{--card-bg:var(--card-bg-dark); --text:#eee;}
    body{background:#071021; color:#ddd;}
  }

  #motoai-root{position:fixed; left:18px; bottom:90px; z-index:2147483000; pointer-events:none;}
  #motoai-bubble{pointer-events:auto; width:58px; height:58px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:28px; background:var(--accent); color:#fff; box-shadow:0 10px 28px rgba(0,0,0,0.24); cursor:pointer;}
  #motoai-backdrop{position:fixed; inset:0; background:rgba(0,0,0,0.18); backdrop-filter:blur(6px); opacity:0; pointer-events:none; transition:opacity .28s ease; z-index:2147482999;}
  #motoai-backdrop.show{opacity:1; pointer-events:auto;}
  #motoai-card{
    position:fixed; left:0; right:0; bottom:0; height:70vh; max-height:720px;
    width:min(920px,calc(100% - 28px)); margin:auto; border-radius:18px 18px 0 0;
    background:var(--card-bg); box-shadow:0 -12px 40px rgba(10,20,30,0.18);
    transform:translateY(110%); opacity:0; transition:transform .42s cubic-bezier(.2,.9,.2,1), opacity .28s ease;
    display:flex; flex-direction:column; overflow:hidden; z-index:2147483000; pointer-events:auto;
  }
  #motoai-card.open{transform:translateY(0); opacity:1;}
  #motoai-handle{width:54px; height:6px; background:#d0d6dc; border-radius:6px; margin:10px auto; cursor:grab;}
  #motoai-header{padding:6px 14px; font-weight:700; color:var(--accent); text-align:center;}
  #motoai-body{flex:1; overflow:auto; padding:12px 14px; font-size:15px;}
  .m-msg{margin:8px 0; padding:10px 12px; border-radius:12px; max-width:84%; line-height:1.35; word-wrap:break-word;}
  .m-msg.bot{background:rgba(240,240,246,0.95); color:var(--text);}
  .m-msg.user{background:linear-gradient(180deg,var(--accent),#00b6ff); color:#fff; margin-left:auto;}
  #motoai-input{display:flex; gap:8px; padding:10px; border-top:1px solid rgba(0,0,0,0.06); background:linear-gradient(180deg,rgba(255,255,255,0.6),rgba(255,255,255,0.8));}
  #motoai-input input{flex:1; padding:12px; border-radius:12px; border:1px solid #d6dde6; font-size:16px; background:transparent; color:inherit;}
  #motoai-input button{padding:10px 14px; border-radius:10px; border:none; background:var(--accent); color:#fff; font-weight:700; cursor:pointer;}
  @media(prefers-color-scheme:dark){
    .m-msg.bot{background:rgba(40,40,50,0.9); color:#f2f2f2;}
    #motoai-input{background:rgba(25,25,30,0.9);}
    #motoai-input input{background:rgba(255,255,255,0.08); color:#fff; border:1px solid rgba(255,255,255,0.12);}
    #motoai-input input::placeholder{color:rgba(255,255,255,0.55);}
    #motoai-input input:focus{background:rgba(255,255,255,0.12); border-color:#0a84ff; outline:none;}
  }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ====== Behavior ======
  const $ = s => document.querySelector(s);
  const root = $('#motoai-root');
  const bubble = $('#motoai-bubble');
  const card = $('#motoai-card');
  const backdrop = $('#motoai-backdrop');
  const bodyEl = $('#motoai-body');
  const inputEl = $('#motoai-input-el');
  const sendBtn = $('#motoai-send');
  const state = { msgs:[{role:'bot', text:'Chào bạn 👋! Mình là MotoAI — hỏi thử điều gì đó nhé.'}] };

  function renderMsgs(){
    bodyEl.innerHTML = '';
    state.msgs.forEach(m=>{
      const d=document.createElement('div');
      d.className='m-msg '+(m.role==='user'?'user':'bot');
      d.textContent=m.text;
      bodyEl.appendChild(d);
    });
    bodyEl.scrollTop=bodyEl.scrollHeight;
  }

  function buildCorpus(){
    const txt=document.body.innerText||'';
    const withSep=txt.replace(/([.?!])(\s)*(?=[A-ZÀ-Ỵ0-9"'])/g,'$1|');
    return withSep.split('|').map(s=>s.trim()).filter(s=>s.length>20);
  }
  const CORPUS=buildCorpus();

  function dummyRetrieve(q){
    for(const s of CORPUS){
      if(q.split(' ').some(w=>s.toLowerCase().includes(w.toLowerCase()))) return s;
    }
    return 'Xin lỗi, mình chưa tìm thấy thông tin đó 🤔.';
  }

  async function ask(q){
    if(!q.trim()) return;
    state.msgs.push({role:'user', text:q});
    renderMsgs();
    inputEl.value='';
    sendBtn.disabled=true;
    await new Promise(r=>setTimeout(r,250));
    const ans=dummyRetrieve(q);
    state.msgs.push({role:'bot', text:ans});
    renderMsgs();
    sendBtn.disabled=false;
    inputEl.focus();
  }

  function openCard(){
    card.classList.add('open');
    backdrop.classList.add('show');
    root.style.pointerEvents='auto';
    bubble.style.display='none';
    card.setAttribute('aria-hidden','false');
    renderMsgs();
    setTimeout(()=>inputEl.focus(),250);
  }

  function closeCard(){
    card.classList.remove('open');
    backdrop.classList.remove('show');
    root.style.pointerEvents='none';
    bubble.style.display='flex';
    card.setAttribute('aria-hidden','true');
    bubble.focus();
  }

  bubble.addEventListener('click',openCard);
  backdrop.addEventListener('click',closeCard);
  sendBtn.addEventListener('click',()=>ask(inputEl.value));
  inputEl.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(inputEl.value);}
    if(e.key==='Escape')closeCard();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&card.classList.contains('open'))closeCard();
  });
  renderMsgs();
})();
