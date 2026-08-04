/**
 * ================================================================
 *  🚀 MyStream Pro - HLS Player with Custom Proxy
 *  - Uses our own backend proxy (Livepush style)
 *  - No CORS errors
 *  - Auto retry & recovery
 * ================================================================
 */

// ============================================================
// 🔴 CONFIGURATION
// ============================================================

// ⭐⭐⭐ CHANGE THIS TO YOUR PROXY SERVER URL ⭐⭐⭐
// After deploying backend, replace with your Render/Heroku URL
const PROXY_SERVER_URL = "https://your-proxy-server.onrender.com/proxy?url=";

// Default .m3u8 link
const DEFAULT_VIDEO_URL = "https://vs.classplusapp.com/hls/6a7089aae86acfbc9dbb33f5/index.m3u8";

// ============================================================
// 📦 DOM REFS
// ============================================================
const video = document.getElementById('videoPlayer');
const urlInput = document.getElementById('videoUrlInput');
const statusText = document.getElementById('statusText');
const viewerCountEl = document.getElementById('viewerCount');
const viewerCountNav = document.getElementById('viewerCountNav');
const playerInfo = document.getElementById('playerInfo');
const qualityInfo = document.getElementById('qualityInfo');
const messageEl = document.getElementById('message');
const proxyInfo = document.getElementById('proxyInfo');

// ============================================================
// 🧠 STATE
// ============================================================
let hls = null;
let retryCount = 0;
const MAX_RETRIES = 999;
let currentUrl = DEFAULT_VIDEO_URL;
let isManualLoad = false;

// ============================================================
// 👁️ VIEWER COUNTER (Simulated)
// ============================================================
function startViewerCounter() {
    let count = Math.floor(Math.random() * 50) + 15;
    updateViewerCount(count);
    setInterval(() => {
        let change = Math.floor(Math.random() * 9) - 4;
        let newCount = parseInt(viewerCountEl.textContent) + change;
        if (newCount < 5) newCount = 5 + Math.floor(Math.random() * 15);
        if (newCount > 200) newCount = 150 + Math.floor(Math.random() * 50);
        updateViewerCount(newCount);
    }, 7000);
}

function updateViewerCount(count) {
    viewerCountEl.textContent = count;
    viewerCountNav.textContent = count;
}
startViewerCounter();

// ============================================================
// 📢 MESSAGE HELPER
// ============================================================
function showMessage(msg, type) {
    messageEl.textContent = msg;
    messageEl.className = 'message show ' + (type || 'info');
    if (type === 'success' || type === 'info') {
        clearTimeout(messageEl._hideTimer);
        messageEl._hideTimer = setTimeout(() => {
            messageEl.classList.remove('show');
        }, 5000);
    }
}

function hideMessage() {
    messageEl.classList.remove('show');
    clearTimeout(messageEl._hideTimer);
}

