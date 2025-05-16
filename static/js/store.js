const BASE_URL = "http://192.168.18.11:5000";
const urlParams = new URLSearchParams(window.location.search);
const userIdParam = (urlParams.get("user_id") || "").trim().toLowerCase();
const localUserId = (localStorage.getItem("user_id") || "").trim().toLowerCase();
const userId = userIdParam || localUserId;
const currentUser = localUserId;
const visitingUser = userIdParam;
const fromAllProducts = document.referrer.includes("all_products");
const isVisitor = (visitingUser && visitingUser !== currentUser) || fromAllProducts;
let currentProductId = null;
document.addEventListener("DOMContentLoaded", () => {
 
 
  loadStoreInfo();
  loadProducts(); // موجودة مسبقاً
  console.log("✅ userId:", userId);

  updateContent(); // للترجمة
    // ✅ تحديث شارة التعليقات فقط إذا لم يكن زائر
    if (!isVisitor) {
      updateCommentBadge();
      setInterval(updateCommentBadge, 60000); // كل 60 ثانية
    }
  
});

// ✅ تهيئة i18next قبل أي شيء
i18next
  .use(i18nextHttpBackend)
  .init({
    lng: localStorage.getItem("lang") || "ar",
    backend: {
      loadPath: '/static/locales/{{lng}}/translation.json'
    }
  }, function(err, t) {
    document.dispatchEvent(new Event("i18nReady")); // إشارة بأن الترجمة جاهزة
  });

// ✅ جميع الوظائف التالية تبقى بدون تغيير

function copyPost(text) {
  const tempInput = document.createElement('textarea');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
  alert(i18next.t("copy_success"));
}

function shareFacebook(text) {
  const url = `https://www.facebook.com/sharer/sharer.php?u=&quote=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function shareInstagram(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert(i18next.t("paste_instruction"));
  });
}

function goToUpload() {
  window.location.href = 'upload.html';
}

function goToManageTabs() {
  window.location.href = 'manage_tabs.html';
}

function openPopup(imageSrc) {
  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.top = '0';
  popup.style.left = '0';
  popup.style.width = '100%';
  popup.style.height = '100%';
  popup.style.background = 'rgba(0,0,0,0.7)';
  popup.style.display = 'flex';
  popup.style.justifyContent = 'center';
  popup.style.alignItems = 'center';
  popup.style.zIndex = '10000';
  popup.innerHTML = `<img src="${imageSrc}" style="max-width: 90%; max-height: 90%; border-radius: 10px;">`;
  popup.onclick = () => popup.remove();
  document.body.appendChild(popup);
}

function deleteProduct(productId) {
  if (!confirm(i18next.t("delete_confirm"))) return;

  fetch(`${BASE_URL}/delete-product/${productId}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(data => {
      alert(i18next.t("delete_success"));
      location.reload();
    })
    .catch(err => {
      alert(i18next.t("delete_error"));
      console.error(err);
    });
}

