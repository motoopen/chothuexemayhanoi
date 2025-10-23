// MotoAI v3 — Smart Local Learn (Apple Style Edition) 😎
window.addEventListener('DOMContentLoaded', () => {

  // ====== Inject HTML ======
  const html = `
  <div id="motoai-root">
    <div id="motoai-bubble" role="button" aria-label="Mở chat">👩‍💻</div>
    <div id="motoai-backdrop"></div>
    <div id="motoai-card" role="dialog" aria-modal="true">
      <div id="motoai-handle"></div>
      <div id="motoai-header">Motoopen AI v3</div>
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
  :root {
    --accent:#007aff;
    --glass-bg:rgba(255,255,255,0.75);
    --glass-dark:rgba(25,25,30,0.6);
    --text:#111;
  }
  @media (prefers-color-scheme:dark) {
    :root { --glass-bg:var(--glass-dark); --text:#eee; }
  }

  #motoai-root {
    position:fixed; left:18px; bottom:90px;
    z-index:2147483000; pointer-events:none;
    font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;
  }
  #motoai-bubble {
    pointer-events:auto;
    width:58px; height:58px;
    border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:27px; background:linear-gradient(145deg,#007aff,#4fc3ff);
    box-shadow:0 10px 28px rgba(0,0,0,0.25);
    color:#fff; cursor:pointer; transition:transform .2s;
  }
  #motoai-bubble:hover { transform:scale(1.08); }
  #motoai-backdrop {
    position:fixed; inset:0; background:rgba(0,0,0,0.25);
    backdrop-filter:blur(10px);
    opacity:0; pointer-events:none; transition:opacity .25s ease;
  }
  #motoai-backdrop.show { opacity:1; pointer-events:auto; }

  #motoai-card {
    position:fixed; left:0; right:0; bottom:0;
    margin:auto; height:68vh; max-height:680px;
    width:min(880px,calc(100% - 28px));
    background:var(--glass-bg);
    backdrop-filter:blur(18px) saturate(180%);
    border-radius:24px 24px 0 0;
    box-shadow:0 -10px 40px rgba(0,0,0,0.25);
    transform:translateY(110%);
    opacity:0; transition:transform .4s cubic-bezier(.2,.9,.2,1),opacity .3s;
    display:flex; flex-direction:column; overflow:hidden;
  }
  #motoai-card.open { transform:translateY(0); opacity:1; }

  #motoai-handle {
    width:56px; height:6px; border-radius:4px;
    background:rgba(180,180,190,0.9); margin:10px auto;
  }
  #motoai-header {
    text-align:center; font-weight:600;
    color:var(--accent); padding:4px 0 8px;
  }
  #motoai-body {
    flex:1; overflow-y:auto; padding:10px 14px; font-size:15px;
  }
  .m-msg {
    margin:6px 0; padding:10px 14px; border-radius:16px;
    max-width:80%; line-height:1.4; word-break:break-word;
  }
  .m-msg.user {
    margin-left:auto;
    background:linear-gradient(145deg,var(--accent),#4fc3ff);
    color:#fff;
  }
  .m-msg.bot {
    background:rgba(255,255,255,0.6);
    color:var(--text); backdrop-filter:blur(10px);
  }
  @media (prefers-color-scheme:dark) {
    .m-msg.bot { background:rgba(40,40,45,0.6); color:#f1f1f1; }
  }

  #motoai-input {
    display:flex; gap:8px; padding:10px;
    background:rgba(255,255,255,0.4);
    border-top:1px solid rgba(0,0,0,0.05);
  }
  #motoai-input input {
    flex:1; border-radius:20px; border:none;
    padding:12px 14px; font-size:16px;
    background:rgba(255,255,255,0.8); color:#000;
    outline:none;
  }
  #motoai-input button {
    background:var(--accent); color:#fff; border:none;
    border-radius:16px; padding:10px 16px;
    font-weight:600; cursor:pointer;
  }
  @media (prefers-color-scheme:dark) {
    #motoai-input { background:rgba(25,25,30,0.6); }
    #motoai-input input { background:rgba(255,255,255,0.15); color:#fff; }
  }
  `;
  const style=document.createElement('style');
  style.textContent=css;
  document.head.appendChild(style);

  // ====== Local "Smart Learn" Logic ======
  const $=s=>document.querySelector(s);
  const bubble=$('#motoai-bubble'),
        card=$('#motoai-card'),
        backdrop=$('#motoai-backdrop'),
        bodyEl=$('#motoai-body'),
        inputEl=$('#motoai-input-el'),
        sendBtn=$('#motoai-send');
  const state={msgs:[{role:'bot',text:'Chào bạn 👋! Mình là MotoAI v3 — hiểu nội dung trang và có thể trả lời câu hỏi nhé.'}]};

  function renderMsgs(){
    bodyEl.innerHTML='';
    state.msgs.forEach(m=>{
      const d=document.createElement('div');
      d.className='m-msg '+(m.role==='user'?'user':'bot');
      d.textContent=m.text;
      bodyEl.appendChild(d);
    });
    bodyEl.scrollTop=bodyEl.scrollHeight;
  }

  // === Smart Local Embedding ===
  function buildCorpus(){
    const content=document.querySelector('main, article, body')?.innerText||'';
    return content.split(/[.?!]/).map(s=>s.trim()).filter(s=>s.length>20);
  }
  const CORPUS=buildCorpus();

  function embed(text){
    const m=new Map(), s=text.toLowerCase();
    for(let i=0;i<s.length-3;i++){
      const g=s.slice(i,i+3);
      m.set(g,(m.get(g)||0)+1);
    }
    return m;
  }
  function sim(a,b){
    const ks=new Set([...a.keys(),...b.keys()]);
    let dot=0,na=0,nb=0;
    ks.forEach(k=>{
      const va=a.get(k)||0, vb=b.get(k)||0;
      dot+=va*vb; na+=va*va; nb+=vb*vb;
    });
    return dot/(Math.sqrt(na)*Math.sqrt(nb)+1e-12);
  }
  function retrieve(q){
    const qv=embed(q);
    const best=CORPUS.map(s=>({text:s,score:sim(qv,embed(s))}))
                     .sort((a,b)=>b.score-a.score)[0];
    return best?.score>0.05 ? best.text : "Xin lỗi, mình chưa tìm thấy thông tin đó 🤔.";
  }

  async function ask(q){
    if(!q.trim())return;
    state.msgs.push({role:'user',text:q});
    renderMsgs();
    inputEl.value='';
    sendBtn.disabled=true;
    await new Promise(r=>setTimeout(r,250));
    const ans=retrieve(q);
    state.msgs.push({role:'bot',text:ans});
    renderMsgs();
    sendBtn.disabled=false;
    inputEl.focus();
  }

  function openCard(){
    card.classList.add('open');
    backdrop.classList.add('show');
    bubble.style.display='none';
    renderMsgs();
    setTimeout(()=>inputEl.focus(),250);
  }
  function closeCard(){
    card.classList.remove('open');
    backdrop.classList.remove('show');
    bubble.style.display='flex';
  }

  bubble.addEventListener('click',openCard);
  backdrop.addEventListener('click',closeCard);
  sendBtn.addEventListener('click',()=>ask(inputEl.value));
  inputEl.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(inputEl.value);}
  });
  window.addEventListener('pageshow',closeCard);
  renderMsgs();
});