// ============================================================
// 🎬 LOAD VIDEO — With our own Proxy (Livepush style)
// ============================================================
function loadVideo(url) {
    if (!url || url.trim() === "") {
        showMessage("❌ कृपया एक वैध .m3u8 लिंक डालें!", "error");
        return;
    }

    currentUrl = url;
    hideMessage();
    statusText.textContent = "⏳ लोड हो रहा है...";
    statusText.className = 'value';
    playerInfo.textContent = "लोड हो रहा...";
    qualityInfo.textContent = "-";

    // Update proxy info
    proxyInfo.textContent = PROXY_SERVER_URL;

    if (hls) {
        hls.destroy();
        hls = null;
    }

    // ============================================================
    // 🔥 STEP 1: PROXY URL - OUR OWN BACKEND
    // ============================================================
    const proxyUrl = PROXY_SERVER_URL + encodeURIComponent(url);
    console.log('🌐 Proxy URL:', proxyUrl);

    // ============================================================
    // SAFARI / iOS — Native HLS
    // ============================================================
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = proxyUrl;
        video.play().catch(() => {
            showMessage("⚠️ ऑटोप्ले ब्लॉक, प्ले बटन दबाएँ", "info");
        });
        statusText.textContent = "✅ चल रहा है (Native)";
        playerInfo.textContent = "Safari Native + Proxy";
        showMessage("✅ वीडियो लोड हो गया!", "success");
        return;
    }

    // ============================================================
    // hls.js — Our proxy + Custom Headers
    // ============================================================
    if (Hls.isSupported()) {
        try {
            hls = new Hls({

                // ---- PERFORMANCE ----
                enableWorker: true,
                lowLatencyMode: true,
                maxBufferLength: 60,
                maxMaxBufferLength: 120,
                maxBufferSize: 60 * 1000 * 1000,
                startFragPrefetch: true,

                // ---- LIVE STREAM ----
                liveDurationInfinity: true,
                liveMaxLatencyDurationCount: 10,
                liveSyncDurationCount: 10,

                // ---- TIMEOUT ----
                fragLoadingTimeOut: 60000,
                manifestLoadingTimeOut: 60000,
                levelLoadingTimeOut: 60000,

                // ---- ABR ----
                abrEwmaDefaultEstimate: 500000,
                abrEwmaFastLive: 3.0,
                abrEwmaSlowLive: 9.0,
                testBandwidth: true,

                // ---- 🔥 CUSTOM HEADERS (Optional) ----
                xhrSetup: function(xhr, url) {
                    // These headers help with certain CDNs
                    xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
                    xhr.setRequestHeader('Accept', '*/*');
                    console.log('📡 Headers set for:', url);
                }
            });

            // ============================================================
            // 🔥 STEP 2: LOAD VIA OUR PROXY
            // ============================================================
            hls.loadSource(proxyUrl);
            hls.attachMedia(video);

            // ============================================================
            // 🎯 EVENTS
            // ============================================================

            // --- MANIFEST PARSED ---
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                console.log('✅ MANIFEST PARSED');
                statusText.textContent = "✅ चल रहा है";
                statusText.className = 'value';
                playerInfo.textContent = "hls.js v" + Hls.version + ' 🌐Proxy';
                showMessage("✅ वीडियो लोड हो गया!", "success");
                video.play().catch(() => {
                    showMessage("⚠️ ऑटोप्ले ब्लॉक, प्ले बटन दबाएँ", "info");
                });
            });

            // --- FRAGMENT LOADED ---
            hls.on(Hls.Events.FRAG_LOADED, function() {
                statusText.textContent = "✅ चल रहा है";
                statusText.className = 'value';
                hideMessage();
            });

            // --- BUFFER STALLED ---
            hls.on(Hls.Events.BUFFER_STALLED, function() {
                console.log('🔄 BUFFER STALLED, recovering...');
                statusText.textContent = "🔄 बफर...";
                statusText.className = 'value';
                showMessage("🔄 बफर रिफ्रेश...", "info");
                setTimeout(() => {
                    if (hls) hls.startLoad();
                }, 1000);
            });

            // --- LEVEL LOADED (Quality Info) ---
            hls.on(Hls.Events.LEVEL_LOADED, function(event, data) {
                if (data && data.details) {
                    const level = data.details;
                    const height = level.height || '?';
                    const bitrate = level.averageBitrate ? (level.averageBitrate / 1000).toFixed(0) : '?';
                    qualityInfo.textContent = `${height}p @ ${bitrate}kbps`;
                }
            });

            // --- ERROR HANDLING ---
            hls.on(Hls.Events.ERROR, function(event, data) {
                console.log('⚠️ ERROR:', data.type, data.details);

                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('🔄 NETWORK ERROR, recovering...');
                            statusText.textContent = "🔄 कनेक्शन...";
                            showMessage("🔄 कनेक्शन पुनः स्थापित...", "info");
                            setTimeout(() => {
                                if (hls) hls.startLoad();
                            }, 1500);
                            break;

                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('🔄 MEDIA ERROR, recovering...');
                            statusText.textContent = "🔄 मीडिया...";
                            showMessage("🔄 मीडिया पुनः लोड...", "info");
                            setTimeout(() => {
                                if (hls) hls.recoverMediaError();
                            }, 1500);
                            break;

                        default:
                            if (retryCount < MAX_RETRIES) {
                                retryCount++;
                                console.log(`🔄 Retry ${retryCount}/${MAX_RETRIES}...`);
                                statusText.textContent = `🔄 प्रयास ${retryCount}...`;
                                showMessage(`🔄 पुनः प्रयास ${retryCount}...`, "info");
                                setTimeout(() => {
                                    loadVideo(url);
                                }, 2000);
                            } else {
                                showMessage("❌ वीडियो नहीं चल रहा। नया लिंक डालें।", "error");
                                statusText.textContent = "❌ एरर";
                                statusText.className = 'value error';
                                playerInfo.textContent = "Error";
                            }
                            break;
                    }
                } else {
                    if (data.details === 'fragLoadError' || data.details === 'fragParsingError') {
                        console.log('🔄 Fragment error, retrying...');
                        setTimeout(() => {
                            if (hls) hls.startLoad();
                        }, 1000);
                    }
                }
            });

        } catch (error) {
            console.error('❌ hls.js Error:', error);
            showMessage("❌ प्लेयर एरर: " + error.message, "error");
            statusText.textContent = "❌ एरर";
            statusText.className = 'value error';
        }

    } else {
        showMessage("❌ आपका ब्राउज़र HLS सपोर्ट नहीं करता।", "error");
        statusText.textContent = "❌ Unsupported";
        statusText.className = 'value error';
    }
}

