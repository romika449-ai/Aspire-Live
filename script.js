// ============================================================
// 🔴 यहाँ अपना .m3u8 लिंक डालें
// ============================================================
const DEFAULT_VIDEO_URL = "https://vs.classplusapp.com/hls/6a6d962e1b8a64aaa73b48ad/index.m3u8";

let hls = null;
let currentUrl = DEFAULT_VIDEO_URL;
const video = document.getElementById('videoPlayer');
const viewerCountEl = document.getElementById('viewerCount');
const errorMsg = document.getElementById('errorMsg');
const liveBtn = document.getElementById('liveBtn');
const resBtns = document.querySelectorAll('.res-btn');

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
// 🔴 लाइव बटन पर क्लिक → DEFAULT लिंक लोड करें
// ============================================================
liveBtn.addEventListener('click', function() {
  if (DEFAULT_VIDEO_URL && DEFAULT_VIDEO_URL !== "https://example.com/stream.m3u8") {
    loadVideo(DEFAULT_VIDEO_URL);
    // सभी रेज़ोल्यूशन बटन से active हटाएँ
    resBtns.forEach(function(btn) {
      btn.classList.remove('active');
    });
    // Auto को active करें
    document.querySelector('.res-btn[data-res="auto"]').classList.add('active');
  } else {
    errorMsg.textContent = "❌ DEFAULT_VIDEO_URL सेट नहीं है।";
    errorMsg.classList.add('show');
  }
});

// ============================================================
// 🎛️ रेज़ोल्यूशन बटन पर क्लिक (सिर्फ UI — वास्तविक रेज़ोल्यूशन बदलना .m3u8 लिंक पर निर्भर)
// ============================================================
resBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    // सभी से active हटाएँ
    resBtns.forEach(function(b) {
      b.classList.remove('active');
    });
    // इस बटन को active करें
    this.classList.add('active');

    // 📌 नोट: असली रेज़ोल्यूशन बदलने के लिए अलग-अलग .m3u8 लिंक चाहिए
    // यहाँ सिर्फ UI दिख रहा है। असली रेज़ोल्यूशन बदलने के लिए
    // अलग-अलग क्वालिटी के .m3u8 लिंक डालने होंगे।
    const res = this.getAttribute('data-res');
    console.log('रेज़ोल्यूशन चुना:', res);
    
    // ⚠️ अगर आपके पास अलग-अलग क्वालिटी के लिंक हैं, तो यहाँ loadVideo(link) करें
    // उदाहरण:
    // if (res === '1080') loadVideo('https://example.com/1080p.m3u8');
    // else if (res === '720') loadVideo('https://example.com/720p.m3u8');
    // else loadVideo(DEFAULT_VIDEO_URL);
  });
});

// ============================================================
// 🚀 पेज खुलते ही DEFAULT लिंक लोड करें
// ============================================================
window.addEventListener('load', function() {
  if (DEFAULT_VIDEO_URL && DEFAULT_VIDEO_URL !== "https://example.com/stream.m3u8") {
    loadVideo(DEFAULT_VIDEO_URL);
  } else {
    errorMsg.textContent = "❌ कृपया script.js में DEFAULT_VIDEO_URL में .m3u8 लिंक डालें।";
    errorMsg.classList.add('show');
  }
});
