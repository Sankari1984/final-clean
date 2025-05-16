document.addEventListener('DOMContentLoaded', function () {
  const userId = localStorage.getItem('user_id');

  if (!userId) {
    window.location.href = 'login.html';
    return;
  }

  // تحميل التصنيفات للمستخدم
  fetch(`http://192.168.18.11:5000/settings/${userId}`)
    .then(response => response.json())
    .then(data => {
      const categorySelect = document.getElementById('category');
      if (data.tabs && Array.isArray(data.tabs)) {
        data.tabs.forEach(tab => {
          const option = document.createElement('option');
          option.value = tab;
          option.textContent = tab;
          categorySelect.appendChild(option);
        });
      }
    })
    .catch(err => {
      console.error('❌ خطأ في تحميل التصنيفات:', err);
    });

  const form = document.getElementById('uploadForm');
  const previewContainer = document.createElement('div');
  previewContainer.id = 'previewContainer';
  form.appendChild(previewContainer);

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = '📤 تأكيد ونشر المنتج';
  confirmBtn.style.display = 'none';
  form.appendChild(confirmBtn);

  document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('name', document.getElementById('name').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('price', document.getElementById('price').value || '');
    formData.append('file', document.getElementById('file').files[0]);

    try {
      const response = await fetch(`http://192.168.18.11:5000/upload-product`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.status === 'success') {
        previewContainer.innerHTML = `
          <h3>📌 تم توليد البوست:</h3>
          <textarea id="generatedPost" rows="5" style="width: 100%; border: 1px solid #ccc; padding: 10px; border-radius: 6px;">${result.post}</textarea>
        `;
        confirmBtn.style.display = 'block';

        // عند الضغط على "تأكيد ونشر"
        confirmBtn.onclick = async function () {
          const confirmData = new FormData();
          confirmData.append('user_id', userId);
          confirmData.append('name', document.getElementById('name').value);
          confirmData.append('category', document.getElementById('category').value);
          confirmData.append('description', document.getElementById('description').value);
          confirmData.append('price', document.getElementById('price').value || '');
          confirmData.append('post', document.getElementById('generatedPost').value);
          confirmData.append('file', document.getElementById('file').files[0]);

          const confirmRes = await fetch(`http://192.168.18.11:5000/confirm-product`, {
            method: 'POST',
            body: confirmData
          });
          const confirmResult = await confirmRes.json();
          if (confirmResult.status === 'success') {
            alert('✅ تم نشر المنتج بنجاح!');
            window.location.href = 'store.html';
          } else {
            alert('❌ فشل في حفظ المنتج: ' + confirmResult.message);
          }
        };
      } else {
        alert('❌ فشل في رفع المنتج: ' + result.message);
      }
    } catch (error) {
      console.error('❌ خطأ أثناء رفع المنتج:', error);
    }
  });
});
