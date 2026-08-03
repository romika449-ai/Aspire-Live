// ============================================================
// 🔴 आपका .m3u8 लिंक (ClassPlus)
// ============================================================
const DEFAULT_VIDEO_URL = "https://vs.classplusapp.com/hls/6a6d962e1b8a64aaa73b48ad/index.m3u8";

let hls = null;
const video = document.getElementById('videoPlayer');
const viewerCountEl = document.getElementById('viewerCount');
const errorMsg = document.getElementById('errorMsg');
const refreshBtn = document.getElementById('refreshLiveBtn');

// ============================================================
// 👁️ लाइव व्यूअर काउंट (सिम्युलेटेड)
// ============================================================
function startViewerCounter() {
  let count = Math.floor(Math.random() * 40) + 12;
  viewerCountEl.textContent = count;

  setInterval(() => {
    let change = Math.floor(Math.random() * 7) - 3;
    let newCount = parseInt(viewerCountEl.textContent) + change;
    if (newCount < 5) newCount = 5 + Math.floor(Math.random() * 10);
    if (newCount > 150) newCount = 120 + Math.floor(Math.random() * 30);
    viewerCountEl.textContent = newCount;
  }, 7000);
}
startViewerCounter();

// ============================================================
// 🎬 वीडियो लोड करने का फंक्शन
// ============================================================
function loadVideo(url) {
  if (!url) return;

  errorMsg.classList.remove('show');

  // पुराना HLS डिस्ट्रॉय करें
  if (hls) {
    hls.destroy();
    hls = null;
  }

  // Safari / iOS (Native HLS)
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.play().catch(function(e) {
      console.warn('Autoplay blocked:', e);
    });
    return;
  }

  // बाकी ब्राउज़र (hls.js)
  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      maxBufferLength: 30
    });

    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      video.play().catch(function(e) {
        console.warn('Autoplay blocked:', e);
      });
    });

    hls.on(Hls.Events.ERROR, function(event, data) {
      if (data.fatal) {
        errorMsg.classList.add('show');
      }
    });
  } else {
    errorMsg.textContent = "❌ आपका ब्राउज़र HLS सपोर्ट नहीं करता।";
    errorMsg.classList.add('show');
  }
}

// ============================================================
// 🔄 लाइव बटन पर क्लिक → वीडियो रिफ्रेश हो जाए
// ============================================================
refreshBtn.addEventListener('click', function() {
  if (DEFAULT_VIDEO_URL) {
    // पुराना वीडियो रुके
    video.pause();
    
    // नया लोड करें (रिफ्रेश)
    loadVideo(DEFAULT_VIDEO_URL);
    
    // बटन पर थोड़ा एनिमेशन दिखाएँ
    this.style.transform = 'translateY(-50%) scale(0.95)';
    setTimeout(() => {
      this.style.transform = 'translateY(-50%) scale(1)';
    }, 200);
  } else {
    errorMsg.textContent = "❌ DEFAULT_VIDEO_URL सेट नहीं है।";
    errorMsg.classList.add('show');
  }
});

// ============================================================
// 🚀 पेज खुलते ही DEFAULT लिंक लोड करें
// ============================================================
window.addEventListener('load', function() {
  if (DEFAULT_VIDEO_URL) {
    loadVideo(DEFAULT_VIDEO_URL);
  } else {
    errorMsg.textContent = "❌ कृपया script.js में DEFAULT_VIDEO_URL में .m3u8 लिंक डालें।";
    errorMsg.classList.add('show');
  }
});
