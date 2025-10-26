/*
 * MotoAI v18x — LiteUI Stable (Messenger style)
 * - Bubble góc trái dưới, icon Messenger (SVG), gradient xanh
 * - Fade-in/out nhẹ (không slide), không rung khi mở bàn phím
 * - Responsive: mobile / tablet / laptop
 * - AutoLearn: DOM + *_sitemap.json + link nội bộ (giới hạn)
 * - Tông giọng "mình / bạn", lịch sự, không dùng "ạ/dạ/vâng"
 * - Tự chơi đẹp với cache/defer (nếu có)
 */
(function(){
  if (window.MotoAI_v18x_LOADED) return;
  window.MotoAI_v18x_LOADED = true;

  const HOSTKEY = (location.host||'site').replace(/[^a-z0-9.-]/gi,'_');
  const CFG = {
    sitemapCandidates: ['/moto_sitemap.json','/ai_sitemap.json','/sitemap.json'],
    minSentenceLen: 24,
    maxItems: 1200,
    maxInternalPages: 18,
    refreshHours: 24,
    corpusKey: `MotoAI_v18x_${HOSTKEY}_corpus`,
    extCorpusKey: `MotoAI_v18x_${HOSTKEY}_corpus_ext`,
    lastLearnKey: `MotoAI_v18x_${HOSTKEY}_lastLearn`,
    lastSitemapHashKey: `MotoAI_v18x_${HOSTKEY}_lastSitemapHash`,
    sessionKey: `MotoAI_v18x_${HOSTKEY}_session`
  };

  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const uniq=a=>Array.from(new Set(a));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const safeParse=s=>{try{return JSON.parse(s)}catch(_){return null}};
  const tokenize=t=>(t||'').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean);
  function hashText(str){try{return btoa(unescape(encodeURIComponent(str))).slice(0,60)}catch(e){let h=0;for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))|0;return String(h)}}
  const pick=a=>a[Math.floor(Math.random()*a.length)];

  /* UI: Lite, Messenger style */
  const uiHtml = `
  <div id="motoai-root" aria-live="polite">
    <button id="motoai-bubble" aria-label="Mở chat" title="Chat">
      <svg viewBox="0 0 36 36" width="28" height="28" aria-hidden="true">
        <defs>
          <linearGradient id="motoai-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00c6ff"/>
            <stop offset="100%" stop-color="#007aff"/>
          </linearGradient>
        </defs>
        <path fill="url(#motoai-g)" d="M18 3C9.72 3 3 9.02 3 16.45c0 4.26 2.23 7.98 5.66 10.33l-.39 5.92 5.39-3.02c1.38.38 2.86.59 4.35.59 8.28 0 15-6.02 15-13.45S26.28 3 18 3z"/>
        <path fill="#fff" d="M25.4 14.1l-4.67 2.93-3.14-2.93-6.99 6.78 9.02-5.65 3.11 2.9 5.66-3.49z"/>
      </svg>
    </button>
    <div id="motoai-card" role="dialog" aria-modal="false" aria-hidden="true">
      <div id="motoai-header">
        <div id="motoai-brand">
          <svg viewBox="0 0 36 36" width="18" height="18" aria-hidden="true">
            <linearGradient id="motoai-g2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00c6ff"/><stop offset="100%" stop-color="#007aff"/>
            </linearGradient>
            <path fill="url(#motoai-g2)" d="M18 3C9.72 3 3 9.02 3 16.45c0 4.26 2.23 7.98 5.66 10.33l-.39 5.92 5.39-3.02c1.38.38 2.86.59 4.35.59 8.28 0 15-6.02 15-13.45S26.28 3 18 3z"/>
            <path fill="#fff" d="M25.4 14.1l-4.67 2.93-3.14-2.93-6.99 6.78 9.02-5.65 3.11 2.9 5.66-3.49z"/>
          </svg>
          <span>AI Assistant — <span class="phone">☎️ 0857 255 868</span></span>
        </div>
        <button id="motoai-close" title="Đóng" aria-label="Đóng">✕</button>
      </div>
      <div id="motoai-body"></div>
      <div id="motoai-suggestions" role="toolbar" aria-label="Gợi ý nhanh"></div>
      <div id="motoai-input">
        <input id="motoai-input-el" placeholder="Nhập câu hỏi..." autocomplete="off" />
        <button id="motoai-send" aria-label="Gửi">Gửi</button>
      </div>
      <button id="motoai-clear" title="Xóa hội thoại" aria-label="Xóa">🗑</button>
    </div>
  </div>`;

  const uiCss = `
  :root{--m-blue-1:#00c6ff;--m-blue-2:#007aff;--m-bg:#ffffff;--m-text:#0b1220;--m-bg-dark:#1c1c20;--m-text-dark:#eee}
  #motoai-root{position:fixed;left:16px;bottom:16px;z-index:99997;font-family:-apple-system,system-ui,Segoe UI,Roboto,Arial}
  #motoai-bubble{position:fixed;left:16px;bottom:16px;width:56px;height:56px;border:none;border-radius:16px;background:#fff;box-shadow:0 8px 22px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity .18s,transform .18s}
  #motoai-bubble:hover{transform:translateY(-1px)}
  #motoai-card{position:fixed;left:16px;bottom:84px;width:min(420px,calc(100% - 32px));height:60vh;max-height:640px;border-radius:18px;background:rgba(255,255,255,.92);backdrop-filter:blur(16px) saturate(160%);box-shadow:0 12px 40px rgba(0,0,0,.22);display:flex;flex-direction:column;opacity:0;pointer-events:none;transition:opacity .18s ease}
  #motoai-card.open{opacity:1;pointer-events:auto}
  #motoai-header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(0,0,0,.06)}
  #motoai-brand{display:flex;gap:8px;align-items:center;font-weight:700;color:#0a84ff}
  #motoai-header button{background:none;border:none;font-size:20px;cursor:pointer;opacity:.85}
  #motoai-body{flex:1;overflow:auto;padding:10px 12px;font-size:15px;color:var(--m-text)}
  .m-msg{margin:8px 0;padding:10px 12px;border-radius:14px;max-width:86%;line-height:1.45;word-break:break-word;box-shadow:0 2px 6px rgba(0,0,0,.06)}
  .m-msg.user{margin-left:auto;color:#fff;background:linear-gradient(140deg,var(--m-blue-1),var(--m-blue-2))}
  .m-msg.bot{background:rgba(255,255,255,.92);color:var(--m-text)}
  #motoai-suggestions{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;padding:6px 10px;border-top:1px solid rgba(0,0,0,.05);background:rgba(255,255,255,.7)}
  #motoai-suggestions button{border:none;background:rgba(0,122,255,.08);color:#0a84ff;padding:8px 10px;border-radius:12px;cursor:pointer;font-weight:500}
  #motoai-input{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,.82)}
  #motoai-input input{flex:1;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,.1);font-size:15px;background:#fff}
  #motoai-input button{background:linear-gradient(140deg,var(--m-blue-1),var(--m-blue-2));color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:600;cursor:pointer}
  #motoai-clear{position:absolute;top:10px;right:42px;background:none;border:none;font-size:18px;cursor:pointer;opacity:.85}
  /* Tablet/Laptop */
  @media (min-width:600px){ #motoai-card{height:68vh;bottom:92px} }
  @media (min-width:992px){ #motoai-card{height:70vh} }
  /* Dark mode */
  @media (prefers-color-scheme:dark){
    #motoai-card{background:rgba(20,20,22,.94);color:var(--m-text-dark)}
    #motoai-body{color:var(--m-text-dark)}
    .m-msg.bot{background:rgba(30,30,32,.9);color:var(--m-text-dark)}
    #motoai-input{background:rgba(25,25,30,.9)}
    #motoai-input input{background:rgba(40,40,50,.86);color:var(--m-text-dark);border:1px solid rgba(255,255,255,.1)}
    #motoai-suggestions{background:rgba(25,25,30,.85)}
    #motoai-clear{color:#eee}
  }`;

  function injectUI(){
    if($('#motoai-root')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = uiHtml;
    document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement('style');
    st.textContent = uiCss;
    document.head.appendChild(st);
  }
  injectUI();

  // Refs
  const bubble = $('#motoai-bubble'), card = $('#motoai-card'), bodyEl=$('#motoai-body');
  const inputEl=$('#motoai-input-el'), sendBtn=$('#motoai-send'), clearBtn=$('#motoai-clear'), closeBtn=$('#motoai-close');
  const suggestionsWrap=$('#motoai-suggestions');

  // State
  let isOpen=false, sendLock=false, corpus=[], extCorpus=[];
  function loadCorpus(){ try{corpus=safeParse(localStorage.getItem(CFG.corpusKey))||[]}catch(_){}
                        try{extCorpus=safeParse(localStorage.getItem(CFG.extCorpusKey))||[]}catch(_){}} 
  function saveCorpus(){ try{localStorage.setItem(CFG.corpusKey,JSON.stringify(corpus))}catch(_){}
                        try{localStorage.setItem(CFG.extCorpusKey,JSON.stringify(extCorpus))}catch(_){}}
  loadCorpus();

  function addMessage(role,text){
    if(!text) return;
    const el=document.createElement('div'); el.className='m-msg '+(role==='user'?'user':'bot'); el.textContent=text;
    bodyEl.appendChild(el); bodyEl.scrollTop = bodyEl.scrollHeight;
    try{
      const raw = localStorage.getItem(CFG.sessionKey)||'[]';
      const arr = safeParse(raw)||[]; arr.push({role,text,t:Date.now()});
      localStorage.setItem(CFG.sessionKey, JSON.stringify(arr.slice(-180)));
    }catch(_){}
  }
  function renderSession(){
    bodyEl.innerHTML='';
    const arr = safeParse(localStorage.getItem(CFG.sessionKey)||'[]')||[];
    if(arr.length){ arr.forEach(m=>{ const d=document.createElement('div'); d.className='m-msg '+(m.role==='user'?'user':'bot'); d.textContent=m.text; bodyEl.appendChild(d); }); bodyEl.scrollTop=bodyEl.scrollHeight; }
    else { addMessage('bot','Chào bạn, mình là AI Assistant. Bạn muốn xem 💰 Bảng giá, ⚙️ Dịch vụ, 🏍️ Sản phẩm hay ☎️ Liên hệ?'); }
  }
  function showTyping(){ const d=document.createElement('div'); d.id='motoai-typing'; d.className='m-msg bot'; d.textContent='...'; bodyEl.appendChild(d); bodyEl.scrollTop=bodyEl.scrollHeight; }
  function hideTyping(){ const d=$('#motoai-typing'); if(d) d.remove(); }

  // Build corpus from DOM
  function buildCorpusFromDOM(){
    try{
      let nodes = $$('#main, main, article, section'); if(!nodes.length) nodes=[document.body];
      let texts=[];
      nodes.forEach(n=>{
        n.querySelectorAll('h1,h2,h3').forEach(h=>{ const t=h.innerText?.trim(); if(t&&t.length>12) texts.push(t);});
        n.querySelectorAll('p,li').forEach(p=>{ const t=p.innerText?.trim(); if(t&&t.length>=CFG.minSentenceLen) texts.push(t);});
      });
      if(!texts.length){ const meta=document.querySelector('meta[name="description"]'); if(meta?.content) texts.push(meta.content); }
      texts = uniq(texts).slice(0, CFG.maxItems);
      corpus = texts.map((t,i)=>({id:i,text:t,tokens:tokenize(t)}));
      saveCorpus();
    }catch(e){ console.warn('Build corpus DOM error', e); }
  }
  if(!corpus.length) buildCorpusFromDOM();

  // Learn from sitemaps/internal
  async function discoverSitemaps(){
    const urls = uniq(CFG.sitemapCandidates.map(u=> (u.startsWith('http')?u:(location.origin+u))));
    const found=[];
    for(const u of urls){
      try{ const r=await fetch(u,{cache:'no-store'}); if(!r.ok) continue;
           const ct=(r.headers.get('content-type')||'').toLowerCase();
           if(ct.includes('json')||u.endsWith('.json')) found.push(u);
           else { const txt=await r.text(); try{JSON.parse(txt);found.push(u)}catch(_){}} }catch(_){}
    }
    return found;
  }
  async function fetchTextOrHtml(url){
    try{
      const res=await fetch(url,{cache:'no-store'}); if(!res.ok) return '';
      const ct=(res.headers.get('content-type')||'').toLowerCase();
      if(ct.includes('text/plain')) return await res.text();
      const html = await res.text();
      const tmp=document.createElement('div'); tmp.innerHTML=html;
      const nodes=tmp.querySelectorAll('p,h1,h2,h3,li');
      const lines=Array.from(nodes).map(n=>(n.textContent||'').trim()).filter(t=>t.length>=CFG.minSentenceLen);
      return lines.join('\n');
    }catch(_){ return ''; }
  }
  async function learnFromSitemaps(maps){
    let pages=[];
    for(const s of maps){
      try{ const r=await fetch(s,{cache:'no-store'}); if(!r.ok) continue;
           const j=await r.json(); if(j?.pages) pages=pages.concat(j.pages); }catch(_){}
    }
    pages = uniq(pages).slice(0, CFG.maxItems*2);
    let added=0;
    for(const p of pages){
      const txt = await fetchTextOrHtml(p); if(!txt) continue;
      const lines = txt.split(/\n+/).map(x=>x.trim()).filter(x=>x.length>=CFG.minSentenceLen);
      for(const l of lines){ if(!extCorpus.includes(l)){ extCorpus.push(l); added++; } if(extCorpus.length>=CFG.maxItems) break; }
      if(extCorpus.length>=CFG.maxItems) break;
      await sleep(60);
    }
    if(added>0){ saveCorpus(); console.log(`MotoAI v18x: learned +${added} lines (ext=${extCorpus.length})`); }
  }
  function collectInternalLinks(){
    const list = $$('a[href]').map(el=>el.getAttribute('href')).filter(Boolean)
      .map(h=>{try{return new URL(h,location.href).href}catch(_){return null}})
      .filter(Boolean)
      .filter(u=>u.startsWith(location.origin))
      .filter(u=>!/\.(png|jpe?g|gif|webp|svg|pdf|zip|rar|7z|mp4|mp3|ico)(\?|$)/i.test(u))
      .filter(u=>!u.includes('#'))
      .filter(u=>u!==location.href);
    return uniq(list).slice(0, CFG.maxInternalPages);
  }
  async function learnFromInternal(){
    const pages=collectInternalLinks(); if(!pages.length) return;
    let added=0;
    for(const url of pages){
      const txt=await fetchTextOrHtml(url); if(!txt) continue;
      const lines = txt.split(/\n+/).map(x=>x.trim()).filter(x=>x.length>=CFG.minSentenceLen);
      for(const l of lines){ if(!extCorpus.includes(l)){ extCorpus.push(l); added++; } if(extCorpus.length>=CFG.maxItems) break; }
      if(extCorpus.length>=CFG.maxItems) break;
      await sleep(150);
    }
    if(added>0){ saveCorpus(); console.log(`MotoAI v18x: internal +${added}`); }
  }
  async function checkSitemapChangeAndLearn(){
    try{
      const maps=await discoverSitemaps();
      if(!maps.length){ await learnFromInternal(); return; }
      let combined=''; for(const s of maps){ try{ const r=await fetch(s,{cache:'no-store'}); if(!r.ok) continue; combined += await r.text(); }catch(_){} }
      const hash=hashText(combined); const old=localStorage.getItem(CFG.lastSitemapHashKey)||'';
      if(hash!==old){ localStorage.setItem(CFG.lastSitemapHashKey, hash); await learnFromSitemaps(maps); }
      else { await learnFromInternal(); }
    }catch(e){ console.warn('learn error', e); }
  }
  async function scheduleAutoLearn(force=false){
    const now=Date.now(); const last=parseInt(localStorage.getItem(CFG.lastLearnKey)||'0',10)||0;
    if(!force && last && (now-last) < CFG.refreshHours*3600*1000){ return; }
    await checkSitemapChangeAndLearn();
    localStorage.setItem(CFG.lastLearnKey, String(Date.now()));
  }
  scheduleAutoLearn(false);
  setInterval(()=>scheduleAutoLearn(false), 6*60*60*1000);

  // Tone
  const PREFIX=["Chào bạn,","Mình ở đây để hỗ trợ,","Mình sẵn sàng giúp,"];
  const SUFFIX=[" bạn nhé."," cảm ơn bạn."," nếu cần thêm thông tin cứ nói nhé."];
  function makePolite(text){ const t=(text||'').trim(); if(!t) return "Mình chưa nhận được câu hỏi, bạn thử nhập lại nhé."; const p=pick(PREFIX), s=pick(SUFFIX); return /[.!?…]$/.test(t)?`${p} ${t} ${s}`:`${p} ${t}${s}`; }

  // Rules + Retrieval
  const RULES = [
    {pattern:/(chào|xin chào|hello|hi|alo)/i, answers:[
      "mình là AI Assistant. Bạn muốn xem 💰 Bảng giá, ⚙️ Dịch vụ, 🏍️ Sản phẩm hay ☎️ Liên hệ?",
      "mình có thể giúp tra giá, giới thiệu dịch vụ và sản phẩm. Bạn đang quan tâm điều gì?"
    ]},
    {pattern:/(bảng giá|gia|giá|bao nhiêu|bang gia)/i, answers:[
      "đây là mục Bảng giá. Bạn cho mình biết dòng sản phẩm/dịch vụ cụ thể để mình báo chi tiết.",
      "bạn cần mức giá theo ngày/tuần/tháng hay theo gói dịch vụ?"
    ]},
    {pattern:/(dịch vụ|dich vu|service)/i, answers:[
      "bên mình có nhiều gói dịch vụ. Bạn mô tả nhu cầu để mình gợi ý gói phù hợp.",
      "bạn muốn hỗ trợ giao nhận, bảo dưỡng, hay tư vấn lựa chọn sản phẩm?"
    ]},
    {pattern:/(sản phẩm|san pham|xe ga|xe số|xe so|50cc|vision|lead|air blade|vespa|winner|exciter)/i, answers:[
      "bạn cho mình biết nhu cầu sử dụng (đi phố, đi xa, tiết kiệm xăng…) để mình tư vấn phù hợp.",
      "mình có thể tóm tắt ưu/nhược điểm từng mẫu để bạn so sánh nhanh."
    ]},
    {pattern:/(liên hệ|lien he|zalo|hotline|sđt|sdt|gọi|dien thoai)/i, answers:[
      "bạn liên hệ nhanh qua ☎️ 0857 255 868 (Zalo/Hotline) để được tư vấn trực tiếp.",
      "nếu cần gấp, bạn gọi 0857 255 868 — mình phản hồi ngay."
    ]}
  ];
  function ruleAnswer(q){ for(const r of RULES){ if(r.pattern.test(q)) return makePolite(pick(r.answers)); } return null; }
  function retrieveBest(q){
    const qt=tokenize(q).filter(t=>t.length>1); if(!qt.length) return null;
    let best={score:0,text:null}; const pool=(corpus||[]).concat(extCorpus||[]);
    for(const item of pool){ const line=typeof item==='string'?item:item.text; const low=(line||'').toLowerCase();
      let s=0; for(const t of qt){ if(low.includes(t)) s+=1; } if(s>best.score) best={score:s,text:line}; }
    return best.score>0? makePolite(best.text): null;
  }
  function composeAnswer(q){
    const msg=(q||'').trim(); if(!msg) return makePolite("bạn thử bấm gợi ý: 💰 Bảng giá, ⚙️ Dịch vụ, 🏍️ Sản phẩm hoặc ☎️ Liên hệ");
    const r1=ruleAnswer(msg); if(r1) return r1;
    const r2=retrieveBest(msg); if(r2) return r2;
    return makePolite("mình chưa tìm được thông tin trùng khớp. Bạn mô tả cụ thể hơn giúp mình nhé");
  }

  // Suggestions
  const suggestions=[
    {q:'Bảng giá', label:'💰 Bảng giá'},
    {q:'Dịch vụ', label:'⚙️ Dịch vụ'},
    {q:'Sản phẩm', label:'🏍️ Sản phẩm'},
    {q:'Liên hệ', label:'☎️ Liên hệ'}
  ];
  function buildSuggestions(){
    const wrap=suggestionsWrap; wrap.innerHTML='';
    suggestions.forEach(s=>{ const b=document.createElement('button'); b.type='button'; b.textContent=s.label;
      b.addEventListener('click',()=>{ if(!isOpen) openChat(); setTimeout(()=>userSend(s.q),80); }); wrap.appendChild(b); });
  }
  buildSuggestions();

  // UI behaviors
  function openChat(){ if(isOpen) return; card.classList.add('open'); isOpen=true; renderSession(); setTimeout(()=>{try{inputEl.focus()}catch(_){}} ,160); }
  function closeChat(){ if(!isOpen) return; card.classList.remove('open'); isOpen=false; hideTyping(); }
  function clearChat(){ try{localStorage.removeItem(CFG.sessionKey)}catch(_){} bodyEl.innerHTML=''; addMessage('bot', makePolite('đã xóa hội thoại')); }

  async function userSend(text){
    if(sendLock) return; sendLock=true;
    addMessage('user', text); showTyping();
    await sleep(180 + Math.min(420, text.length*6));
    let ans=null; try{ ans=composeAnswer(text);}catch(_){}
    hideTyping(); addMessage('bot', ans || makePolite('xin lỗi, có lỗi khi trả lời. Bạn thử lại giúp mình'));
    sendLock=false;
  }

  // Events
  bubble.addEventListener('click', ()=>{ if(!corpus.length) buildCorpusFromDOM(); openChat(); });
  closeBtn.addEventListener('click', closeChat);
  clearBtn.addEventListener('click', clearChat);
  sendBtn.addEventListener('click', ()=>{ const v=(inputEl.value||'').trim(); if(!v) return; inputEl.value=''; userSend(v); });
  inputEl.addEventListener('keydown', e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); const v=(inputEl.value||'').trim(); if(!v) return; inputEl.value=''; userSend(v);} });

  // Watchdog
  setTimeout(()=>{ if(!$('#motoai-bubble')) injectUI(); }, 1800);

  // Expose
  window.MotoAI_v18x = {
    open: openChat, close: closeChat, learnNow: ()=>scheduleAutoLearn(true),
    getCorpus: ()=>({dom:(corpus||[]).slice(0,200), ext:(extCorpus||[]).slice(0,200)}),
    clearCorpus: ()=>{ corpus=[]; extCorpus=[]; saveCorpus(); },
    version: 'v18x-liteui-stable'
  };
})();
