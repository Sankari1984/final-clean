document.addEventListener('DOMContentLoaded', function () {
  const userId = localStorage.getItem('user_id');

  if (!userId) {
    window.location.href = 'login.html';
    return;
  }

  // ✅ تحميل المعلومات فقط (بدون tabs)
  fetch(`http://192.168.18.11:5000/settings/${userId}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('phone').value = data.phone || '';
      document.getElementById('instagram').value = data.instagram || '';
      document.getElementById('whatsapp').value = data.whatsapp || '';
    });

  // ✅ حفظ فقط رقم الهاتف والروابط
  document.getElementById('tabsForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const phone = document.getElementById('phone').value.trim();
    const instagram = document.getElementById('instagram').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();

    fetch(`http://192.168.18.11:5000/settings/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tabs: [], phone, instagram, whatsapp })  // tabs فارغة
    })
      .then(response => response.json())
      .then(result => {
        if (result.status === 'success') {
          alert('✅ تم حفظ الإعدادات');
          window.location.href = 'store.html';
        } else {
          alert('❌ فشل في الحفظ');
        }
      })
      .catch(error => {
        console.error('❌ خطأ في الحفظ:', error);
      });
  });
});
