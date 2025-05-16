// ✅ إزالة اللغة المحفوظة لإجبار الصفحة على البدء بالعربية دائماً عند أول تحميل
if (!localStorage.getItem("lang")) {
  localStorage.setItem("lang", "ar");
}

i18next
  .use(i18nextHttpBackend)
  .init({
    lng: localStorage.getItem("lang") || "ar",   // ✅ اللغة الافتراضية
    fallbackLng: "ar",                           // ✅ في حال وجود خطأ في تحميل الترجمة
    backend: {
      loadPath: '/static/locales/{{lng}}/translation.json' // ✅ مسار ملفات الترجمة
    }
  }, function(err, t) {
    document.dispatchEvent(new Event("i18nReady"));
    updateContent();  // ✅ تحديث المحتوى مباشرة بعد تحميل الترجمة
  });

function updateContent() {
  // تحديث النصوص حسب خاصية data-i18n
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    elem.innerHTML = i18next.t(key);
  });

  // تحديث placeholder للنصوص
  document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-placeholder');
    elem.setAttribute('placeholder', i18next.t(key));
  });

  // تغيير نص زر اللغة
  const langBtn = document.getElementById('langBtn');
  if (langBtn) {
    langBtn.textContent = i18next.language === 'ar' ? '🌍 English' : '🌍 العربية';
  }

  // تحديث اتجاه الصفحة حسب اللغة
  document.documentElement.lang = i18next.language;
  document.documentElement.dir = i18next.language === 'ar' ? 'rtl' : 'ltr';
}

function toggleLanguage() {
  const currentLang = i18next.language;
  const newLang = currentLang === "ar" ? "en" : "ar";
  localStorage.setItem("lang", newLang);
  i18next.changeLanguage(newLang, updateContent);
}
