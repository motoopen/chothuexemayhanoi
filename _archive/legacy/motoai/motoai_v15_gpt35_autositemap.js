/*
 * 🚀 MotoAI v15 — GPT-3.5 Auto-Sitemap Combo
 * Tự động phát hiện mọi file *_sitemap.json trong repo, học toàn bộ dữ liệu web.
 * Giao diện: Apple UI (v9.8)
 * Engine: Smart GPT-3.5 Logic (v13+)
 * Made for: https://motoopen.github.io/chothuexemayhanoi/
 */
(function(){
  if(window.MotoAI_v15_LOADED) return;
  window.MotoAI_v15_LOADED = true;
  console.log("%c🤖 MotoAI v15 Auto-Sitemap Combo khởi động...","color:#0a84ff;font-weight:bold;");

  const CFG = {
    corpusKey:"MotoAI_v15_corpus",
    sessionKey:"MotoAI_v15_session",
    memoryKey:"MotoAI_v15_user",
    repo:"https://motoopen.github.io/chothuexemayhanoi/",
    minLen:20
  };

  const html = `
  <div id="motoai-root"><div id="motoai-bubble">🤖</div>
  <div id="motoai-backdrop"></div>
  <div id="motoai-card">
  <div id="motoai-handle"></div>
  <div id="motoai-header"><span>MotoAI v15</span><button id="motoai-close">✕</button></div>
  <div id="motoai-body"></div>
  <div id="motoai-input"><input id="motoai-q" placeholder="Nhập câu hỏi..."/><button id="motoai-send">Gửi</button></div>
  </div></div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  const css = `
  #motoai-root{position:fixed;left:16px;bottom:90px;z-index:99997}
  #motoai-bubble{width:58px;height:58px;border-radius:14px;background:#007aff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,0.25)}
  #motoai-card{position:fixed;left:0;right:0;bottom:0;margin:auto;width:min(900px,calc(100%-30px));height:70vh;max-height:720px;border-radius:22px 22px 0 0;background:rgba(255,255,255,0.9);backdrop-filter:blur(12px);transform:translateY(110%);opacity:0;transition:all .4s ease;display:flex;flex-direction:column;overflow:hidden;z-index:99999}
  #motoai-card.open{transform:translateY(0);opacity:1}
  #motoai-header{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;font-weight:700;color:#007aff}
  #motoai-body{flex:1;overflow-y:auto;padding:10px 14px;font-size:15px}
  .m-msg{margin:8px 0;padding:10px 14px;border-radius:16px;max-width:80%;box-shadow:0 3px 8px rgba(0,0,0,0.08)}
  .m-msg.user{background:linear-gradient(180deg,#007aff,#00b6ff);color:#fff;margin-left:auto}
  .m-msg.bot{background:rgba(255,255,255,.85);color:#111}
  #motoai-input{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,.08);background:rgba(255,255,255,.6);backdrop-filter:blur(10px)}
  #motoai-input input{flex:1;padding:8px 10px;border-radius:10px;border:1px solid rgba(0,0,0,0.1)}
  #motoai-input button{background:#007aff;color:#fff;border:none;border-radius:10px;padding:8px 14px;font-weight:600}
  @media(prefers-color-scheme:dark){#motoai-card{background:rgba(30,30,32,0.92);color:#eee}.m-msg.bot{background:rgba(50,50,55,0.8);color:#eee}#motoai-input{background:rgba(20,20,25,0.9)}#motoai-input input{background:rgba(40,40,45,0.8);color:#eee;border:1px solid rgba(255,255,255,0.1)}}
  `;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  const $=s=>document.querySelector(s);
  const bubble=$("#motoai-bubble"),card=$("#motoai-card"),body=$("#motoai-body"),
        send=$("#motoai-send"),input=$("#motoai-q"),close=$("#motoai-close");

  let corpus=[];
  try{ corpus=JSON.parse(localStorage.getItem(CFG.corpusKey)||"[]"); }catch(e){corpus=[];}

  function addMsg(role,txt){
    const el=document.createElement("div");
    el.className="m-msg "+role;
    el.textContent=txt;
    body.appendChild(el);
    body.scrollTop=body.scrollHeight;
  }

  function smartAnswer(q){
    const t=q.toLowerCase();
    const rules=[
      {re:/xe ga|tay ga|vision|lead/,a:"Xe ga 🛵 chạy êm, giá thuê từ 120k-150k/ngày."},
      {re:/xe số|wave|sirius/,a:"Xe số 🏍 tiết kiệm xăng, giá thuê 100k/ngày."},
      {re:/50cc|không cần bằng|học sinh/,a:"Xe 50cc không cần GPLX, chỉ cần CCCD, giá từ 80k/ngày."},
      {re:/thủ tục|giấy tờ/,a:"Thủ tục: CCCD + GPLX (hoặc passport nếu là khách nước ngoài)."},
      {re:/liên hệ|điện thoại|zalo/,a:"Liên hệ 085.725.5868 (Zalo/Hotline) để đặt xe nhanh nhất!"}
    ];
    for(const r of rules) if(r.re.test(t)) return r.a;
    return null;
  }

  async function sendQuery(){
    const q=input.value.trim();
    if(!q) return;
    addMsg("user",q);
    input.value="";
    let ans=smartAnswer(q);
    if(!ans){
      // tìm trong corpus
      const n=q.toLowerCase();
      for(const c of corpus){
        if(c.text.toLowerCase().includes(n.slice(0,5))){ ans=c.text.slice(0,200); break;}
      }
    }
    addMsg("bot",ans||"Xin lỗi, mình chưa rõ câu hỏi này.");
  }

  send.onclick=sendQuery;
  input.addEventListener("keydown",e=>{if(e.key==="Enter")sendQuery();});
  bubble.onclick=()=>{card.classList.add("open");bubble.style.display="none";};
  close.onclick=()=>{card.classList.remove("open");bubble.style.display="flex";};

  /* 🧠 Auto-Sitemap Detection & Learning */
  (async()=>{
    try{
      const sitemapList=["moto_sitemap.json","wiki_sitemap.json","blog_sitemap.json","tour_sitemap.json"];
      const valid=[];
      for(const f of sitemapList){
        const u=CFG.repo+f;
        const r=await fetch(u,{cache:"no-store"});
        if(r.ok) valid.push(u);
      }
      if(!valid.length){console.log("⚠️ Không có sitemap nào.");return;}
      let combined=""; for(const u of valid){combined+=await fetch(u).then(r=>r.text());}
      const hash=btoa(combined);
      const old=localStorage.getItem("MotoAI_v15_hash");
      if(old!==hash){
        console.log("🆕 Sitemap thay đổi, học lại toàn bộ...");
        localStorage.removeItem(CFG.corpusKey);
        localStorage.setItem("MotoAI_v15_hash",hash);
      }
      let total=0;
      corpus=JSON.parse(localStorage.getItem(CFG.corpusKey)||"[]");
      const seen=new Set(corpus.map(c=>c.text));
      for(const u of valid){
        const j=await fetch(u).then(r=>r.json());
        for(const p of j.pages){
          const txt=await fetch(p).then(r=>r.text()).catch(()=>null);
          if(!txt)continue;
          txt.split(/[\r\n]+/).forEach(l=>{
            const t=l.trim();
            if(t.length>CFG.minLen&&!seen.has(t)){
              corpus.push({id:corpus.length,text:t});
              seen.add(t);
              total++;
            }
          });
        }
      }
      if(total>0){
        localStorage.setItem(CFG.corpusKey,JSON.stringify(corpus));
        console.log(`✅ Đã nạp thêm ${total} dòng từ ${valid.length} sitemap.`);
      }else console.log("ℹ️ Không có dữ liệu mới.");
    }catch(e){console.warn("Lỗi load sitemap:",e);}
  })();

  window.MotoAI_v15={send:sendQuery,corpus:()=>corpus.length};
  console.log("%c✅ MotoAI v15 Auto-Sitemap sẵn sàng!","color:#007aff;font-weight:bold;");
})();
