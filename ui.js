import { formatTime } from './utils.js';

export const uiMethods = {
    updateProgress(p) {
        const percent = p * 100;
        this.els.progressFill.style.width = percent + '%';
        this.els.progressThumb.style.left = percent + '%';
    },

    startProgressDrag(e) {
        e.preventDefault();
        this.isDraggingProgress = true;
        this.updateProgressFromEvent(e);
    },

    startVolumeDrag(e) {
        e.preventDefault();
        this.isDraggingVolume = true;
        this.updateVolumeFromEvent(e);
    },

    onDrag(e) {
        if (this.isDraggingProgress) {
            e.preventDefault();
            this.updateProgressFromEvent(e);
        }
        if (this.isDraggingVolume) {
            e.preventDefault();
            this.updateVolumeFromEvent(e);
        }
    },

    onDragEnd() {
        this.isDraggingProgress = false;
        this.isDraggingVolume = false;
    },

    updateProgressFromEvent(e) {
        const rect = this.els.progressBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let p = (clientX - rect.left) / rect.width;
        p = Math.max(0, Math.min(1, p));
        this.updateProgress(p);
        if (this.audio.duration) {
            this.audio.currentTime = p * this.audio.duration;
            this.els.currentTime.textContent = formatTime(this.audio.currentTime);
        }
    },

    updateVolumeFromEvent(e) {
        const rect = this.els.volumeBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let v = (clientX - rect.left) / rect.width;
        v = Math.max(0, Math.min(1, v));
        this.updateVolume(v);
    },

    updateVolume(v) {
        v = Math.max(0, Math.min(1, v));
        this.volume = v;
        this.audio.volume = v;
        this.els.volumeFill.style.width = (v * 100) + '%';
        this.els.volumeThumb.style.left = (v * 100) + '%';
        this.els.volumeValue.textContent = Math.round(v * 100) + '%';
        if (this.isMuted && v > 0) {
            this.isMuted = false;
            this.audio.muted = false;
            this.els.iconVolume.style.display = 'block';
            this.els.iconMuted.style.display = 'none';
        }
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
        this.els.iconVolume.style.display = this.isMuted ? 'none' : 'block';
        this.els.iconMuted.style.display = this.isMuted ? 'block' : 'none';
    },

    updatePlayButton() {
        this.els.iconPlay.style.display = this.isPlaying ? 'none' : 'block';
        this.els.iconPause.style.display = this.isPlaying ? 'block' : 'none';
    },

   toggleFxPanel() {
    this.fxOpen = !this.fxOpen;
    this.els.fxPanel.classList.toggle('open', this.fxOpen);
    this.els.btnFx.classList.toggle('active', this.fxOpen);

    if (this.fxOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
},

    switchFxTab(tab) {
        const tabs = ['eq', 'effects', 'advanced', 'crossover', 'soundfield'];
        tabs.forEach(t => {
            const btn = this.els[`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`];
            const content = this.els[`fxContent${t.charAt(0).toUpperCase() + t.slice(1)}`];
            if (btn) btn.classList.toggle('active', t === tab);
            if (content) content.style.display = t === tab ? 'block' : 'none';
        });
        if (tab === 'soundfield') {
            setTimeout(() => this.drawCarDiagram(), 50);
        }
        if (tab === 'crossover') {
            setTimeout(() => this.drawXoverVisual(), 50);
        }
    },

    handleKeyboard(e) {
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowRight':
                if (e.shiftKey) { this.nextTrack(); }
                else { this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 5); }
                break;
            case 'ArrowLeft':
                if (e.shiftKey) { this.prevTrack(); }
                else { this.audio.currentTime = Math.max(0, this.audio.currentTime - 5); }
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.updateVolume(this.volume + 0.05);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.updateVolume(this.volume - 0.05);
                break;
            case 'KeyM':
                this.toggleMute();
                break;
            case 'KeyS':
                this.toggleShuffle();
                break;
            case 'KeyR':
                this.toggleRepeat();
                break;
            case 'KeyF':
                this.toggleFxPanel();
                break;
        }
    },

    updateFxTrack(trackEl, sliderEl) {
        if (!trackEl || !sliderEl) return;
        const min = parseFloat(sliderEl.min);
        const max = parseFloat(sliderEl.max);
        const val = parseFloat(sliderEl.value);
        const percent = ((val - min) / (max - min)) * 100;
        trackEl.style.setProperty('--fill', percent + '%');
    },

    updateBalanceTrack() {
        const trackEl = this.els.balanceTrack;
        if (!trackEl) return;
        const val = parseFloat(this.els.balanceSlider.value);
        const absPercent = Math.abs(val) / 100 * 50;
        trackEl.style.setProperty('--fill-abs', absPercent + '%');
        if (val < 0) {
            trackEl.style.setProperty('--fill-dir', `translateX(-100%)`);
        } else {
            trackEl.style.setProperty('--fill-dir', `translateX(0)`);
        }
    },

    updateCenterTrack(trackEl, sliderEl) {
        if (!trackEl || !sliderEl) return;
        const min = parseFloat(sliderEl.min);
        const max = parseFloat(sliderEl.max);
        const val = parseFloat(sliderEl.value);
        const range = max - min;
        const absPercent = Math.abs(val - (min + range/2)) / (range/2) * 50;
        trackEl.style.setProperty('--fill-abs', absPercent + '%');
        if (val < (min + range/2)) {
            trackEl.style.setProperty('--fill-dir', `translateX(-100%)`);
        } else {
            trackEl.style.setProperty('--fill-dir', `translateX(0)`);
        }
    },

    updateAllFxTracks() {
        this.updateFxTrack(this.els.speedTrack, this.els.speedSlider);
        this.updateBalanceTrack();
        this.updateFxTrack(this.els.bassTrack, this.els.bassSlider);
        this.updateFxTrack(this.els.echoDelayTrack, this.els.echoDelaySlider);
        this.updateFxTrack(this.els.echoFeedbackTrack, this.els.echoFeedbackSlider);
        this.updateFxTrack(this.els.echoMixTrack, this.els.echoMixSlider);
    },

    startMeters() {
        const update = () => {
            if (!this.isPlaying) return;
            if (this.compressorOn && this.compressorNode) {
                const reduction = this.compressorNode.reduction;
                const absR = Math.abs(reduction);
                this.els.compReductionMeter.style.width = Math.min(absR * 2, 100) + '%';
                this.els.compReductionValue.textContent = reduction.toFixed(1) + ' dB';
            }
            if (this.autoGainOn && this.analyser) {
                const data = new Uint8Array(this.analyser.frequencyBinCount);
                this.analyser.getByteFrequencyData(data);
                const avg = data.reduce((a, b) => a + b, 0) / data.length;
                const db = avg > 0 ? 20 * Math.log10(avg / 255) : -100;
                this.els.levelMeter.style.width = Math.max(0, (avg / 255) * 100) + '%';
                this.els.levelValue.textContent = db > -100 ? db.toFixed(1) + ' dB' : '-∞ dB';
            }
            requestAnimationFrame(update);
        };
        update();
    }
};