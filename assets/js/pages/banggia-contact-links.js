    /* Tự lấy số/Zalo/map từ MotoAI_CONFIG nếu có, tránh phải sửa nhiều nơi */
    (function() {
      const cfg = (window.MotoAI_CONFIG || {});
      const phone = (cfg.phone || '0857255868').replace(/\s+/g, '');
      const zalo = cfg.zalo || ('https://zalo.me/' + phone);
      const map = cfg.map || 'https://maps.app.goo.gl/2icTBTxAToyvKTE78';

      const callA = document.getElementById('mapp-call');
      const zaloA = document.getElementById('mapp-zalo');
      const mapA = document.getElementById('mapp-map');
      const sCall = document.getElementById('mapp-sticky-call');
      const sZalo = document.getElementById('mapp-sticky-zalo');

      if (callA) {
        callA.href = 'tel:' + phone;
        callA.setAttribute('aria-label', 'Gọi ' + phone);
      }
      if (zaloA) {
        zaloA.href = zalo;
      }
      if (mapA) {
        mapA.href = map;
      }

      if (sCall) {
        sCall.href = 'tel:' + phone;
      }
      if (sZalo) {
        sZalo.href = zalo;
      }
    })();
