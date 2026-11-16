/* Contact form without a backend: compose the request as an email (mailto) to Motoopen
   instead of the old "feature in development" alert. Phone/Zalo stay the fastest channels. */
(function () {
  var form = document.getElementById('main-contact-form');
  if (!form) return;
  var status = document.getElementById('contact-form-status');
  var email = form.getAttribute('data-email') || '';
  var phone = form.getAttribute('data-phone') || '';
  var phoneDisplay = form.getAttribute('data-phone-display') || phone;

  function field(id) {
    var el = form.querySelector('#' + id);
    return el ? String(el.value || '').trim() : '';
  }

  function say(html, isError) {
    if (!status) return;
    status.innerHTML = html;
    status.classList.toggle('is-error', !!isError);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var name = field('name');
    var tel = field('phone');
    var message = field('message');

    if (!name || tel.replace(/[^0-9]/g, '').length < 9) {
      say('Vui lòng nhập họ tên và số điện thoại hợp lệ để Motoopen liên hệ lại.', true);
      var first = !name ? form.querySelector('#name') : form.querySelector('#phone');
      if (first) first.focus();
      return;
    }

    var body = 'Họ và tên: ' + name + '\nSố điện thoại: ' + tel + '\nNội dung: ' + (message || '(chưa ghi)') +
      '\n\nGửi từ trang Liên hệ: ' + location.href;
    var href = 'mailto:' + email + '?subject=' + encodeURIComponent('Yêu cầu thuê xe - ' + name) +
      '&body=' + encodeURIComponent(body);

    say('Đang mở ứng dụng email với nội dung đã soạn sẵn. Nếu không thấy, vui lòng <a href="tel:' + phone +
      '">gọi ' + phoneDisplay + '</a> hoặc <a href="https://zalo.me/' + phone + '" target="_blank" rel="noopener">nhắn Zalo</a>.', false);
    window.location.href = href;
  });
})();
