/* =========[ PHẦN 1 — CẤU HÌNH TÙY BIẾN ]========= */
window.MotoAI_CONFIG = {
  phone: "0857255868",
  map: "https://maps.app.goo.gl/ABCxyz",
  brand: "Thuê Xe Máy Hà Nội",
  learnSites: [
    "https://motoopen.github.io/chothuexemayhanoi/sitemap.xml",
    "https://thuexemaynguyentu.com/sitemap.xml",
    "https://rentbikehanoi.com/sitemap.xml"
  ],
  learnFallback: [
    "https://motoopen.github.io/chothuexemayhanoi/index.html",
    "https://thuexemaynguyentu.com/",
    "https://rentbikehanoi.com/"
  ],
  maxPagesPerSite: 12 // giới hạn để nhẹ (có thể tăng nếu muốn)
};

/* =========[ PHẦN 2 — MOTOAI v31 SMARTPOLITE-MULTISITE ]========= */
(function(){
  if(window.MotoAI_V31) return;
  window.MotoAI_V31 = true;
  console.log("%cMotoAI v31 SmartPolite-Multisite — Active","color:#0a84ff;font-weight:bold;");

  const cfg = window.MotoAI_CONFIG || {};
  const storeKey = "motoai_v31_kb"; // knowledge base
  const KB_LIMIT = 200000; // ~200KB text tổng cộng để an toàn localStorage

  const MotoAI = {
    phone: cfg.phone || "0000000000",
    map: cfg.map || "",
    brand: cfg.brand || "MotoAI",
    learnSites: cfg.learnSites || [],
    learnFallback: cfg.learnFallback || [],
    maxPagesPerSite: cfg.maxPagesPerSite || 10,

    memory: [],
    maxMemory: 5,
    kb: [], // {url, title, text, langGuess}

    /* ===== Language detect ===== */
    detectLang(input){
      const viMarks = input.match(/[à-ỹÀ-Ỵ]/g)?.length || 0;
      const ascii = input.match(/[a-zA-Z]/g)?.length || 0;
      if(ascii && !viMarks) return "en";
      if(viMarks > 0) return "vi";
      const t = input.toLowerCase();
      if(/\b(how much|price|rent|delivery|hotel|contact|scooter|manual|day|week|month)\b/.test(t)) return "en";
      return "vi";
    },

    /* ===== Intent detect (VI/EN) ===== */
    analyzeIntent(input, lang){
      const t = input.toLowerCase();
      const vi = {
        pricing: /(giá|bao nhiêu|thuê|bao nhieu|bao nhiu)/,
        procedure: /(thủ tục|giấy tờ|giay to|đặt cọc|dat coc)/,
        delivery: /(giao|tận nơi|khách sạn|hotel|ship|giao tận)/,
        contact:  /(liên hệ|điện thoại|sdt|zalo|whatsapp|call|phone|map|địa chỉ|dia chi)/,
        vehicle:  /(xe ga|xe số|vision|lead|wave|sirius|airblade)/,
      };
      const en = {
        pricing: /(price|how much|rent|cost|rate)/,
        procedure: /(procedure|document|id card|deposit)/,
        delivery: /(deliver|delivery|hotel|drop off|pick up)/,
        contact:  /(contact|call|phone|zalo|whatsapp|map|address|location)/,
        vehicle:  /(scooter|manual|semi-auto|vision|lead|wave|sirius|airblade)/,
      };
      const rule = (lang === "en") ? en : vi;
      if(rule.pricing.test(t))  return "pricing";
      if(rule.procedure.test(t))return "procedure";
      if(rule.delivery.test(t)) return "delivery";
      if(rule.contact.test(t))  return "contact";
      if(rule.vehicle.test(t))  return "vehicle";
      return "chat";
    },

    /* ===== Time parsing ===== */
    parseTime(input){
      const t = input.toLowerCase();
      if(/\b(\d+)\s*ngày\b/.test(t)) return {mode:"days", days: parseInt(t.match(/\b(\d+)\s*ngày\b/)[1],10)};
      if(/\bngày\b/.test(t)) return {mode:"days", days:1};
      if(/\btuần\b/.test(t)) return {mode:"week", days:7};
      if(/\btháng\b/.test(t)) return {mode:"month", days:30};
      if(/\b(\d+)\s*day(s)?\b/.test(t)) return {mode:"days", days: parseInt(t.match(/\b(\d+)\s*day(s)?\b/)[1],10)};
      if(/\bday\b/.test(t)) return {mode:"days", days:1};
      if(/\bweek(s)?\b/.test(t)) return {mode:"week", days:7};
      if(/\bmonth(s)?\b/.test(t)) return {mode:"month", days:30};
      if(/(\d+)/.test(t)) return {mode:"days", days: parseInt(t.match(/(\d+)/)[1],10)};
      return {mode:"days", days:1};
    },

    /* ===== Polite tone ===== */
    naturalVI(text){
      const tails = ["bạn nhé.","nha.","đó.","ha.","bạn ơi."];
      const tail = tails[Math.floor(Math.random()*tails.length)];
      return text.trim().replace(/[.!?]?$/," ")+tail;
    },
    naturalEN(text){
      const tails = ["please.","if that works for you.","alright.","okay.","thanks."];
      const tail = tails[Math.floor(Math.random()*tails.length)];
      const s = text.trim().replace(/[.!?]?$/," ");
      return s.charAt(0).toUpperCase()+s.slice(1)+tail;
    },

    /* ===== Built-in answers ===== */
    replyVI(intent, tinfo){
      const {mode, days} = tinfo;
      const dailyManual = 150_000, dailyScooter = 200_000;

      if(intent === "pricing"){
        if(mode === "month") return "Thuê tháng thì giá rơi vào tầm 1,5–2 triệu/tháng, tuỳ dòng xe bạn chọn.";
        if(mode === "week")  return "Thuê 1 tuần bên mình giảm nhẹ, khoảng 130k/ngày; tính ra cỡ 900k/tuần tuỳ xe.";
        if(days === 1)       return "Giá thuê xe máy bên mình là 150k/ngày cho xe số, 200k/ngày cho xe ga.";
        if(days >= 2 && days < 7){
          const m = (dailyManual*days)/1000, s = (dailyScooter*days)/1000;
          return `Thuê ${days} ngày thì khoảng ${m}k cho xe số hoặc ${s}k cho xe ga.`;
        }
        if(days >=7 && days < 30) return "Thuê 1 tuần bên mình giảm còn khoảng 130k/ngày; mình có thể tính cụ thể theo mẫu xe.";
        if(days >=30)             return "Thuê tháng thường 1,5–2 triệu/tháng; mình có thể tư vấn theo mẫu xe bạn thích.";
      }
      if(intent === "procedure") return "Thủ tục đơn giản thôi, chỉ cần căn cước gốc, không cần đặt cọc; bên mình có thể giao tận nơi.";
      if(intent === "delivery")  return "Bên mình có giao xe tận nơi trong nội thành Hà Nội, miễn phí với đơn từ 2 ngày trở lên.";
      if(intent === "contact"){
        const mapPart = this.map ? ` Bản đồ: ${this.map}.` : "";
        return `Bạn có thể gọi trực tiếp số ${this.phone} hoặc nhắn Zalo cùng số đó để được hỗ trợ nhanh nhất.${mapPart}`;
      }
      if(intent === "vehicle")   return "Bên mình có xe số (Wave, Sirius) và xe ga (Vision, Lead), xe sạch đẹp, bảo dưỡng kỹ.";
      return "Bạn mô tả rõ hơn một chút để mình hỗ trợ chính xác hơn được không?";
    },

    replyEN(intent, tinfo){
      const {mode, days} = tinfo;
      const dailyManual = 150_000, dailyScooter = 200_000;

      if(intent === "pricing"){
        if(mode === "month") return "Monthly rentals are around 1.5–2.0 million VND/month depending on the bike model.";
        if(mode === "week")  return "For a week, we discount to ~130k VND/day; roughly ~900k VND/week depending on the bike.";
        if(days === 1)       return "The rental price is about 150,000 VND/day for manual bikes and 200,000 VND/day for scooters.";
        if(days >=2 && days < 7){
          const m = (dailyManual*days), s = (dailyScooter*days);
          return `For ${days} days, it's about ${m.toLocaleString("en-US")} VND for manual or ${s.toLocaleString("en-US")} VND for scooters.`;
        }
        if(days >=7 && days < 30) return "Weekly rentals are ~130k VND/day; I can quote precisely based on the model you prefer.";
        if(days >=30)             return "Monthly rentals are typically 1.5–2.0 million VND; happy to advise based on your needs.";
      }
      if(intent === "procedure") return "You only need your original ID card; no deposit required. We can deliver to your place.";
      if(intent === "delivery")  return "We deliver within Hanoi, free for rentals of 2 days or more.";
      if(intent === "contact"){
        const mapPart = this.map ? ` Map: ${this.map}.` : "";
        return `You can call or message Zalo/WhatsApp at ${this.phone} for the quickest support.${mapPart}`;
      }
      if(intent === "vehicle")   return "We have manual (Wave, Sirius) and scooters (Vision, Lead), well-maintained and clean.";
      return "Could you share a bit more detail so I can help you better?";
    },

    /* ===== Typing bubble ===== */
    showTyping(delay, lang){
      let el = document.querySelector("#motoai-typing");
      if(!el){
        el = document.createElement("div");
        el.id = "motoai-typing";
        Object.assign(el.style, {
          position:"fixed", bottom:"80px", right:"20px",
          background:"rgba(0,0,0,0.7)", color:"#fff",
          padding:"10px 16px", borderRadius:"14px",
          fontSize:"15px", fontFamily:"Inter,system-ui",
          zIndex:"9999", transition:"opacity .3s"
        });
        document.body.appendChild(el);
      }
      let dots = 0;
      const label = (lang==="en") ? "MotoAI typing" : "MotoAI đang gõ";
      el.textContent = label+"...";
      el._interval = setInterval(()=>{ dots=(dots+1)%4; el.textContent = label + ".".repeat(dots); }, 500);
    },
    hideTyping(){
      const el = document.querySelector("#motoai-typing");
      if(el){ clearInterval(el._interval); el.style.opacity="0"; setTimeout(()=>el.remove(), 350); }
    },

    /* ===== Lightweight retrieval from KB ===== */
    answerFromKB(query, lang){
      if(!this.kb.length) return null;
      const q = query.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(x=>x.length>2);
      let best = null, bestScore = 0;
      for(const doc of this.kb){
        const text = (doc.text || "").toLowerCase();
        let score = 0;
        for(const w of q){
          if(text.includes(w)) score += 1;
        }
        // nhẹ nhàng + thêm điểm nếu tiêu đề khớp
        if(doc.title && q.some(w=>doc.title.toLowerCase().includes(w))) score += 2;
        if(score > bestScore){
          bestScore = score; best = doc;
        }
      }
      if(best && bestScore >= 2){
        // trích 200 ký tự đầu tiên
        const snippet = (best.text || "").trim().slice(0, 200).replace(/\s+/g," ");
        if(lang === "en"){
          return `From our site (${best.title || best.url}): ${snippet}...`;
        } else {
          return `Theo nội dung từ web (${best.title || best.url}): ${snippet}...`;
        }
      }
      return null;
    },

    /* ===== Public API: reply() ===== */
    async reply(input){
      const lang = this.detectLang(input);
      let intent = this.analyzeIntent(input, lang);
      if(intent === "chat" && this.memory.length){
        intent = this.memory[this.memory.length-1].intent || "chat";
      }
      const tinfo = this.parseTime(input);

      // 1) KB retrieval trước, chỉ dùng làm bổ sung khi có nội dung
      const kbMsg = this.answerFromKB(input, lang);

      // 2) Câu trả lời built-in lịch sự
      let raw = (lang === "en") ? this.replyEN(intent, tinfo) : this.replyVI(intent, tinfo);

      // 3) Ghép kb nếu phù hợp (tránh spam: chỉ khi kbMsg khác intent contact/pricing ngắn)
      if(kbMsg && intent !== "contact"){
        raw += (lang==="en" ? " More info: " : " Tham khảo thêm: ") + kbMsg;
      }

      let finalMsg = (lang === "en") ? this.naturalEN(raw) : this.naturalVI(raw);

      // memory
      this.memory.push({q: input, a: finalMsg, intent, lang});
      if(this.memory.length > this.maxMemory) this.memory.shift();

      // typing
      const delay = 3000 + Math.random()*3000;
      this.showTyping(delay, lang);
      return new Promise(resolve=>{
        setTimeout(()=>{ this.hideTyping(); resolve(finalMsg); }, delay);
      });
    },

    /* ======== MULTISITE LEARN (SITEMAP + HTML FALLBACK) ======== */
    async initLearn(){
      try{
        // load KB từ localStorage
        const raw = localStorage.getItem(storeKey);
        if(raw){
          this.kb = JSON.parse(raw);
        }
      }catch(e){ console.warn("KB parse error:", e); }

      // nếu chưa có KB, hoặc KB rỗng → học
      if(!this.kb || this.kb.length === 0){
        await this.learnAll();
      }
    },

    async learnAll(){
      const urls = new Set();

      // 1) đọc sitemap
      for(const sm of this.learnSites){
        try{
          const list = await this.fetchSitemapURLs(sm, this.maxPagesPerSite);
          list.forEach(u=>urls.add(u));
        }catch(e){ console.warn("Sitemap fail:", sm, e); }
      }

      // 2) fallback HTML (index, homepage, v.v.)
      for(const fb of this.learnFallback){
        urls.add(fb);
      }

      // 3) fetch trang
      const chosen = Array.from(urls).slice(0, this.maxPagesPerSite * Math.max(1, this.learnSites.length));
      const docs = [];
      for(const u of chosen){
        try{
          const doc = await this.fetchPageDoc(u);
          if(doc && doc.text){
            docs.push(doc);
            // giới hạn tổng dung lượng để tránh vượt localStorage
            const currentSize = (JSON.stringify(docs).length);
            if(currentSize > KB_LIMIT) break;
          }
        }catch(e){ console.warn("Fetch page fail:", u, e); }
      }
      this.kb = docs;
      try{
        localStorage.setItem(storeKey, JSON.stringify(this.kb));
      }catch(e){ console.warn("Save KB fail:", e); }
    },

    async fetchSitemapURLs(sitemapURL, limit=10){
      const out = [];
      const res = await fetch(sitemapURL, {mode:"cors"});
      const xml = await res.text();
      const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m=>m[1]);
      // nếu là sitemap_index → có thể chứa link đến sitemap con
      const pageLinks = locs.filter(u=>!u.endsWith(".xml"));
      const childMaps = locs.filter(u=>u.endsWith(".xml"));

      // ưu tiên pageLinks trước
      for(const u of pageLinks){
        out.push(u);
        if(out.length >= limit) return out;
      }
      // sau đó duyệt sitemap con (nhẹ nhàng)
      for(const sm of childMaps){
        try{
          const sub = await fetch(sm, {mode:"cors"}).then(r=>r.text());
          const subLocs = Array.from(sub.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m=>m[1]);
          for(const u of subLocs){
            out.push(u);
            if(out.length >= limit) return out;
          }
        }catch(e){ console.warn("Child sitemap fail:", sm, e); }
      }
      return out.slice(0, limit);
    },

    async fetchPageDoc(url){
      const res = await fetch(url, {mode:"cors"});
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const title = (doc.querySelector("title")?.textContent || "").trim();
      const metasel = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      const h1 = (doc.querySelector("h1")?.textContent || "").trim();
      const p = (doc.querySelector("p")?.textContent || "").trim();
      let bodyText = (doc.body?.textContent || "").replace(/\s+/g," ").trim();
      bodyText = bodyText.slice(0, 1200); // cắt ngắn cho nhẹ
      const langGuess = /[à-ỹÀ-Ỵ]/.test(bodyText) ? "vi" : "en";
      const text = [title, metasel, h1, p, bodyText].filter(Boolean).join(" — ");
      return {url, title, text, langGuess};
    }
  };

  // expose
  window.MotoAI = MotoAI;

  // tự khởi động học (không chặn UI; không lỗi nếu CORS chặn)
  window.addEventListener("load", ()=>{
    MotoAI.initLearn().catch(()=>{});
  });
})();
