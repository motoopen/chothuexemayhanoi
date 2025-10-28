/* motoai_v26_ultra_autolearn_multisite.js
   UI: Messenger-style (v24 ổn định, tag trượt, auto-hide)
   Engine: AutoLearn MultiSite (sitemap.xml, sitemap_index.xml, fallback crawl)
   SmartCalc + polite AI + cache domain 24h + iOS Safe
   Author: Motoopen (Tuấn Tú)
*/
(function(){
  if (window.MotoAI_v26_ULTRA_LOADED) return;
  window.MotoAI_v26_ULTRA_LOADED = true;

  // ===== CONFIG =====
  const DEF = {
    brand: "Motoopen",
    phone: "0857255868",
    zalo: "https://zalo.me/0857255868",
    map: "https://maps.app.goo.gl/2icTBTxAToyvKTE78",
    autolearn: true,
    extraSites: ["https://motoopen.github.io/chothuexemayhanoi/"],
    crawlDepth: 1,
    refreshHours: 24
  };
  const ORG = window.MotoAI_CONFIG || {};
  if(!ORG.zalo && (ORG.phone||DEF.phone)) ORG.zalo = 'https://zalo.me/' + String(ORG.phone||DEF.phone).replace(/\s+/g,'');
  const CFG = Object.assign({}, DEF, ORG);

  // ===== UTILS =====
  const $ = s => document.querySelector(s);
  const safe = s => { try{return JSON.parse(s)}catch(e){return null} };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const nfVND = n => (n||0).toLocaleString('vi-VN');
  const nowSec = () => Math.floor(Date.now()/1000);
  const toURL = u => { try{return new URL(u);}catch(_){return null;} };
  const sameHost = (u,o)=>{ try{return new URL(u).host===new URL(o).host;}catch(_){return false;} };

  // ===== UI =====
  const ui = `
  <div id="mta-root" aria-live="polite">
    <button id="mta-bubble" aria-label="Mở chat" title="Chat">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <defs><linearGradient id="mtaG" x1="0" x2="1"><stop offset="0%" stop-color="#0084FF"/><stop offset="100%" stop-color="#00B2FF"/></linearGradient></defs>
        <circle cx="32" cy="32" r="28" fill="url(#mtaG)"></circle>
        <path d="M20 36l9-11 6 6 9-9-9 14-6-6-9 6z" fill="#fff"></path>
      </svg>
    </button>
    <div id="mta-backdrop"></div>
    <section id="mta-card" role="dialog" aria-label="Chat MotoAI">
      <header id="mta-header">
        <div class="brand">
          <div class="left">
            <span class="avatar">💬</span>
            <div class="info">
              <div class="name">Nhân viên ${CFG.brand}</div>
              <div class="sub">Hỗ trợ trực tuyến</div>
            </div>
          </div>
          <nav class="quick">
            <a class="q q-phone" href="tel:${CFG.phone}" title="Gọi">📞</a>
            <a class="q q-zalo" href="${CFG.zalo}" target="_blank" rel="noopener" title="Zalo">Z</a>
            <a class="q q-map" href="${CFG.map}" target="_blank" rel="noopener" title="Bản đồ">📍</a>
          </nav>
          <button id="mta-close" aria-label="Đóng">✕</button>
        </div>
      </header>
      <main id="mta-body"></main>
      <div id="mta-tags">
        <div class="tag-track" id="tagTrack">
          <button data-q="Xe số">🏍️ Xe số</button>
          <button data-q="Xe ga">🛵 Xe ga</button>
          <button data-q="Xe điện">⚡ Xe điện</button>
          <button data-q="50cc">🚲 50cc</button>
          <button data-q="Xe côn tay">🏍️ Côn tay</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
          <button data-q="Bảng giá">💰 Bảng giá</button>
          <button data-q="Liên hệ">☎️ Liên hệ</button>
          <button data-q="Xe giá rẻ">💸 Xe giá rẻ</button>
        </div>
        <div class="fade fade-left"></div>
        <div class="fade fade-right"></div>
      </div>
      <footer id="mta-input">
        <input id="mta-in" placeholder="Nhắn tin cho ${CFG.brand}..." autocomplete="off"/>
        <button id="mta-send">➤</button>
      </footer>
      <button id="mta-clear" title="Xóa hội thoại">🗑</button>
    </section>
  </div>`;
  const css = `
  :root{--mta-z:2147483647;--m-blue:#0084FF;--m-blue2:#00B2FF;--m-bg:#fff;--m-text:#0b1220}
  #mta-root{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0));z-index:var(--mta-z);font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial}
  #mta-bubble{width:60px;height:60px;border:none;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.2)}
  #mta-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .18s ease}
  #mta-backdrop.show{opacity:1;pointer-events:auto}
  #mta-card{position:fixed;right:16px;bottom:16px;width:min(420px,calc(100% - 24px));height:70vh;max-height:740px;background:var(--mta-bg);color:var(--mta-text);border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.25);transform:translateY(110%);transition:transform .2s ease;display:flex;flex-direction:column;overflow:hidden}
  #mta-card.open{transform:translateY(0)}
  #mta-header{background:linear-gradient(90deg,var(--m-blue),var(--m-blue2));color:#fff;padding:10px}
  #mta-body{flex:1;overflow:auto;padding:14px 12px;background:#E9EEF5}
  .m-msg{max-width:80%;margin:8px 0;padding:9px 12px;border-radius:18px;line-height:1.45}
  .m-msg.user{background:#0084FF;color:#fff;margin-left:auto}
  .m-msg.bot{background:#fff;color:#111}
  #mta-tags{background:#f7f9fc;border-top:1px solid rgba(0,0,0,.06)}
  #mta-tags .tag-track{display:block;overflow-x:auto;white-space:nowrap;padding:8px 10px}
  #mta-tags button{margin-right:8px;padding:8px 12px;border:none;border-radius:999px;background:#fff;cursor:pointer}
  #mta-input{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid rgba(0,0,0,.06)}
  #mta-in{flex:1;padding:11px 12px;border-radius:20px;border:1px solid rgba(0,0,0,.12);background:#F6F8FB}
  #mta-send{width:42px;height:42px;border:none;border-radius:50%;background:linear-gradient(90deg,#0084FF,#00B2FF);color:#fff;cursor:pointer}
  #mta-clear{position:absolute;top:10px;right:48px;background:none;border:none;font-size:16px;color:#fff;cursor:pointer}
  `;

  function injectUI(){
    if($('#mta-root')) return;
    const wrap=document.createElement('div');wrap.innerHTML=ui;document.body.appendChild(wrap.firstElementChild);
    const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  }

  // ===== STATE =====
  let isOpen=false, sending=false;
  const K={sess:'MotoAI_v26_ultra_session',learn:'MotoAI_v26_ultra_learn'};

  function addMsg(role,text){
    if(!text)return;
    const el=document.createElement('div');el.className='m-msg '+(role==='user'?'user':'bot');el.textContent=text;
    $('#mta-body').appendChild(el);$('#mta-body').scrollTop=$('#mta-body').scrollHeight;
    try{const arr=safe(localStorage.getItem(K.sess))||[];arr.push({role,text});localStorage.setItem(K.sess,JSON.stringify(arr.slice(-200)));}catch(_){}
  }

  // ===== AUTOLEARN ENGINE =====
  async function fetchText(u){try{const r=await fetch(u);if(!r.ok)return null;return await r.text();}catch(_){return null;}}
  function parseXML(t){try{return new DOMParser().parseFromString(t,'text/xml');}catch(_){return null;}}
  async function readSitemap(u){const x=await fetchText(u);if(!x)return[];const d=parseXML(x);if(!d)return[];const idx=[...d.getElementsByTagName('sitemap')].map(s=>s.querySelector('loc')?.textContent).filter(Boolean);if(idx.length){let all=[];for(const l of idx){all.push(...await readSitemap(l));}return all;}return[...d.getElementsByTagName('url')].map(u=>u.querySelector('loc')?.textContent).filter(Boolean);}
  async function fallbackCrawl(origin){const h=await fetchText(origin);if(!h)return[origin];const div=document.createElement('div');div.innerHTML=h;const links=[...div.querySelectorAll('a[href]')].map(e=>new URL(e.getAttribute('href'),origin).toString()).filter(u=>sameHost(u,origin));return [origin,...[...new Set(links)]].slice(0,40);}
  async function learnSite(origin){const maps=[origin+'/sitemap.xml',origin+'/sitemap_index.xml'];let urls=[];for(const u of maps){const got=await readSitemap(u);if(got?.length){urls=got;break;}}if(!urls.length)urls=await fallbackCrawl(origin);const pages=[];for(const u of urls.slice(0,40)){const t=await fetchText(u);if(!t)continue;const title=(t.match(/<title[^>]*>([^<]+)<\/title>/i)||[])[1]||u;pages.push({url:u,title});}return pages;}
  async function doAutoLearn(){if(!CFG.autolearn)return;const bases=[location.origin,...CFG.extraSites];const cache={};for(const o of bases){const host=(toURL(o)||{}).origin;if(!host)continue;cache[host]={ts:nowSec(),pages:await learnSite(host)};}localStorage.setItem(K.learn,JSON.stringify(cache));}
  function searchKnowledge(q){const c=safe(localStorage.getItem(K.learn))||{};const low=q.toLowerCase();const hits=[];for(const host in c){for(const p of c[host].pages||[]){if(p.title.toLowerCase().includes(low))hits.push(p);if(hits.length>5)break;}}return hits;}

  // ===== ENGINE & AI =====
  const PREFIX=["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị nhé,"];
  const SUFFIX=[" ạ."," nhé ạ."," nha anh/chị."];
  const polite=t=>`${PREFIX[Math.floor(Math.random()*PREFIX.length)]} ${t}${SUFFIX[Math.floor(Math.random()*SUFFIX.length)]}`;
  function compose(q){
    if(/giá|bao nhiêu|thuê|cost/i.test(q))return polite("Giá thuê xe số từ 130.000đ/ngày, xe ga 200.000đ/ngày, xe điện 200.000đ. Anh/chị muốn thuê loại nào ạ?");
    if(/thủ tục|giấy tờ|cọc/i.test(q))return polite("Thủ tục gồm CCCD/hộ chiếu + cọc tùy xe. Có giảm cọc nếu đủ giấy tờ.");
    const hits=searchKnowledge(q);
    if(hits.length)return polite("Em có tìm thấy vài nội dung liên quan:\n"+hits.map(h=>`• ${h.title} — ${h.url}`).join("\n"));
    return polite("Anh/chị vui lòng nói rõ loại xe hoặc thời gian thuê để em hỗ trợ chính xác hơn ạ.");
  }

  // ===== CORE =====
  async function sendUser(text){
    if(sending)return;sending=true;
    addMsg('user',text);
    const delay=2500+Math.random()*2500;await sleep(delay);
    const ans=compose(text);
    addMsg('bot',ans);
    sending=false;
  }

  function openChat(){if(isOpen)return;$('#mta-card').classList.add('open');$('#mta-backdrop').classList.add('show');$('#mta-bubble').style.display='none';isOpen=true;}
  function closeChat(){if(!isOpen)return;$('#mta-card').classList.remove('open');$('#mta-backdrop').classList.remove('show');$('#mta-bubble').style.display='flex';isOpen=false;}

  function bind(){
    $('#mta-bubble').onclick=openChat;
    $('#mta-backdrop').onclick=closeChat;
    $('#mta-close').onclick=closeChat;
    $('#mta-send').onclick=()=>{const v=$('#mta-in').value.trim();if(!v)return;$('#mta-in').value='';sendUser(v);};
    $('#mta-in').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#mta-send').click();}});
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    injectUI();bind();
    await doAutoLearn();
    console.log('%cMotoAI v26 Ultra AutoLearn MultiSite — Active','color:#0084FF;font-weight:bold;');
  });

})();
