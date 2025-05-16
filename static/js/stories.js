document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("user_id");

  fetch(`/user-videos/${userId}`)
    .then(res => res.json())
    .then(videos => {
      console.log("📹 الفيديوهات المستلمة:", videos);
      const container = document.getElementById('videoContainer');

      if (videos.length === 0) {
        container.innerHTML = "<p style='color:red; text-align:center;'>❌ لا توجد فيديوهات لهذا المستخدم</p>";
        return;
      }

      videos.forEach(video => {
  const storyWrapper = document.createElement('div');
  storyWrapper.classList.add('story-wrapper');

  const logo = document.createElement('img');
  logo.classList.add('story-logo');
  logo.alt = 'شعار الزبون';

  // تحميل الشعار من إعدادات الزبون
  fetch(`/settings/${userId}`)
    .then(res => res.json())
    .then(settings => {
      logo.src = settings.logo || '/static/img/default_logo.png';
    });

  const vid = document.createElement('video');
  vid.src = `/${video.filename}`;
  vid.setAttribute('playsinline', '');
  vid.setAttribute('muted', 'true');
  vid.setAttribute('loop', 'true');
  vid.setAttribute('autoplay', 'true');
  vid.controls = false;

  storyWrapper.appendChild(logo);
  storyWrapper.appendChild(vid);
  container.appendChild(storyWrapper);
});


      // مراقبة أي فيديو يدخل الشاشة لتشغيله، وإيقاف البقية
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.play();
          } else {
            entry.target.pause();
          }
        });
      }, { threshold: 0.8 });

      document.querySelectorAll('video').forEach(video => observer.observe(video));
    })
    .catch(error => {
      console.error("❌ خطأ أثناء تحميل الفيديوهات:", error);
    });
});
document.addEventListener("click", () => {
  document.querySelectorAll('video').forEach(video => {
    video.muted = false;
  });
}, { once: true }); // ⬅️ فقط أول نقرة
