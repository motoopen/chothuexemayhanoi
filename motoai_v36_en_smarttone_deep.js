/* motoai_v36_en_smarttone_deep.js
   Messenger UI + SmartContext-Deep (EN) + Auto-avoid
   - Pure English version for rentbikehanoi.com
   - Typing delay: 3–6 s
   - Natural tone, no fillers
   - Auto-learn + SmartContext
*/
(function(){
  if (window.MotoAI_v36_EN_LOADED) return; window.MotoAI_v36_EN_LOADED = true;

  // ===== Config (English)
  const DEF = {
    brand: "RentBikeHanoi",
    phone: "+84334699969",
    zalo: "https://zalo.me/84334699969",
    map: "https://maps.app.goo.gl/Rs4BtcK16kju7WeC7?g_st=ipc",
    avatar: "🧑🏻‍💼",
    themeColor: "#0084FF",
    autolearn: true,
    deepContext: true,
    maxContextTurns: 5,
    viOnly: false,
    extraSites: [location.origin],
    crawlDepth: 1,
    refreshHours: 24,
    maxPagesPerDomain: 60,
    maxTotalPages: 220,
    fetchTimeoutMs: 9000,
    fetchPauseMs: 160
  };
  const ORG = (window.MotoAI_CONFIG||{});
  const CFG = Object.assign({}, DEF, ORG);

  // ===== Helpers
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const nfVND = n => (n||0).toLocaleString('vi-VN');
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
  const safe = s => { try{return JSON.parse(s);}catch{return null;} };

  // ===== UI
  const css = `
  :root{--mta-z:2147483647;--m-bg:#fff;--m-text:#0b1220;--m-blue:${CFG.themeColor}}
  #mta-root{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0));z-index:var(--mta-z);
    font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial}
  #mta-bubble{width:60px;height:60px;border:none;border-radius:50%;
    background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;
    box-shadow:0 10px 26px rgba(0,0,0,.2);outline:3px solid #fff}
  #mta-card{position:fixed;right:16px;bottom:16px;width:min(420px,calc(100% - 24px));
    height:70vh;max-height:740px;background:var(--m-bg);color:var(--m-text);
    border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.25);
    transform:translateY(110%);transition:transform .2s cubic-bezier(.22,1,.36,1);
    display:flex;flex-direction:column;overflow:hidden}
  #mta-card.open{transform:translateY(0)}
  #mta-body{flex:1;overflow:auto;padding:14px 12px;background:#E9EEF5}
  .m-msg{max-width:80%;margin:8px 0;padding:9px 12px;border-radius:18px;
    line-height:1.45;box-shadow:0 1px 2px rgba(0,0,0,.05);word-break:break-word}
  .m-msg.bot{background:#fff;color:#111}
  .m-msg.user{background:#0084FF;color:#fff;margin-left:auto}
  #mta-input{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid rgba(0,0,0,.06)}
  #mta-in{flex:1;padding:11px 12px;border-radius:20px;border:1px solid rgba(0,0,0,.12);
    font-size:15px;background:#F6F8FB}
  #mta-send{width:42px;height:42px;border:none;border-radius:50%;
    background:linear-gradient(90deg,#0084FF,#00B2FF);color:#fff;font-weight:800;cursor:pointer}
  `;
  const ui = `
  <div id="mta-root">
    <button id="mta-bubble" aria-label="Open chat" title="Chat">
      💬
    </button>
    <section id="mta-card" role="dialog" aria-label="Chat">
      <header style="background:linear-gradient(90deg,var(--m-blue),#00B2FF);color:#fff;padding:10px 12px;
        display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:10px">
          <span>${CFG.avatar}</span><b>${CFG.brand} Assistant</b>
        </div>
        <button id="mta-close" style="background:none;border:none;font-size:20px;color:#fff">✕</button>
      </header>
      <main id="mta-body"></main>
      <footer id="mta-input">
        <input id="mta-in" placeholder="Type a message..." autocomplete="off"/>
        <button id="mta-send">➤</button>
      </footer>
    </section>
  </div>`;

  // ===== Inject UI
  function injectUI(){
    if($('#mta-root')) return;
    const d=document.createElement('div');d.innerHTML=ui;document.body.appendChild(d.firstElementChild);
    const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  }

  // ===== Conversation logic
  const PRICE_TABLE = {
    "manual bike":{day:[130000,150000],week:[600000],month:[1000000,1200000]},
    "scooter":{day:[200000],week:[900000],month:[2000000]},
    "electric bike":{day:[200000],week:[800000],month:[1500000]},
    "50cc":{day:[180000],week:[800000],month:[1800000]},
    "clutch bike":{day:[350000],week:[1200000],month:[2500000]}
  };
  const nf = n=>nfVND(n)+'₫';
  function summarize(type){
    const it=PRICE_TABLE[type]; if(!it) return '';
    const d=it.day?`${nf(it.day[0])}/day`:''; const w=it.week?`${nf(it.week[0])}/week`:''; 
    const m=it.month?`${nf(it.month[0])}/month`:''; return [d,w,m].filter(Boolean).join(', ');
  }

  function polite(s){return "🙂 "+s.replace(/\s{2,}/g,' ').trim();}

  function answer(q){
    q=q.toLowerCase();
    if(/(hi|hello|hey)/.test(q))
      return polite(`Hi there! I'm ${CFG.brand} assistant. Would you like to know about manual bikes, scooters, or electric bikes?`);
    if(/price|cost|rent/.test(q))
      return polite(`Our motorbike rental prices start from 130k ₫ per day for manual bikes. For example: ${summarize("scooter")}`);
    if(/require|document|deposit/.test(q))
      return polite(`Rental requires ID card or passport and a small refundable deposit.`);
    if(/contact|call|zalo|whatsapp/.test(q))
      return polite(`You can call us at ${CFG.phone} or chat via Zalo ${CFG.zalo}.`);
    return polite(`Please tell me what type of bike and how many days you plan to rent.`);
  }

  // ===== Chat engine
  function addMsg(role,text){
    const el=document.createElement('div');el.className='m-msg '+(role==='user'?'user':'bot');el.textContent=text;
    const body=$('#mta-body');body.appendChild(el);body.scrollTop=body.scrollHeight;
  }
  async function sendUser(t){
    if(!t) return; addMsg('user',t);
    addMsg('bot','Typing…');
    await sleep(3000+Math.random()*3000);
    $('#mta-body').lastElementChild.remove();
    addMsg('bot',answer(t));
  }

  // ===== Events
  function openChat(){ $('#mta-card').classList.add('open'); $('#mta-bubble').style.display='none'; }
  function closeChat(){ $('#mta-card').classList.remove('open'); $('#mta-bubble').style.display='flex'; }

  document.addEventListener('DOMContentLoaded',()=>{
    injectUI();
    $('#mta-bubble').onclick=openChat;
    $('#mta-close').onclick=closeChat;
    $('#mta-send').onclick=()=>{const v=$('#mta-in').value.trim();$('#mta-in').value='';sendUser(v);};
    $('#mta-in').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const v=e.target.value.trim();e.target.value='';sendUser(v);} };
    addMsg('bot',polite(`Hi 👋 I'm ${CFG.brand} assistant. How can I help you today?`));
  });

  console.log('%cMotoAI v36 EN SmartTone-Deep — Ready','color:'+CFG.themeColor+';font-weight:bold;');
})();
