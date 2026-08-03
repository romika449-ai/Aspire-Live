// ============================================================
// 🔴 आपका .m3u8 लिंक (ClassPlus)
// ============================================================
const DEFAULT_VIDEO_URL = "https://vs.classplusapp.com/hls/6a6d962e1b8a64aaa73b48ad/index.m3u8";

// अलग-अलग क्वालिटी के लिंक (अगर उपलब्ध हों तो डालें, नहीं तो सभी में DEFAULT डाल दें)
const QUALITY_LINKS = {
  auto: DEFAULT_VIDEO_URL,
  '1080': DEFAULT_VIDEO_URL,   // अगर अलग लिंक है तो बदलें
  '720': DEFAULT_VIDEO_URL,    // अगर अलग लिंक है तो बदलें
  '480': DEFAULT_VIDEO_URL,    // अगर अलग लिंक है तो बदलें
  '360': DEFAULT_VIDEO_URL     // अगर अलग लिंक है तो बदलें
};

let hls = null;
let currentQuality = 'auto';
const video = document.getElementById('videoPlayer');
const viewerCountEl = document.getElementById('viewerCount');
const errorMsg = document.getElementById('errorMsg');
const liveBtn = document.getElementById('liveBtn');

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
  if (DEFAULT_VIDEO_URL) {
    currentQuality = 'auto';
    updateResolutionButton('auto');
    loadVideo(DEFAULT_VIDEO_URL);
  } else {
    errorMsg.textContent = "❌ DEFAULT_VIDEO_URL सेट नहीं है।";
    errorMsg.classList.add('show');
  }
});

// ============================================================
// 🎛️ रेज़ोल्यूशन कंट्रोल (प्लेयर के अंदर)
// ============================================================

// रेज़ोल्यूशन बटन और मेनू बनाएँ
function createResolutionControls() {
  const wrapper = document.querySelector('.video-wrapper');
  
  // रेज़ोल्यूशन बटन
  const resBtn = document.createElement('button');
  resBtn.className = 'resolution-btn';
  resBtn.id = 'resolutionBtn';
  resBtn.innerHTML = '⚙️ ऑटो <span class="arrow">▼</span>';
  wrapper.appendChild(resBtn);

  // ड्रॉपडाउन मेनू
  const menu = document.createElement('div');
  menu.className = 'resolution-menu';
  menu.id = 'resolutionMenu';
  
  const qualities = [
    { label: 'ऑटो (Auto)', value: 'auto' },
    { label: '1080p', value: '1080' },
    { label: '720p', value: '720' },
    { label: '480p', value: '480' },
    { label: '360p', value: '360' }
  ];

  qualities.forEach(function(q) {
    const item = document.createElement('button');
    item.className = 'res-item';
    if (q.value === 'auto') item.classList.add('active');
    item.setAttribute('data-res', q.value);
    item.textContent = q.label;
    menu.appendChild(item);
  });

  wrapper.appendChild(menu);

  // बटन क्लिक → मेनू टॉगल
  resBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    menu.classList.toggle('show');
  });

  // मेनू आइटम क्लिक → क्वालिटी बदलें
  menu.querySelectorAll('.res-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      const res = this.getAttribute('data-res');
      
      // सभी से active हटाएँ
      menu.querySelectorAll('.res-item').forEach(function(el) {
        el.classList.remove('active');
      });
      this.classList.add('active');
      
      // क्वालिटी बदलें
      changeQuality(res);
      
      // मेनू बंद करें
      menu.classList.remove('show');
    });
  });

  // बाहर क्लिक करने पर मेनू बंद हो
  document.addEventListener('click', function() {
    menu.classList.remove('show');
  });

  return { resBtn, menu };
}

// ============================================================
// 🔄 क्वालिटी बदलें
// ============================================================
function changeQuality(quality) {
  currentQuality = quality;
  
  let url;
  if (quality === 'auto') {
    url = DEFAULT_VIDEO_URL;
  } else {
    url = QUALITY_LINKS[quality] || DEFAULT_VIDEO_URL;
  }
  
  // बटन का लेबल अपडेट करें
  updateResolutionButton(quality);
  
  // वीडियो लोड करें
  if (url) {
    loadVideo(url);
  }
}

// ============================================================
// 🔄 रेज़ोल्यूशन बटन का लेबल अपडेट करें
// ============================================================
function updateResolutionButton(quality) {
  const resBtn = document.getElementById('resolutionBtn');
  if (!resBtn) return;
  
  const labels = {
    'auto': '⚙️ ऑटो',
    '1080': '⚙️ 1080p',
    '720': '⚙️ 720p',
    '480': '⚙️ 480p',
    '360': '⚙️ 360p'
  };
  
  resBtn.innerHTML = (labels[quality] || '⚙️ ऑटो') + ' <span class="arrow">▼</span>';
  
  // मेनू में active अपडेट करें
  const menu = document.getElementById('resolutionMenu');
  if (menu) {
    menu.querySelectorAll('.res-item').forEach(function(item) {
      item.classList.toggle('active', item.getAttribute('data-res') === quality);
    });
  }
}

// ============================================================
// 🚀 पेज लोड होने पर सब कुछ सेट करें
// ============================================================
window.addEventListener('load', function() {
  // रेज़ोल्यूशन कंट्रोल बनाएँ
  createResolutionControls();
  
  // DEFAULT लिंक लोड करें
  if (DEFAULT_VIDEO_URL) {
    loadVideo(DEFAULT_VIDEO_URL);
  } else {
    errorMsg.textContent = "❌ कृपया script.js में DEFAULT_VIDEO_URL में .m3u8 लिंक डालें।";
    errorMsg.classList.add('show');
  }
});
