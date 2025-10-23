// MotoAI Core v7.0 — Local Learning AI 🧠 (no API, offline, auto-learn)
(function(){
  if(window.MotoAI_CoreV7_Loaded) return;
  window.MotoAI_CoreV7_Loaded = true;
  console.log("⚙️ MotoAI Core v7.0 loaded (Local Learning Mode)");

  // Tự quét toàn bộ nội dung trang
  function buildCorpus(){
    const text = document.body.innerText || "";
    const parts = text
      .replace(/\s+/g, ' ')
      .replace(/([.?!])\s+(?=[A-ZÀ-Ỵ0-9])/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 25);
    console.log(`📚 MotoAI đã học ${parts.length} đoạn từ trang.`);
    return parts;
  }

  const CORPUS = buildCorpus();
  const MEMORY = [];

  // Đo tương đồng giữa 2 chuỗi đơn giản
  function similarity(a, b){
    a = a.toLowerCase();
    b = b.toLowerCase();
    const wordsA = a.split(/\W+/);
    const wordsB = b.split(/\W+/);
    const common = wordsA.filter(w => wordsB.includes(w));
    return common.length / Math.max(wordsA.length, wordsB.length);
  }

  // Tìm đoạn trả lời phù hợp nhất
  function findAnswer(question){
    let bestScore = 0;
    let bestText = "";
    for(const sentence of CORPUS){
      const score = similarity(question, sentence);
      if(score > bestScore){
        bestScore = score;
        bestText = sentence;
      }
    }
    if(bestScore < 0.08) return "Xin lỗi, mình chưa thấy thông tin đó 🤔.";
    return bestText;
  }

  // === Kết nối với MotoAI UI ===
  window.addEventListener("MotoAI_Ask", e => {
    const q = e.detail;
    const a = findAnswer(q);
    MEMORY.push({ q, a });
    window.dispatchEvent(new CustomEvent("MotoAI_Answer", { detail: a }));
  });
})();
