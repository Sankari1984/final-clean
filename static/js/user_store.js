document.addEventListener('DOMContentLoaded', async function () {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user_id');
    const productsContainer = document.getElementById('productsContainer');
  
    if (!userId) {
      productsContainer.innerHTML = "<p>❌ لا يوجد زبون محدد</p>";
      return;
    }
  
    let sellerInfo = {};
  
    // جلب إعدادات المستخدم (رقم الهاتف، انستغرام، واتساب)
    try {
      const settingsRes = await fetch(`/user-settings/${userId}`);
      const settingsData = await settingsRes.json();
      sellerInfo = {
        phone: settingsData.phone || '',
        instagram: settingsData.instagram || '',
        whatsapp: settingsData.whatsapp || ''
      };
    } catch (err) {
      console.warn("فشل تحميل معلومات الزبون:", err);
    }
  
    // جلب المنتجات
    try {
      const response = await fetch('/products');
      const products = await response.json();
      const userProducts = products.filter(p => p.user_id === userId);
  
      if (userProducts.length === 0) {
        productsContainer.innerHTML = "<p>لا يوجد منتجات حالياً لهذا المستخدم</p>";
      } else {
        userProducts.forEach(product => {
          const card = document.createElement('div');
          card.className = 'product-card';
  
          let media = '';
          const fullUrl = product.image.startsWith('/uploads') ? product.image : `/uploads/${product.image}`;
          if (fullUrl.endsWith('.mp4') || fullUrl.endsWith('.webm') || fullUrl.endsWith('.mov')) {
            media = `<video controls style="width:100%; max-height:180px;"><source src="${fullUrl}" type="video/mp4"></video>`;
          } else {
            media = `<img src="${fullUrl}" style="max-height:180px; cursor:pointer;" alt="${product.name}">`;
          }
  
          const description = `🔥 ${product.name}! ${product.description} ✨`;
  
          card.innerHTML = `
            ${media}
            <div class="product-card-content">
              <h3>${product.name}</h3>
              <p class="product-description">${description}</p>
            </div>
          `;
  
          // عند الضغط على البطاقة، عرض تفاصيل الزبون
          card.addEventListener('click', () => {
            showProductDetails(product.name, sellerInfo);
          });
  
          productsContainer.appendChild(card);
        });
      }
    } catch (err) {
      console.error('فشل في تحميل المنتجات:', err);
      productsContainer.innerHTML = "<p>❌ خطأ في تحميل المنتجات.</p>";
    }
  });
  
  // عرض التفاصيل في صندوق المعلومات
  function showProductDetails(productName, sellerInfo) {
    document.getElementById('productTitle').innerText = productName;
    document.getElementById('sellerPhone').innerText = `📞 هاتف: ${sellerInfo.phone || 'غير متوفر'}`;
    document.getElementById('sellerInstagram').innerText = `📸 انستغرام: ${sellerInfo.instagram || 'غير متوفر'}`;
    document.getElementById('sellerWhatsApp').innerText = `💬 واتساب: ${sellerInfo.whatsapp || 'غير متوفر'}`;
    document.getElementById('sellerPhone').innerHTML = sellerInfo.phone
  ? `<a href="tel:${sellerInfo.phone}" class="contact-btn">📞 اتصال</a>` 
  : '📞 غير متوفر';

document.getElementById('sellerWhatsApp').innerHTML = sellerInfo.whatsapp
  ? `<a href="https://wa.me/${sellerInfo.whatsapp.replace(/\D/g, '')}" target="_blank" class="contact-btn">💬 واتساب</a>` 
  : '💬 غير متوفر';

    document.getElementById('productDetails').style.display = 'block';
  }
  