// ============================================================
// 🔧 LOAD MANUAL LINK
// ============================================================
function loadManualLink() {
    const url = urlInput.value.trim();
    if (url) {
        isManualLoad = true;
        retryCount = 0;
        loadVideo(url);
        localStorage.setItem('savedLink', url);
        showMessage("✅ नया लिंक लोड किया जा रहा है...", "info");
    } else {
        showMessage("❌ कृपया पहले लिंक डालें!", "error");
    }
}

// ============================================================
// 🔄 RESET PLAYER
// ============================================================
function resetPlayer() {
    if (hls) {
        hls.destroy();
        hls = null;
    }
    video.pause();
    video.removeAttribute('src');
    video.load();
    statusText.textContent = "तैयार";
    statusText.className = 'value';
    playerInfo.textContent = "hls.js";
    qualityInfo.textContent = "-";
    hideMessage();
    showMessage("🔄 प्लेयर रीसेट हो गया", "info");
    console.log('🔄 Player reset');
}

// ============================================================
// ⌨️ ENTER KEY SUPPORT
// ============================================================
urlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loadManualLink();
    }
});

// ============================================================
// 🚀 PAGE LOAD — DEFAULT LINK
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Show proxy info
    proxyInfo.textContent = PROXY_SERVER_URL;

    const savedLink = localStorage.getItem('savedLink');
    let linkToLoad = DEFAULT_VIDEO_URL;

    if (savedLink && savedLink !== "null" && savedLink !== "") {
        linkToLoad = savedLink;
        urlInput.value = savedLink;
    } else {
        urlInput.value = DEFAULT_VIDEO_URL;
    }

    if (linkToLoad && linkToLoad !== "https://example.com/stream.m3u8") {
        loadVideo(linkToLoad);
    } else {
        showMessage("❌ DEFAULT_VIDEO_URL में .m3u8 लिंक डालें।", "error");
        statusText.textContent = "❌ कोई लिंक नहीं";
        statusText.className = 'value error';
    }

    if (typeof Hls !== 'undefined' && Hls.version) {
        console.log('📦 hls.js v' + Hls.version);
    }

    console.log('✅ MyStream Pro initialized!');
    console.log('📺 Default Link:', DEFAULT_VIDEO_URL);
    console.log('🌐 Proxy Server:', PROXY_SERVER_URL);
    console.log('💡 Livepush-style player with custom proxy! 🚀');
});

// ============================================================
// 🔄 AUTO-RETRY — Video Stall Recovery
// ============================================================
setInterval(function() {
    if (!video) return;

    if (video.paused && video.currentTime > 0 && !video.ended && video.readyState < 2 && !isManualLoad) {
        console.log('🔄 Video stalled, reloading...');
        statusText.textContent = "🔄 रिलोड...";
        showMessage("🔄 वीडियो पुनः लोड...", "info");
        const src = localStorage.getItem('savedLink') || DEFAULT_VIDEO_URL;
        if (src) loadVideo(src);
    }

    if (video.buffered.length > 0 && !video.paused && !isManualLoad) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const currentTime = video.currentTime;
        if (bufferedEnd - currentTime < 2 && video.readyState < 3) {
            console.log('🔄 Buffer low, refreshing...');
            statusText.textContent = "🔄 बफर...";
            const src = localStorage.getItem('savedLink') || DEFAULT_VIDEO_URL;
            if (src) loadVideo(src);
        }
    }
}, 5000);
