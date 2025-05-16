document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  loadBusinessTypes(); // 🔄 تحميل أنواع النشاط من ملف خارجي

  document.getElementById("userForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("newUsername").value.trim();
    const fullName = document.getElementById("newFullname").value.trim();
    const password = document.getElementById("newPassword").value.trim();

    const businessTypeSelect = document.getElementById("businessType");
    let business_type = businessTypeSelect.value;
    const customBusinessType = document.getElementById("customBusinessType").value.trim();

    if (business_type === "أخرى" && customBusinessType) {
      business_type = customBusinessType;
    }

    if (!username || !fullName || !password) {
      alert("الرجاء ملء جميع الحقول");
      return;
    }

    try {
      const response = await fetch("/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          full_name: fullName,
          password,
          business_type
        })
      }); // ✅ ← أُغلِق القوس الناقص هون

      const result = await response.json();
      if (result.status === "success") {
        alert("✅ تم إضافة المستخدم بنجاح");
        document.getElementById("userForm").reset();
        loadUsers();
      } else {
        alert("❌ فشل: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("❌ حدث خطأ أثناء الإضافة");
    }
  });
});

async function loadUsers() {
  try {
    const res = await fetch("/users");
    const users = await res.json();
    const container = document.getElementById("usersList");
    container.innerHTML = "";

    users.forEach((user) => {
      if (user.username === "admin") return; // ✅ تجاهل عرض الأدمن
      const row = document.createElement("div");
      row.className = "user-row";
      row.innerHTML = `
        <span>${user.full_name} <small style="color:gray;">(${user.username})</small></span>
        <button class="delete-btn" onclick="deleteUser('${user.username}')">🗑 حذف</button>
      `;
      container.appendChild(row);
    });
  } catch (err) {
    console.error("فشل في تحميل المستخدمين", err);
  }
}

async function deleteUser(user_id) {
  if (!confirm("هل أنت متأكد أنك تريد حذف هذا المستخدم؟")) return;

  try {
    const res = await fetch(`/delete-user/${user_id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.status === "success") {
      alert("✅ تم حذف المستخدم");
      loadUsers();
    } else {
      alert("❌ فشل الحذف");
    }
  } catch (err) {
    console.error(err);
    alert("❌ فشل الاتصال بالخادم");
  }
}

async function loadBusinessTypes() {
  try {
    const res = await fetch("/business-types");
    const types = await res.json();
    const select = document.getElementById("businessType");

    select.innerHTML = `<option value="">اختر نوع النشاط</option>`;
    types.forEach(type => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      select.appendChild(option);
    });

    select.addEventListener('change', function () {
      const customInput = document.getElementById('customBusinessType');
      customInput.style.display = this.value === 'أخرى' ? 'block' : 'none';
    });

  } catch (err) {
    console.error("فشل في تحميل قائمة الأنشطة", err);
  }
}