// ✅ Firebase Push Notifications
async function importFirebaseMessaging(userId) {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const { getMessaging, getToken, onMessage } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js");

  const firebaseConfig = {
    apiKey: "AIzaSyDnmeJiICl_j7UJ0d1xfKsA7KmizVe_QxA",
    authDomain: "offer-me-c0c4b.firebaseapp.com",
    projectId: "offer-me-c0c4b",
    storageBucket: "offer-me-c0c4b.firebasestorage.app",
    messagingSenderId: "413164622012",
    appId: "1:413164622012:web:91cd8b7c24e9a0353100b9",
    measurementId: "G-N37ZR1W8GD"
  };

  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // ✅ تسجيل service worker الصحيح
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  getToken(messaging, {
    vapidKey: 'BHsTG0e2m4UdrvrUuVKuHGwpbVya0g4F5NtF1EE8vnykR889YDHVLRu2z0t9gohDEkCj4UeDrfEUW7RBFpi4Nb8',
    serviceWorkerRegistration: registration  // ✅ هذا السطر هو المهم
  })
  

  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      getToken(messaging, {
        vapidKey: 'BHsTG0e2m4UdrvrUuVKuHGwpbVya0g4F5NtF1EE8vnykR889YDHVLRu2z0t9gohDEkCj4UeDrfEUW7RBFpi4Nb8',
        serviceWorkerRegistration: registration
      }).then(currentToken => {
        if (currentToken) {
          fetch(`${BASE_URL}/save-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              token: currentToken
            })
          });
        } else {
          console.warn('⚠️ لم يتم الحصول على التوكن');
        }
      }).catch(err => {
        console.error('❌ فشل getToken():', err);
      });
    } else {
      console.warn("🚫 المستخدم رفض الإذن");
    }
  });

  onMessage(messaging, (payload) => {
    alert(payload.notification.title + "\n" + payload.notification.body);
  });
}
function loadComments(productId) {
  fetch(`${BASE_URL}/comments/${productId}`)
    .then(res => res.json())
    .then(comments => {
      const container = document.getElementById(`comments-${productId}`);
      if (!container) return;
      if (!comments.length) {
        container.innerHTML = "<p>لا يوجد تعليقات.</p>";
      } else {
        container.innerHTML = comments.map(c => `<p style="background:#f9f9f9;padding:6px;border-radius:6px;margin-bottom:6px;">💬 ${c}</p>`).join("");
      }
    });
}

function loadStoreInfo() {
  const storeTitle = document.getElementById('storeOwnerDisplay');

  fetch(`${BASE_URL}/settings/${userId}`)
    .then(res => res.json())
    .then(data => {
      const currentUserId = localStorage.getItem("user_id");
      if (data.full_name) {
        storeTitle.innerHTML = data.full_name;
        if (userId === localStorage.getItem("user_id")) {
          localStorage.setItem('full_name', data.full_name); // فقط احفظه إذا هو المستخدم الحالي
        }
      } else {
        storeTitle.innerHTML = userId;
      }

      if (data.logo) {
        const logoImg = document.getElementById('storeLogo');
        logoImg.src = `${BASE_URL}${data.logo}?t=${Date.now()}`;
        logoImg.style.display = 'inline';
      }
    });

}
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

function goToUpload() { window.location.href = 'upload.html'; }
function goToManageTabs() { window.location.href = 'manage_tabs.html'; }
function expandPost(id, link) {
  const postDiv = document.getElementById('post-' + id);
  postDiv.classList.toggle('expanded');
  const key = postDiv.classList.contains('expanded') ? "see_less" : "see_more";
  link.textContent = i18next.t(key);
}
function goBackToProducts() {
  if (document.referrer.includes("all_products")) {
    window.history.back();
  } else {
    window.location.href = "all_products";
  }
}

function openMediaModal(mediaUrl, isVideo) {
  const modal = document.getElementById('mediaModal');
  const content = document.getElementById('mediaContent');
  content.innerHTML = isVideo ?
    `<video src="${mediaUrl}" autoplay controls playsinline style="max-width: 80vw; max-height: 60vh; border-radius: 10px;"></video>` :
    `<img src="${mediaUrl}" style="max-width: 80vw; max-height: 60vh; border-radius: 10px;">`;
  modal.style.display = 'flex';
}
function closeMediaModal() {
  document.getElementById('mediaModal').style.display = 'none';
  document.getElementById('mediaContent').innerHTML = '';
}

async function loadProducts() {
  console.log("🚀 دالة loadProducts بدأت");
  console.log("🔍 Local userId:", userId);

  const container = document.getElementById('productsContainer');
  container.innerHTML = '';
  const highlightId = urlParams.get("highlight");
  const isOwner = !urlParams.get("user_id") || urlParams.get("user_id").toLowerCase() === (localStorage.getItem("user_id") || "").toLowerCase();

try {
    const response = await fetch(`${BASE_URL}/products`);
    const products = await response.json();
    console.log("📋 المنتجات المستلمة:", products);
    products.forEach(p => console.log(`🧾 منتج: ${p.name} | user_id: ${p.user_id}`));

    let filtered = [];
    const normalizedUserId = (userId || '').trim().toLowerCase();

    if (highlightId) {
      const target = products.find(p => p.id === highlightId);
      if (target) {
        const targetUserId = (target.user_id || '').trim().toLowerCase();
        const otherUserProducts = products.filter(p =>
          (p.user_id || '').trim().toLowerCase() === targetUserId && p.id !== highlightId
        );
        filtered = [target, ...otherUserProducts];
      } else {
        console.warn("⚠️ لم يتم العثور على المنتج المطلوب، عرض منتجات المستخدم فقط");
        filtered = products.filter(p =>
          (p.user_id || '').trim().toLowerCase() === normalizedUserId
        );
      }
    } else {
      filtered = products.filter(p =>
        (p.user_id || '').trim().toLowerCase() === normalizedUserId
      );
    }

    if (!filtered.length) {
      container.innerHTML = '<p style="text-align:center; color:#777; margin-top:30px">لا يوجد منتجات مضافة حالياً.</p>';
      return;
    }

filtered.forEach(product => {
      const isCurrentOwner = (product.user_id || '').trim().toLowerCase() === currentUser;

      const highlightedComment = urlParams.get("comment");
     

      if (!isCurrentOwner && !highlightId) {
        console.log("🚫 زائر بدون highlight، تجاهل المنتج:", product.name);
        return;
      }
      
      const card = document.createElement('div');
      card.className = 'product-card';
      console.log("🎯 عرض المنتج:", product.name);

      const post = product.post?.trim() || "";
      const safePost = post.replace(/`/g, "\\`").replace(/'/g, "\\'").replace(/\n/g, "<br>").replace(/"/g, '&quot;');
      const postHTML = post
        ? `<div class="product-ai-post" id="post-${product.id}">${post}</div>
           <span class="see-more" onclick="expandPost('${product.id}', this)" data-i18n="see_more">عرض المزيد</span>`
        : "";

      const commentPreview = highlightedComment
        ? `<div style="background:#fff8dc; padding:10px; border:1px solid #ffd700; border-radius:6px; margin:10px 0;">
             📌 <strong>تعليق تم النقر عليه:</strong> ${highlightedComment}
           </div>`
        : "";

      const isVideo = /\.(mp4|mov|webm)$/i.test(product.image);
      const media = isVideo
        ? `<div style="position:relative;">
             <video src="${product.image}#t=1" preload="metadata" muted playsinline
               style="width: 100%; max-height: 350px; object-fit: cover; border-radius: 8px; cursor: pointer;"
               onclick="event.stopPropagation(); openMediaModal('${product.image}', true)"></video>
             <div style="position:absolute; top:8px; right:8px; background:#000a; color:#fff; padding:4px 6px; border-radius:4px; font-size:12px;">🎥 فيديو</div>
           </div>`
        : `<img src="${product.image}" alt="${product.name}" style="border-radius:8px; cursor:pointer;" onclick="openMediaModal('${product.image}', false)">`;

      card.innerHTML = `
        <div style="background:#ffffff; padding:0 16px 12px">
          ${postHTML}
          ${commentPreview}
        </div>
        ${media}
        <div class="product-card-content">
          <h3>${product.name} ${product.price ? `- ${product.price} ر.ق` : ''}</h3>
          <p class="product-description">${product.description}</p>
          <div class="action-bar">
  <button class="action-btn copy-btn" data-post="${safePost}">
    📋<span>نسخ</span>
  </button>
  <button class="action-btn" onclick="event.stopPropagation(); sharePost(\`${safePost}\`)">
    🔗<span>مشاركة</span>
  </button>
  ${isCurrentOwner && !highlightId ? `

    <button class="action-btn" onclick="event.stopPropagation(); deleteProduct('${product.id}')">
      🗑️<span>حذف</span>
    </button>
    <button class="action-btn" onclick="event.stopPropagation(); pinProduct('${product.id}')">
      📌<span>تثبيت</span>
    </button>
  ` : ''}
  <button class="action-btn" onclick="viewCommentsPopup('${product.id}')">
         💬<span>تعليقات</span>
         </button>
         <button class="action-btn" onclick="likeProduct('${product.id}')">
         ❤️<span id="likes-${product.id}">0</span>
        </button>
        </div>

        </div>
        <div id="comments-${product.id}" style="margin-top: 10px;"></div>
    

      `;

      container.appendChild(card);
      

setTimeout(() => loadLikes(product.id), 200);

    });

    updateContent();

  } catch (err) {
    container.innerHTML = '<p style="color:red; text-align:center;">❌ فشل في تحميل المنتجات.</p>';
    console.error("🚫 خطأ في التحميل:", err);
  }
}
function submitPopupComment() {
  const input = document.getElementById('newComment');
  const comment = input.value.trim();
  if (!comment) return alert("❌ يرجى كتابة تعليق أولاً");

  const commentsList = document.getElementById('commentsList');
  const tempComment = document.createElement('p');
  tempComment.textContent = '• ' + comment;
  tempComment.style.opacity = '0.5';
  commentsList.appendChild(tempComment);

  input.value = '';

  fetch(`${BASE_URL}/add_comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: currentProductId, comment: comment })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      tempComment.style.opacity = '1';
    } else {
      commentsList.removeChild(tempComment);
      alert("❌ فشل إرسال التعليق");
    }
  })
  .catch(err => {
    commentsList.removeChild(tempComment);
    alert("❌ خطأ في إرسال التعليق");
    console.error(err);
  });
}

function viewCommentsPopup(productId) {
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
          p.textContent = '• ' + (typeof comment === 'object' ? comment.comment : comment);
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
}


document.addEventListener("click", function(e) {
  if (e.target.classList.contains("copy-btn")) {
    const text = e.target.getAttribute("data-post") || "";
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        alert(i18next.t("copy_success"));
      } else {
        alert(i18next.t("copy_error"));
      }
    } catch (err) {
      alert(i18next.t("copy_error"));
    }
    document.body.removeChild(textarea);
  }
});


function sharePost(text) {
  const url = encodeURIComponent(window.location.href);
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(text)}`;
  window.open(shareUrl, '_blank');
}
function openServiceRequestForm() {
  document.getElementById('serviceRequestModal').style.display = 'flex';
}
function closeServiceRequestForm() {
  document.getElementById('serviceRequestModal').style.display = 'none';
}
async function submitServiceRequest() {
  const type = document.getElementById('serviceType').value;
  const desc = document.getElementById('serviceDescription').value;
  if (!type || !desc) return alert("يرجى تعبئة جميع الحقول");

  const full_name = localStorage.getItem("full_name") || "غير معروف";
  const user_id = localStorage.getItem("user_id") || "غير معروف";

  const data = {
    user_id: user_id,
    full_name: full_name,
    type: type,
    desc: desc
  };

  const res = await fetch(`${BASE_URL}/submit-service-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  if (result.status === 'success') {
    alert("✅ تم إرسال الطلب بنجاح");
    closeServiceRequestForm();
  } else {
    alert("❌ حدث خطأ أثناء الإرسال");
  }
}

async function deleteProduct(id) {
  if (!confirm(i18next.t("delete_confirm"))) return;

  const res = await fetch(`${BASE_URL}/delete-product/${id}`, { method: 'DELETE' });
  const result = await res.json();

  if (result.status === 'success') {
    alert(i18next.t("delete_success"));
    loadProducts(); // أو location.reload() حسب الحاجة
  }
}


async function pinProduct(id) {
  if (!confirm(i18next.t("pin_confirm"))) return;
  const res = await fetch(`${BASE_URL}/pin-product/${id}`, { method: 'POST' });
  const result = await res.json();
  if (result.status === 'success') loadProducts();
}


function likeProduct(productId) {
  fetch(`${BASE_URL}/like/${productId}`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      document.getElementById(`likes-${productId}`).textContent = data.likes;
    });
}

window.addEventListener('DOMContentLoaded', () => {
  const highlightId = urlParams.get("highlight");
  if (!userId) return window.location.href = 'login.html';

  const currentUser = (localStorage.getItem("user_id") || "").toLowerCase();
  const visitingUser = (urlParams.get("user_id") || "").toLowerCase();
  

  // ✅ إذا الزائر داخل من صفحة all_products وفيه highlight
  if (highlightId && isVisitor) {
    const footer = document.querySelector('.bottom-nav');
    if (footer) footer.style.display = 'none';

    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
      const text = btn.textContent.trim();
      if (["حذف", "تثبيت", "إدارة", "رفع", "خدمة"].some(label => text.includes(label))) {
        btn.style.display = 'none';
      }
    });
  }

  // ✅ إذا الزائر بشكل عام (مش صاحب الحساب)
  if (isVisitor) {
    const elementsToHide = [
      '.bottom-nav',
      '.store-actions',
      '[onclick="goToUpload()"]',
      '[onclick="goToManageTabs()"]',
      '.logout-btn'
    ];
    elementsToHide.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) el.style.display = 'none';
    });
  }

  // ✅ إذا فيه تعليق مميز highlight
  if (highlightId) {
    const commentSection = document.getElementById('commentSection');
    if (commentSection) commentSection.style.display = 'block';
  }

  updateContent();
});



function loadLikes(productId) {
  fetch(`${BASE_URL}/likes/${productId}`)
    .then(res => res.json())
    .then(data => {
      const likesSpan = document.getElementById(`likes-${productId}`);
      if (likesSpan) {
        likesSpan.textContent = data.likes || 0;
      }
    });
}
function loadComments(productId) {
  fetch(`${BASE_URL}/comments/${productId}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById(`comments-${productId}`);
      if (!container) return;
      container.innerHTML = '';

      data.forEach(comment => {
        const div = document.createElement('div');
        div.style = 'background:#f1f1f1;padding:8px;margin-bottom:6px;border-radius:6px;';
        div.textContent = `💬 ${comment}`;
        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error('❌ فشل في تحميل التعليقات:', err);
    });
}

function requestNotificationPermission() {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      importFirebaseMessaging(userId); // لازم تكون الدالة موجودة في store.js
    } else {
      alert("❌ لم يتم السماح بالإشعارات");
    }
  });
}

  // ✅ تسجيل Service Worker للإشعارات
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(reg => console.log('✅ Service Worker تم تسجيله بنجاح:', reg.scope))
      .catch(err => console.error('❌ فشل في تسجيل Service Worker:', err));
  }
  async function updateCommentBadge() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
  
    try {
      const res = await fetch(`${BASE_URL}/user-comments/${userId}`);
      const comments = await res.json();
      const badge = document.getElementById('commentCountBadge');
  
      // ✅ عد فقط التعليقات غير المقروءة
      const unreadCount = comments.filter(c => !c.comment.read).length;
  
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    } catch (e) {
      console.error('❌ فشل جلب التعليقات:', e);
    }
  }
  
 