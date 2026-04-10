let currentAudio = null;
let currentBtn = null;
let animFrame = null;

const playSVG = '<svg viewBox="0 0 24 24"><polygon points="6,3 20,12 6,21"/></svg>';
const pauseSVG = '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/></svg>';

function togglePlay(btn) {
    const src = btn.dataset.audio;
    const card = btn.closest('.showcase-item');
    const bar = card.querySelector('.player-progress-bar');

    if (currentBtn === btn && currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        btn.innerHTML = playSVG;
        btn.classList.remove('playing');
        cancelAnimationFrame(animFrame);
        return;
    }

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentBtn) {
            currentBtn.innerHTML = playSVG;
            currentBtn.classList.remove('playing');
            const oldBar = currentBtn.closest('.showcase-item').querySelector('.player-progress-bar');
            oldBar.style.width = '0%';
        }
        cancelAnimationFrame(animFrame);
    }

    if (currentBtn === btn && currentAudio) {
        currentAudio.play();
    } else {
        currentAudio = new Audio(src);
        currentAudio.play();
    }

    currentBtn = btn;
    btn.innerHTML = pauseSVG;
    btn.classList.add('playing');

    function updateProgress() {
        if (currentAudio && !currentAudio.paused) {
            const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
            bar.style.width = pct + '%';
            animFrame = requestAnimationFrame(updateProgress);
        }
    }
    updateProgress();

    currentAudio.onended = () => {
        btn.innerHTML = playSVG;
        btn.classList.remove('playing');
        bar.style.width = '0%';
        cancelAnimationFrame(animFrame);
    };
}

function toggleVersion(span) {
    const card = span.closest('.showcase-item');
    const btn = card.querySelector('.play-btn');
    const previewTag = card.querySelector('.preview-tag');
    const miniSrc = btn.dataset.audio.replace('_full.mp3', '_mini.mp3');
    const fullSrc = btn.dataset.full;
    const isActive = span.classList.toggle('active');

    if (isActive) {
        btn.dataset.audio = fullSrc;
        span.textContent = 'Back to preview';
        if (previewTag) { previewTag.textContent = 'Full'; previewTag.style.color = 'var(--accent-orange)'; previewTag.style.borderColor = 'var(--accent-orange)'; }
    } else {
        btn.dataset.audio = miniSrc;
        span.textContent = 'Listen full song';
        if (previewTag) { previewTag.textContent = 'Preview'; previewTag.style.color = ''; previewTag.style.borderColor = ''; }
    }

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentBtn) {
            currentBtn.innerHTML = playSVG;
            currentBtn.classList.remove('playing');
            const oldBar = currentBtn.closest('.showcase-item').querySelector('.player-progress-bar');
            oldBar.style.width = '0%';
        }
        cancelAnimationFrame(animFrame);
    }

    const bar = card.querySelector('.player-progress-bar');
    bar.style.width = '0%';
    currentAudio = new Audio(btn.dataset.audio);
    currentBtn = btn;
    currentAudio.play();
    btn.innerHTML = pauseSVG;
    btn.classList.add('playing');

    function updateProgress() {
        if (currentAudio && !currentAudio.paused) {
            const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
            bar.style.width = pct + '%';
            animFrame = requestAnimationFrame(updateProgress);
        }
    }
    updateProgress();
    currentAudio.onended = () => {
        btn.innerHTML = playSVG;
        btn.classList.remove('playing');
        bar.style.width = '0%';
        cancelAnimationFrame(animFrame);
    };
}

function seekAudio(event, progressEl) {
    const btn = progressEl.closest('.showcase-item').querySelector('.play-btn');
    if (!currentAudio || currentBtn !== btn) return;
    const rect = progressEl.getBoundingClientRect();
    const pct = (event.clientX - rect.left) / rect.width;
    currentAudio.currentTime = pct * currentAudio.duration;
}
