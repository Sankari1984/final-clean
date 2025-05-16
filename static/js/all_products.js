    // ✅ all_products.js

    const BASE_URL = "http://192.168.18.11:5000";
    let currentProductId = null;

    function openUserStories(userId) {
      window.location.href = `/stories.html?user_id=${userId}`;
     } 

    function submitPopupComment() {
        const input = document.getElementById('newComment');
        const comment = input.value.trim();
        if (!comment) return alert("❌ يرجى كتابة تعليق أولاً");
      
        // ✅ أضف التعليق فورًا في الواجهة (قبل الاتصال بالسيرفر)
        const commentsList = document.getElementById('commentsList');
        const tempComment = document.createElement('p');
        tempComment.textContent = '• ' + comment;
        tempComment.style.opacity = '0.6'; // مؤقت لتمييزه
        commentsList.appendChild(tempComment);
      
        input.value = ''; // امسح الحقل فوراً
      
        // 🟡 أرسل التعليق للسيرفر
        fetch(`${BASE_URL}/add_comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: currentProductId, comment: comment })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              tempComment.style.opacity = '1'; // ✅ نجح، ثبت التعليق
            } else {
              alert("❌ فشل إرسال التعليق");
              commentsList.removeChild(tempComment); // ❌ احذف التعليق المؤقت
            }
          })
          .catch(err => {
            console.error("❌ فشل في إرسال التعليق:", err);
            alert("❌ خطأ في إرسال التعليق");
            commentsList.removeChild(tempComment); // ❌ احذف التعليق المؤقت
          });
      }
      
    function viewComments(productId) {
    currentProductId = productId;
    fetch(`${BASE_URL}/comments/${productId}`)
        .then(res => res.json())
        .then(comments => {
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = '';
        if (comments.length === 0) {
            commentsList.innerHTML = '<p>لا توجد تعليقات بعد.</p>';
        } else {
            comments.forEach(comment => {
            const p = document.createElement('p');
            p.textContent = '• ' + comment;
            commentsList.appendChild(p);
            });
        }
        document.getElementById('commentPopup').style.display = 'block';
        document.getElementById('popupOverlay').style.display = 'block';
        });
    }

    function closePopup() {
    document.getElementById('commentPopup').style.display = 'none';
    document.getElementById('popupOverlay').style.display = 'none';
    document.getElementById('newComment').value = '';
    }

    function sortByLikes() {
    fetch('/products')
        .then(res => res.json())
        .then(async products => {
        for (let product of products) {
            const res = await fetch(`/likes/${product.id}`);
            const data = await res.json();
            product.likes = data.likes || 0;
        }
        products.sort((a, b) => b.likes - a.likes);
        localStorage.setItem('cachedProducts', JSON.stringify(products));
        displayProducts(products);
        });
    }

    function sortByPrice() {
    fetch('/products')
        .then(res => res.json())
        .then(async products => {
        for (let product of products) {
            const res = await fetch(`/likes/${product.id}`);
            const data = await res.json();
            product.likes = data.likes || 0;
        }
        products.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
        displayProducts(products);
        });
    }

    async function getUserSettings(userId) {
    try {
        const res = await fetch(`/user-settings/${userId}`);
        const data = await res.json();
        return data;
    } catch (e) {
        console.error("❌ فشل في جلب إعدادات الزبون", e);
        return null;
    }
    }

    async function displayProducts(products) {
    const container = document.getElementById('productGrid');
    container.innerHTML = '';

    for (const product of products) {
        const isVideo = product.image.toLowerCase().endsWith('.mp4') || product.image.toLowerCase().endsWith('.mov');
        const mediaHTML = isVideo
        ? `<video src="${product.image}#t=0.1" controls class="product-media"></video>`
        : `<img src="${product.image}" alt="${product.name}" class="product-media">`;

        const priceHTML = product.price ? `<p class="product-price">${product.price} ر.ق</p>` : '';
        const settings = await getUserSettings(product.user_id);
        const phone = settings?.phone || '';
        const whatsapp = settings?.whatsapp || '';
        const messageText = `👋 مرحبًا! هذا رابط صورة المنتج:\n${product.image}`;
        const whatsappLink = `https://wa.me/${whatsapp.replace(/\D/g, '').replace(/^0+/, '').replace(/^/, '974')}?text=${encodeURIComponent(messageText)}`;

        const contactButtons = (phone || whatsapp)
  ? `<div class="contact-buttons">
      ${phone ? `<a href="tel:${phone}" class="icon-btn" title="اتصال"><img src="/static/icons/phone.svg" alt="اتصال"></a>` : ''}
      ${whatsapp ? `<a href="${whatsappLink}" class="icon-btn" target="_blank" title="واتساب"><img src="/static/icons/whatsapp.svg" alt="واتساب"></a>` : ''}
    </div>`
  : '<div style="margin-top:10px; color:gray; font-size:12px; text-align:center;">رقم غير متوفر</div>';


        container.innerHTML += `
        <div class="product-card">
            <a href="/store.html?user_id=${encodeURIComponent(product.user_id)}&highlight=${product.id}">
            ${mediaHTML}
            </a>
            <h3 class="product-name">${product.name}</h3>
            ${priceHTML}
            <p class="product-description">${product.description || ''}</p>
            <div class="like-comment-bar">
            <button class="like-btn" data-id="${product.id}">❤️ <span id="likes-${product.id}">${product.likes || 0}</span></button>
            <button onclick="viewComments('${product.id}')">💬 عرض التعليقات</button>
            </div>
            <div class="store-link" onclick="window.location.href='/user_store.html?user_id=${product.user_id}'">
            📍 ${product.user_id}
            </div>
            ${contactButtons}
        </div>`;
    }

    products.forEach(product => {
        const btn = document.querySelector(`.like-btn[data-id="${product.id}"]`);
        if (btn) {
        btn.addEventListener('click', () => {
            fetch(`/like/${product.id}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                const span = document.getElementById(`likes-${product.id}`);
                if (span) span.textContent = data.likes;
            });
        });
        }
    });
    }

    document.addEventListener("DOMContentLoaded", () => {
    const cached = localStorage.getItem('cachedProducts');
    if (cached) {
        const products = JSON.parse(cached);
        displayProducts(products);
        localStorage.removeItem('cachedProducts');
    } else {
        sortByLikes();
    }
    });
function loadStoryIcons() {
  fetch(`${BASE_URL}/users`)
    .then(res => res.json())
    .then(users => {
      const storiesBar = document.getElementById("storiesBar");
      users.forEach(user => {
        fetch(`${BASE_URL}/user-settings/${user.user_id}`)
          .then(res => res.json())
          .then(settings => {
            const logoUrl = settings.logo || '/static/img/default_logo.png';

            const div = document.createElement('div');
            div.className = 'story-icon';
            div.onclick = () => openUserStories(user.user_id);
            div.innerHTML = `
              <img src="${logoUrl}" alt="${user.full_name}" class="story-thumb">
              <span>${user.full_name}</span>
            `;
            storiesBar.appendChild(div);
          })
          .catch(() => {
            // في حال فشلنا بتحميل إعدادات الزبون نستخدم صورة افتراضية
            const div = document.createElement('div');
            div.className = 'story-icon';
            div.onclick = () => openUserStories(user.user_id);
            div.innerHTML = `
              <img src="/static/img/default_logo.png" alt="${user.full_name}" class="story-thumb">
              <span>${user.full_name}</span>
            `;
            storiesBar.appendChild(div);
          });
      });
    });
}



document.addEventListener("DOMContentLoaded", () => {
  loadStoryIcons(); // استدعِ الدالة هنا
});
