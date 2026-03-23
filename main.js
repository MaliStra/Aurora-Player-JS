import { EQ_PRESETS, EQ_FREQUENCIES, EQ_LABELS, REVERB_PRESETS, SF_PRESETS } from './constants.js';
import { formatTime, pluralize, escapeHtml } from './utils.js';
import { createAllNodes, buildAudioChain, rebuildAudioChain } from './audio-core.js';
import { eqMethods } from './eq.js';
import { effectsMethods } from './effects.js';
import { advancedMethods } from './advanced.js';
import { crossoverMethods } from './crossover.js';
import { soundfieldMethods } from './soundfield.js';
import { playlistMethods } from './playlist.js';
import { visualizerMethods } from './visualizer.js';
import { uiMethods } from './ui.js';

class AuroraPlayer {
    constructor() {
        // Audio
        this.audio = new Audio();
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.isContextCreated = false;

        // Audio FX nodes (basic)
        this.eqFilters = [];
        this.bassBoostFilter = null;
        this.pannerNode = null;
        this.delayNode = null;
        this.feedbackGainNode = null;
        this.wetGainNode = null;
        this.dryGainNode = null;

        // Audio FX nodes (advanced)
        this.compressorNode = null;
        this.convolverNode = null;
        this.reverbWetGain = null;
        this.reverbDryGain = null;
        this.waveshaperNode = null;
        this.distDryGain = null;
        this.distWetGain = null;
        this.distToneFilter = null;
        this.hpfNode = null;
        this.lpfNode = null;
        this.tremoloOsc = null;
        this.tremoloGain = null;
        this.autoGainNode = null;
        this.limiterNode = null;
        // Karaoke
        this.karaokeSplitter = null;
        this.karaokeMerger = null;
        this.karaokeGainL = null;
        this.karaokeGainR = null;
        this.karaokeInvertGain = null;
        this.karaokeLowFilter = null;
        this.karaokeHighFilter = null;
        this.karaokeMixGain = null;
        this.karaokeBypassGain = null;

        // Crossover / DSP / SoundField nodes
        this.xoverLPF = null;
        this.xoverHPF = null;
        this.xoverLowGain = null;
        this.xoverHighGain = null;
        this.xoverMerger = null;
        this.bpHPF = null;
        this.bpLPF = null;
        this.taDelayL = null;
        this.taDelayR = null;
        this.taSplitter = null;
        this.taMerger = null;
        this.dspNoiseGate = null;
        this.dspStereoSplitter = null;
        this.dspStereoMerger = null;
        this.dspMidGain = null;
        this.dspSideGain = null;
        this.dspDynBassFilter = null;
        this.dspLoudnessLow = null;
        this.dspLoudnessHigh = null;
        this.sfSplitter = null;
        this.sfMerger = null;
        this.sfGainFL = null;
        this.sfGainFR = null;
        this.sfSubFilter = null;
        this.sfSubGain = null;

        // State
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 0;
        this.volume = 1;
        this.isMuted = false;
        this.isDraggingProgress = false;
        this.isDraggingVolume = false;
        this.shuffleHistory = [];

        // FX State (basic)
        this.fxOpen = false;
        this.eqValues = new Array(10).fill(0);
        this.speedVal = 1;
        this.balanceVal = 0;
        this.bassBoostVal = 0;
        this.echoDelayVal = 0;
        this.echoFeedbackVal = 0;
        this.echoMixVal = 0;

        // FX State (advanced)
        this.compressorOn = false;
        this.reverbOn = false;
        this.distortionOn = false;
        this.filtersOn = false;
        this.tremoloOn = false;
        this.karaokeOn = false;
        this.autoGainOn = false;

        // Crossover / DSP state
        this.crossoverOn = false;
        this.bandpassOn = false;
        this.timeAlignOn = false;
        this.dspOn = false;
        this.soundfieldOn = false;
        this.sfCurrentPreset = 'center';
        this.sfFocusX = 0.5;
        this.sfFocusY = 0.5;
        this.isDraggingSF = false;

        this.reverbNeedsUpdate = false;

        // Init
        this.cacheDOM();
        this.buildEqBands();
        this.bindEvents();
        this.bindFxEvents();
        this.bindAdvancedFxEvents();
        this.bindCrossoverEvents();
        this.bindSoundfieldEvents();
        this.setupVisualizer();
        this.updateVolume(1);
        this.updateAllFxTracks();
        this.updateAllAdvancedTracks();
        this.updateAllCrossoverTracks();
        this.updateAllSoundfieldTracks();
        this.initGroupBodyStates();
        this.drawCarDiagram();
        this.drawXoverVisual();
    }

    cacheDOM() {
        this.els = {
            fileInput: document.getElementById('fileInput'),
            btnAddFiles: document.getElementById('btnAddFiles'),
            btnPlay: document.getElementById('btnPlay'),
            btnPrev: document.getElementById('btnPrev'),
            btnNext: document.getElementById('btnNext'),
            btnShuffle: document.getElementById('btnShuffle'),
            btnRepeat: document.getElementById('btnRepeat'),
            btnMute: document.getElementById('btnMute'),
            btnFx: document.getElementById('btnFx'),
            iconPlay: document.getElementById('iconPlay'),
            iconPause: document.getElementById('iconPause'),
            iconVolume: document.getElementById('iconVolume'),
            iconMuted: document.getElementById('iconMuted'),
            repeatBadge: document.getElementById('repeatBadge'),
            trackTitle: document.getElementById('trackTitle'),
            trackArtist: document.getElementById('trackArtist'),
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime'),
            progressBar: document.getElementById('progressBar'),
            progressFill: document.getElementById('progressFill'),
            progressBuffered: document.getElementById('progressBuffered'),
            progressThumb: document.getElementById('progressThumb'),
            volumeBar: document.getElementById('volumeBar'),
            volumeFill: document.getElementById('volumeFill'),
            volumeThumb: document.getElementById('volumeThumb'),
            volumeValue: document.getElementById('volumeValue'),
            playlist: document.getElementById('playlist'),
            playlistEmpty: document.getElementById('playlistEmpty'),
            trackCount: document.getElementById('trackCount'),
            albumArt: document.getElementById('albumArt'),
            canvas: document.getElementById('visualizer'),
            dropOverlay: document.getElementById('dropOverlay'),
            fxPanel: document.getElementById('fxPanel'),
            tabBtnEq: document.getElementById('tabBtnEq'),
            tabBtnEffects: document.getElementById('tabBtnEffects'),
            tabBtnAdvanced: document.getElementById('tabBtnAdvanced'),
            tabBtnCrossover: document.getElementById('tabBtnCrossover'),
            tabBtnSoundfield: document.getElementById('tabBtnSoundfield'),
            fxContentEq: document.getElementById('fxContentEq'),
            fxContentEffects: document.getElementById('fxContentEffects'),
            fxContentAdvanced: document.getElementById('fxContentAdvanced'),
            fxContentCrossover: document.getElementById('fxContentCrossover'),
            fxContentSoundfield: document.getElementById('fxContentSoundfield'),
            eqPreset: document.getElementById('eqPreset'),
            eqResetBtn: document.getElementById('eqResetBtn'),
            eqBands: document.getElementById('eqBands'),
            speedSlider: document.getElementById('speedSlider'),
            speedValue: document.getElementById('speedValue'),
            speedTrack: document.getElementById('speedTrack'),
            balanceSlider: document.getElementById('balanceSlider'),
            balanceValue: document.getElementById('balanceValue'),
            balanceTrack: document.getElementById('balanceTrack'),
            bassSlider: document.getElementById('bassSlider'),
            bassValue: document.getElementById('bassValue'),
            bassTrack: document.getElementById('bassTrack'),
            echoDelaySlider: document.getElementById('echoDelaySlider'),
            echoDelayValue: document.getElementById('echoDelayValue'),
            echoDelayTrack: document.getElementById('echoDelayTrack'),
            echoFeedbackSlider: document.getElementById('echoFeedbackSlider'),
            echoFeedbackValue: document.getElementById('echoFeedbackValue'),
            echoFeedbackTrack: document.getElementById('echoFeedbackTrack'),
            echoMixSlider: document.getElementById('echoMixSlider'),
            echoMixValue: document.getElementById('echoMixValue'),
            echoMixTrack: document.getElementById('echoMixTrack'),
            echoResetBtn: document.getElementById('echoResetBtn'),
            fxResetAll: document.getElementById('fxResetAll'),
            compressorToggle: document.getElementById('compressorToggle'),
            compressorBody: document.getElementById('compressorBody'),
            compThresholdSlider: document.getElementById('compThresholdSlider'),
            compThresholdValue: document.getElementById('compThresholdValue'),
            compThresholdTrack: document.getElementById('compThresholdTrack'),
            compKneeSlider: document.getElementById('compKneeSlider'),
            compKneeValue: document.getElementById('compKneeValue'),
            compKneeTrack: document.getElementById('compKneeTrack'),
            compRatioSlider: document.getElementById('compRatioSlider'),
            compRatioValue: document.getElementById('compRatioValue'),
            compRatioTrack: document.getElementById('compRatioTrack'),
            compAttackSlider: document.getElementById('compAttackSlider'),
            compAttackValue: document.getElementById('compAttackValue'),
            compAttackTrack: document.getElementById('compAttackTrack'),
            compReleaseSlider: document.getElementById('compReleaseSlider'),
            compReleaseValue: document.getElementById('compReleaseValue'),
            compReleaseTrack: document.getElementById('compReleaseTrack'),
            compReductionMeter: document.getElementById('compReductionMeter'),
            compReductionValue: document.getElementById('compReductionValue'),
            reverbToggle: document.getElementById('reverbToggle'),
            reverbBody: document.getElementById('reverbBody'),
            reverbSizeSlider: document.getElementById('reverbSizeSlider'),
            reverbSizeValue: document.getElementById('reverbSizeValue'),
            reverbSizeTrack: document.getElementById('reverbSizeTrack'),
            reverbDecaySlider: document.getElementById('reverbDecaySlider'),
            reverbDecayValue: document.getElementById('reverbDecayValue'),
            reverbDecayTrack: document.getElementById('reverbDecayTrack'),
            reverbMixSlider: document.getElementById('reverbMixSlider'),
            reverbMixValue: document.getElementById('reverbMixValue'),
            reverbMixTrack: document.getElementById('reverbMixTrack'),
            distortionToggle: document.getElementById('distortionToggle'),
            distortionBody: document.getElementById('distortionBody'),
            distAmountSlider: document.getElementById('distAmountSlider'),
            distAmountValue: document.getElementById('distAmountValue'),
            distAmountTrack: document.getElementById('distAmountTrack'),
            distToneSlider: document.getElementById('distToneSlider'),
            distToneValue: document.getElementById('distToneValue'),
            distToneTrack: document.getElementById('distToneTrack'),
            distMixSlider: document.getElementById('distMixSlider'),
            distMixValue: document.getElementById('distMixValue'),
            distMixTrack: document.getElementById('distMixTrack'),
            filtersToggle: document.getElementById('filtersToggle'),
            filtersBody: document.getElementById('filtersBody'),
            hpfSlider: document.getElementById('hpfSlider'),
            hpfValue: document.getElementById('hpfValue'),
            hpfTrack: document.getElementById('hpfTrack'),
            lpfSlider: document.getElementById('lpfSlider'),
            lpfValue: document.getElementById('lpfValue'),
            lpfTrack: document.getElementById('lpfTrack'),
            filterQSlider: document.getElementById('filterQSlider'),
            filterQValue: document.getElementById('filterQValue'),
            filterQTrack: document.getElementById('filterQTrack'),
            tremoloToggle: document.getElementById('tremoloToggle'),
            tremoloBody: document.getElementById('tremoloBody'),
            tremoloRateSlider: document.getElementById('tremoloRateSlider'),
            tremoloRateValue: document.getElementById('tremoloRateValue'),
            tremoloRateTrack: document.getElementById('tremoloRateTrack'),
            tremoloDepthSlider: document.getElementById('tremoloDepthSlider'),
            tremoloDepthValue: document.getElementById('tremoloDepthValue'),
            tremoloDepthTrack: document.getElementById('tremoloDepthTrack'),
            karaokeToggle: document.getElementById('karaokeToggle'),
            karaokeBody: document.getElementById('karaokeBody'),
            karaokeAmountSlider: document.getElementById('karaokeAmountSlider'),
            karaokeAmountValue: document.getElementById('karaokeAmountValue'),
            karaokeAmountTrack: document.getElementById('karaokeAmountTrack'),
            karaokeLowSlider: document.getElementById('karaokeLowSlider'),
            karaokeLowValue: document.getElementById('karaokeLowValue'),
            karaokeLowTrack: document.getElementById('karaokeLowTrack'),
            karaokeHighSlider: document.getElementById('karaokeHighSlider'),
            karaokeHighValue: document.getElementById('karaokeHighValue'),
            karaokeHighTrack: document.getElementById('karaokeHighTrack'),
            autoGainToggle: document.getElementById('autoGainToggle'),
            autoGainBody: document.getElementById('autoGainBody'),
            autoGainSlider: document.getElementById('autoGainSlider'),
            autoGainValue: document.getElementById('autoGainValue'),
            autoGainTrack: document.getElementById('autoGainTrack'),
            limiterCeilingSlider: document.getElementById('limiterCeilingSlider'),
            limiterCeilingValue: document.getElementById('limiterCeilingValue'),
            limiterCeilingTrack: document.getElementById('limiterCeilingTrack'),
            levelMeter: document.getElementById('levelMeter'),
            levelValue: document.getElementById('levelValue'),
            fxResetAdvanced: document.getElementById('fxResetAdvanced'),
            crossoverToggle: document.getElementById('crossoverToggle'),
            crossoverBody: document.getElementById('crossoverBody'),
            xoverFreqSlider: document.getElementById('xoverFreqSlider'),
            xoverFreqValue: document.getElementById('xoverFreqValue'),
            xoverFreqTrack: document.getElementById('xoverFreqTrack'),
            xoverSlopeSlider: document.getElementById('xoverSlopeSlider'),
            xoverSlopeValue: document.getElementById('xoverSlopeValue'),
            xoverSlopeTrack: document.getElementById('xoverSlopeTrack'),
            xoverLowGainSlider: document.getElementById('xoverLowGainSlider'),
            xoverLowGainValue: document.getElementById('xoverLowGainValue'),
            xoverLowGainTrack: document.getElementById('xoverLowGainTrack'),
            xoverHighGainSlider: document.getElementById('xoverHighGainSlider'),
            xoverHighGainValue: document.getElementById('xoverHighGainValue'),
            xoverHighGainTrack: document.getElementById('xoverHighGainTrack'),
            xoverCanvas: document.getElementById('xoverCanvas'),
            bandpassToggle: document.getElementById('bandpassToggle'),
            bandpassBody: document.getElementById('bandpassBody'),
            bpLowSlider: document.getElementById('bpLowSlider'),
            bpLowValue: document.getElementById('bpLowValue'),
            bpLowTrack: document.getElementById('bpLowTrack'),
            bpHighSlider: document.getElementById('bpHighSlider'),
            bpHighValue: document.getElementById('bpHighValue'),
            bpHighTrack: document.getElementById('bpHighTrack'),
            bpSlopeSlider: document.getElementById('bpSlopeSlider'),
            bpSlopeValue: document.getElementById('bpSlopeValue'),
            bpSlopeTrack: document.getElementById('bpSlopeTrack'),
            timeAlignToggle: document.getElementById('timeAlignToggle'),
            timeAlignBody: document.getElementById('timeAlignBody'),
            taLeftSlider: document.getElementById('taLeftSlider'),
            taLeftValue: document.getElementById('taLeftValue'),
            taLeftTrack: document.getElementById('taLeftTrack'),
            taRightSlider: document.getElementById('taRightSlider'),
            taRightValue: document.getElementById('taRightValue'),
            taRightTrack: document.getElementById('taRightTrack'),
            taDistSlider: document.getElementById('taDistSlider'),
            taDistValue: document.getElementById('taDistValue'),
            taDistTrack: document.getElementById('taDistTrack'),
            dspToggle: document.getElementById('dspToggle'),
            dspBody: document.getElementById('dspBody'),
            dspNoiseSlider: document.getElementById('dspNoiseSlider'),
            dspNoiseValue: document.getElementById('dspNoiseValue'),
            dspNoiseTrack: document.getElementById('dspNoiseTrack'),
            dspStereoSlider: document.getElementById('dspStereoSlider'),
            dspStereoValue: document.getElementById('dspStereoValue'),
            dspStereoTrack: document.getElementById('dspStereoTrack'),
            dspDynBassSlider: document.getElementById('dspDynBassSlider'),
            dspDynBassValue: document.getElementById('dspDynBassValue'),
            dspDynBassTrack: document.getElementById('dspDynBassTrack'),
            dspLoudnessSlider: document.getElementById('dspLoudnessSlider'),
            dspLoudnessValue: document.getElementById('dspLoudnessValue'),
            dspLoudnessTrack: document.getElementById('dspLoudnessTrack'),
            fxResetCrossover: document.getElementById('fxResetCrossover'),
            soundfieldToggle: document.getElementById('soundfieldToggle'),
            soundfieldBody: document.getElementById('soundfieldBody'),
            sfCanvas: document.getElementById('sfCanvas'),
            sfFocusPoint: document.getElementById('sfFocusPoint'),
            sfFL: document.getElementById('sfFL'),
            sfFR: document.getElementById('sfFR'),
            sfRL: document.getElementById('sfRL'),
            sfRR: document.getElementById('sfRR'),
            sfFLValue: document.getElementById('sfFLValue'),
            sfFRValue: document.getElementById('sfFRValue'),
            sfRLValue: document.getElementById('sfRLValue'),
            sfRRValue: document.getElementById('sfRRValue'),
            sfFLTrack: document.getElementById('sfFLTrack'),
            sfFRTrack: document.getElementById('sfFRTrack'),
            sfRLTrack: document.getElementById('sfRLTrack'),
            sfRRTrack: document.getElementById('sfRRTrack'),
            sfFaderSlider: document.getElementById('sfFaderSlider'),
            sfFaderValue: document.getElementById('sfFaderValue'),
            sfFaderTrack: document.getElementById('sfFaderTrack'),
            sfSubSlider: document.getElementById('sfSubSlider'),
            sfSubValue: document.getElementById('sfSubValue'),
            sfSubTrack: document.getElementById('sfSubTrack'),
            sfSubFreqSlider: document.getElementById('sfSubFreqSlider'),
            sfSubFreqValue: document.getElementById('sfSubFreqValue'),
            sfSubFreqTrack: document.getElementById('sfSubFreqTrack'),
            btnAddFolder: document.getElementById('btnAddFolder'),
            folderInput: document.getElementById('folderInput'),
            fxResetSoundfield: document.getElementById('fxResetSoundfield')
        };
    }

    // --- Audio context ---
    createAudioContext() {
        if (this.isContextCreated) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.source = this.audioContext.createMediaElementSource(this.audio);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;

        createAllNodes(this.audioContext, this);
        buildAudioChain(this.audioContext, this);
        this.isContextCreated = true;
    }

    rebuildAudioChain() {
        rebuildAudioChain(this.audioContext, this);
    }

    // --- Methods from modules ---
    // Все методы будут добавлены через Object.assign после объявления класса

    // --- Additional methods used in modules ---
    togglePlay() {
        if (this.currentIndex === -1) return;
        if (this.isPlaying) this.pause();
        else this.play();
    }

    play() {
        if (this.currentIndex === -1) return;
        this.createAudioContext();
        if (this.audioContext.state === 'suspended') this.audioContext.resume();
        this.audio.play();
        this.isPlaying = true;
        this.updatePlayButton();
        this.els.albumArt.classList.add('playing');
        this.renderPlaylist();
        this.drawVisualizer();
        this.startMeters();
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
        this.els.albumArt.classList.remove('playing');
        this.renderPlaylist();
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.els.btnShuffle.classList.toggle('active', this.isShuffle);
        if (!this.isShuffle) this.shuffleHistory = [];
    }

    toggleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        this.els.btnRepeat.classList.toggle('active', this.repeatMode > 0);
        this.els.repeatBadge.style.display = this.repeatMode === 2 ? 'block' : 'none';
    }

    onTimeUpdate() {
        if (this.isDraggingProgress || !this.audio.duration) return;
        const p = this.audio.currentTime / this.audio.duration;
        this.updateProgress(p);
        this.els.currentTime.textContent = formatTime(this.audio.currentTime);
    }

    onMetadataLoaded() {
        this.els.totalTime.textContent = formatTime(this.audio.duration);
        this.audio.playbackRate = this.speedVal;
    }

    onBufferProgress() {
        if (this.audio.buffered.length > 0) {
            const buffered = this.audio.buffered.end(this.audio.buffered.length - 1) / this.audio.duration * 100;
            this.els.progressBuffered.style.width = buffered + '%';
        }
    }

    initGroupBodyStates() {
        this.els.compressorBody.classList.toggle('disabled', !this.compressorOn);
        this.els.reverbBody.classList.toggle('disabled', !this.reverbOn);
        this.els.distortionBody.classList.toggle('disabled', !this.distortionOn);
        this.els.filtersBody.classList.toggle('disabled', !this.filtersOn);
        this.els.tremoloBody.classList.toggle('disabled', !this.tremoloOn);
        this.els.karaokeBody.classList.toggle('disabled', !this.karaokeOn);
        this.els.autoGainBody.classList.toggle('disabled', !this.autoGainOn);
        this.els.crossoverBody.classList.toggle('disabled', !this.crossoverOn);
        this.els.bandpassBody.classList.toggle('disabled', !this.bandpassOn);
        this.els.timeAlignBody.classList.toggle('disabled', !this.timeAlignOn);
        this.els.dspBody.classList.toggle('disabled', !this.dspOn);
        this.els.soundfieldBody.classList.toggle('disabled', !this.soundfieldOn);
    }

   bindEvents() {
    this.els.btnAddFiles.addEventListener('click', () => this.els.fileInput.click());
    this.els.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

    // Кнопка выбора папки
    this.els.btnAddFolder.addEventListener('click', () => this.els.folderInput.click());
    this.els.folderInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('audio/'));
        if (files.length) this.handleFiles(files);
        this.els.folderInput.value = ''; // очистка для повторного выбора той же папки
    });

    this.els.btnPlay.addEventListener('click', () => this.togglePlay());
    this.els.btnPrev.addEventListener('click', () => this.prevTrack());
    this.els.btnNext.addEventListener('click', () => this.nextTrack());
    this.els.btnShuffle.addEventListener('click', () => this.toggleShuffle());
    this.els.btnRepeat.addEventListener('click', () => this.toggleRepeat());
    this.els.btnMute.addEventListener('click', () => this.toggleMute());

    this.els.volumeBar.addEventListener('mousedown', (e) => this.startVolumeDrag(e));
    this.els.volumeBar.addEventListener('touchstart', (e) => this.startVolumeDrag(e), { passive: false });
    this.els.progressBar.addEventListener('mousedown', (e) => this.startProgressDrag(e));
    this.els.progressBar.addEventListener('touchstart', (e) => this.startProgressDrag(e), { passive: false });

    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', (e) => this.onDragEnd(e));
    document.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
    document.addEventListener('touchend', (e) => this.onDragEnd(e));

    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.audio.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
    this.audio.addEventListener('ended', () => this.onTrackEnd());
    this.audio.addEventListener('progress', () => this.onBufferProgress());

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.els.dropOverlay.classList.add('visible');
    });
    document.addEventListener('dragleave', (e) => {
        if (e.relatedTarget === null) {
            this.els.dropOverlay.classList.remove('visible');
        }
    });
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        this.els.dropOverlay.classList.remove('visible');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
        if (files.length) this.handleFiles(files);
    });

    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Закрытие FX-панели по кнопке (добавленная кнопка)
    const closeBtn = document.getElementById('fxCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (this.fxOpen) {
                this.toggleFxPanel();
            }
        });
    }
}

    bindFxEvents() {
        this.els.btnFx.addEventListener('click', () => this.toggleFxPanel());
        const tabs = ['eq', 'effects', 'advanced', 'crossover', 'soundfield'];
        tabs.forEach(tab => {
            const btn = this.els[`tabBtn${tab.charAt(0).toUpperCase() + tab.slice(1)}`];
            if (btn) btn.addEventListener('click', () => this.switchFxTab(tab));
        });
        this.els.eqPreset.addEventListener('change', (e) => this.applyEqPreset(e.target.value));
        this.els.eqResetBtn.addEventListener('click', () => this.applyEqPreset('flat'));
        document.querySelectorAll('.eq-band-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const band = parseInt(e.target.dataset.band);
                const val = parseFloat(e.target.value);
                this.setEqBand(band, val);
            });
        });
        this.els.speedSlider.addEventListener('input', (e) => {
            this.setSpeed(parseInt(e.target.value) / 100);
        });
        this.els.balanceSlider.addEventListener('input', (e) => {
            this.setBalance(parseInt(e.target.value) / 100);
        });
        this.els.bassSlider.addEventListener('input', (e) => {
            this.setBassBoost(parseInt(e.target.value));
        });
        this.els.echoDelaySlider.addEventListener('input', (e) => {
            this.setEchoDelay(parseInt(e.target.value));
        });
        this.els.echoFeedbackSlider.addEventListener('input', (e) => {
            this.setEchoFeedback(parseInt(e.target.value));
        });
        this.els.echoMixSlider.addEventListener('input', (e) => {
            this.setEchoMix(parseInt(e.target.value));
        });
        this.els.echoResetBtn.addEventListener('click', () => this.resetEcho());
        this.els.fxResetAll.addEventListener('click', () => this.resetAllFx());
    }

    bindAdvancedFxEvents() {
        // Compressor
        this.els.compressorToggle.addEventListener('change', (e) => {
            this.compressorOn = e.target.checked;
            this.els.compressorBody.classList.toggle('disabled', !this.compressorOn);
            this.applyCompressor();
        });
        this.els.compThresholdSlider.addEventListener('input', (e) => {
            if (this.isContextCreated && this.compressorNode) {
                this.compressorNode.threshold.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            }
            this.els.compThresholdValue.textContent = e.target.value + ' dB';
            this.updateFxTrack(this.els.compThresholdTrack, e.target);
        });
        this.els.compKneeSlider.addEventListener('input', (e) => {
            if (this.isContextCreated && this.compressorNode) {
                this.compressorNode.knee.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            }
            this.els.compKneeValue.textContent = e.target.value + ' dB';
            this.updateFxTrack(this.els.compKneeTrack, e.target);
        });
        this.els.compRatioSlider.addEventListener('input', (e) => {
            if (this.isContextCreated && this.compressorNode) {
                this.compressorNode.ratio.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            }
            this.els.compRatioValue.textContent = parseFloat(e.target.value).toFixed(1) + ':1';
            this.updateFxTrack(this.els.compRatioTrack, e.target);
        });
        this.els.compAttackSlider.addEventListener('input', (e) => {
            if (this.isContextCreated && this.compressorNode) {
                this.compressorNode.attack.setValueAtTime(parseFloat(e.target.value) / 1000, this.audioContext.currentTime);
            }
            this.els.compAttackValue.textContent = e.target.value + ' мс';
            this.updateFxTrack(this.els.compAttackTrack, e.target);
        });
        this.els.compReleaseSlider.addEventListener('input', (e) => {
            if (this.isContextCreated && this.compressorNode) {
                this.compressorNode.release.setValueAtTime(parseFloat(e.target.value) / 1000, this.audioContext.currentTime);
            }
            this.els.compReleaseValue.textContent = e.target.value + ' мс';
            this.updateFxTrack(this.els.compReleaseTrack, e.target);
        });
        // Reverb
        this.els.reverbToggle.addEventListener('change', (e) => {
            this.reverbOn = e.target.checked;
            this.els.reverbBody.classList.toggle('disabled', !this.reverbOn);
            this.applyReverb();
        });
        this.els.reverbSizeSlider.addEventListener('input', (e) => {
            this.els.reverbSizeValue.textContent = (parseInt(e.target.value) / 10).toFixed(1) + ' с';
            this.updateFxTrack(this.els.reverbSizeTrack, e.target);
            this.reverbNeedsUpdate = true;
        });
        this.els.reverbSizeSlider.addEventListener('change', () => {
            if (this.reverbNeedsUpdate) { this.generateReverb(); this.reverbNeedsUpdate = false; }
        });
        this.els.reverbDecaySlider.addEventListener('input', (e) => {
            this.els.reverbDecayValue.textContent = e.target.value + '%';
            this.updateFxTrack(this.els.reverbDecayTrack, e.target);
            this.reverbNeedsUpdate = true;
        });
        this.els.reverbDecaySlider.addEventListener('change', () => {
            if (this.reverbNeedsUpdate) { this.generateReverb(); this.reverbNeedsUpdate = false; }
        });
        this.els.reverbMixSlider.addEventListener('input', (e) => {
            const mix = parseInt(e.target.value) / 100;
            this.els.reverbMixValue.textContent = e.target.value + '%';
            if (this.reverbWetGain) this.reverbWetGain.gain.setValueAtTime(mix, this.audioContext.currentTime);
            if (this.reverbDryGain) this.reverbDryGain.gain.setValueAtTime(1 - mix * 0.5, this.audioContext.currentTime);
            this.updateFxTrack(this.els.reverbMixTrack, e.target);
        });
        document.querySelectorAll('[data-reverb]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = REVERB_PRESETS[btn.dataset.reverb];
                if (!preset) return;
                document.querySelectorAll('[data-reverb]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.els.reverbSizeSlider.value = preset.size;
                this.els.reverbDecaySlider.value = preset.decay;
                this.els.reverbMixSlider.value = preset.mix;
                this.els.reverbSizeValue.textContent = (preset.size / 10).toFixed(1) + ' с';
                this.els.reverbDecayValue.textContent = preset.decay + '%';
                this.els.reverbMixValue.textContent = preset.mix + '%';
                this.updateFxTrack(this.els.reverbSizeTrack, this.els.reverbSizeSlider);
                this.updateFxTrack(this.els.reverbDecayTrack, this.els.reverbDecaySlider);
                this.updateFxTrack(this.els.reverbMixTrack, this.els.reverbMixSlider);
                this.generateReverb();
                if (this.reverbWetGain) {
                    const mix = preset.mix / 100;
                    this.reverbWetGain.gain.setValueAtTime(mix, this.audioContext.currentTime);
                    this.reverbDryGain.gain.setValueAtTime(1 - mix * 0.5, this.audioContext.currentTime);
                }
            });
        });
        // Distortion
        this.els.distortionToggle.addEventListener('change', (e) => {
            this.distortionOn = e.target.checked;
            this.els.distortionBody.classList.toggle('disabled', !this.distortionOn);
            this.applyDistortion();
        });
        this.els.distAmountSlider.addEventListener('input', (e) => {
            this.els.distAmountValue.textContent = e.target.value;
            if (this.waveshaperNode) this.waveshaperNode.curve = this.makeDistortionCurve(parseInt(e.target.value));
            this.updateFxTrack(this.els.distAmountTrack, e.target);
        });
        this.els.distToneSlider.addEventListener('input', (e) => {
            const freq = parseInt(e.target.value);
            this.els.distToneValue.textContent = freq >= 1000 ? (freq / 1000).toFixed(freq % 1000 === 0 ? 0 : 1) + 'К Гц' : freq + ' Гц';
            if (this.distToneFilter) this.distToneFilter.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            this.updateFxTrack(this.els.distToneTrack, e.target);
        });
        this.els.distMixSlider.addEventListener('input', (e) => {
            const mix = parseInt(e.target.value) / 100;
            this.els.distMixValue.textContent = e.target.value + '%';
            if (this.distWetGain) this.distWetGain.gain.setValueAtTime(mix, this.audioContext.currentTime);
            if (this.distDryGain) this.distDryGain.gain.setValueAtTime(1 - mix, this.audioContext.currentTime);
            this.updateFxTrack(this.els.distMixTrack, e.target);
        });
        // Filters
        this.els.filtersToggle.addEventListener('change', (e) => {
            this.filtersOn = e.target.checked;
            this.els.filtersBody.classList.toggle('disabled', !this.filtersOn);
            this.applyFilters();
        });
        this.els.hpfSlider.addEventListener('input', (e) => {
            const v = parseInt(e.target.value);
            this.els.hpfValue.textContent = v + ' Гц';
            if (this.hpfNode) this.hpfNode.frequency.setValueAtTime(v, this.audioContext.currentTime);
            this.updateFxTrack(this.els.hpfTrack, e.target);
        });
        this.els.lpfSlider.addEventListener('input', (e) => {
            const v = parseInt(e.target.value);
            this.els.lpfValue.textContent = v + ' Гц';
            if (this.lpfNode) this.lpfNode.frequency.setValueAtTime(v, this.audioContext.currentTime);
            this.updateFxTrack(this.els.lpfTrack, e.target);
        });
        this.els.filterQSlider.addEventListener('input', (e) => {
            const q = parseInt(e.target.value) / 10;
            this.els.filterQValue.textContent = q.toFixed(1);
            if (this.hpfNode) this.hpfNode.Q.setValueAtTime(q, this.audioContext.currentTime);
            if (this.lpfNode) this.lpfNode.Q.setValueAtTime(q, this.audioContext.currentTime);
            this.updateFxTrack(this.els.filterQTrack, e.target);
        });
        // Tremolo
        this.els.tremoloToggle.addEventListener('change', (e) => {
            this.tremoloOn = e.target.checked;
            this.els.tremoloBody.classList.toggle('disabled', !this.tremoloOn);
            this.applyTremolo();
        });
        this.els.tremoloRateSlider.addEventListener('input', (e) => {
            const rate = parseInt(e.target.value) / 10;
            this.els.tremoloRateValue.textContent = rate.toFixed(1) + ' Гц';
            if (this.tremoloOsc) this.tremoloOsc.frequency.setValueAtTime(rate, this.audioContext.currentTime);
            this.updateFxTrack(this.els.tremoloRateTrack, e.target);
        });
        this.els.tremoloDepthSlider.addEventListener('input', (e) => {
            this.els.tremoloDepthValue.textContent = e.target.value + '%';
            if (this.tremoloGain) this.tremoloGain.gain.setValueAtTime(parseInt(e.target.value) / 100, this.audioContext.currentTime);
            this.updateFxTrack(this.els.tremoloDepthTrack, e.target);
        });
        // Karaoke
        this.els.karaokeToggle.addEventListener('change', (e) => {
            this.karaokeOn = e.target.checked;
            this.els.karaokeBody.classList.toggle('disabled', !this.karaokeOn);
            this.applyKaraoke();
        });
        this.els.karaokeAmountSlider.addEventListener('input', (e) => {
            this.els.karaokeAmountValue.textContent = e.target.value + '%';
            const v = parseInt(e.target.value) / 100;
            if (this.karaokeInvertGain) this.karaokeInvertGain.gain.setValueAtTime(-v, this.audioContext.currentTime);
            if (this.karaokeMixGain) this.karaokeMixGain.gain.setValueAtTime(v, this.audioContext.currentTime);
            if (this.karaokeBypassGain) this.karaokeBypassGain.gain.setValueAtTime(1 - v, this.audioContext.currentTime);
            this.updateFxTrack(this.els.karaokeAmountTrack, e.target);
        });
        this.els.karaokeLowSlider.addEventListener('input', (e) => {
            this.els.karaokeLowValue.textContent = e.target.value + ' Гц';
            if (this.karaokeLowFilter) this.karaokeLowFilter.frequency.setValueAtTime(parseInt(e.target.value), this.audioContext.currentTime);
            this.updateFxTrack(this.els.karaokeLowTrack, e.target);
        });
        this.els.karaokeHighSlider.addEventListener('input', (e) => {
            this.els.karaokeHighValue.textContent = e.target.value + ' Гц';
            if (this.karaokeHighFilter) this.karaokeHighFilter.frequency.setValueAtTime(parseInt(e.target.value), this.audioContext.currentTime);
            this.updateFxTrack(this.els.karaokeHighTrack, e.target);
        });
        // Auto Gain
        this.els.autoGainToggle.addEventListener('change', (e) => {
            this.autoGainOn = e.target.checked;
            this.els.autoGainBody.classList.toggle('disabled', !this.autoGainOn);
            this.applyAutoGain();
        });
        this.els.autoGainSlider.addEventListener('input', (e) => {
            const db = parseFloat(e.target.value);
            this.els.autoGainValue.textContent = (db >= 0 ? '+' : '') + db.toFixed(1) + ' dB';
            if (this.autoGainNode) this.autoGainNode.gain.setValueAtTime(Math.pow(10, db / 20), this.audioContext.currentTime);
            this.updateFxTrack(this.els.autoGainTrack, e.target);
        });
        this.els.limiterCeilingSlider.addEventListener('input', (e) => {
            const db = parseFloat(e.target.value);
            this.els.limiterCeilingValue.textContent = db.toFixed(1) + ' dB';
            if (this.limiterNode) this.limiterNode.threshold.setValueAtTime(db, this.audioContext.currentTime);
            this.updateFxTrack(this.els.limiterCeilingTrack, e.target);
        });
        this.els.fxResetAdvanced.addEventListener('click', () => this.resetAdvancedFx());
    }

    bindCrossoverEvents() {
        // Crossover
        this.els.crossoverToggle.addEventListener('change', (e) => {
            this.crossoverOn = e.target.checked;
            this.els.crossoverBody.classList.toggle('disabled', !this.crossoverOn);
            this.rebuildAudioChain();
        });
        this.els.xoverFreqSlider.addEventListener('input', (e) => {
            const v = parseInt(e.target.value);
            this.els.xoverFreqValue.textContent = v >= 1000 ? (v/1000).toFixed(1) + 'К Гц' : v + ' Гц';
            if (this.xoverLPF) this.xoverLPF.frequency.setValueAtTime(v, this.audioContext.currentTime);
            if (this.xoverHPF) this.xoverHPF.frequency.setValueAtTime(v, this.audioContext.currentTime);
            this.updateFxTrack(this.els.xoverFreqTrack, e.target);
            this.drawXoverVisual();
        });
        this.els.xoverSlopeSlider.addEventListener('input', (e) => {
            const slopes = ['6', '12', '18', '24'];
            const v = parseInt(e.target.value);
            this.els.xoverSlopeValue.textContent = slopes[v-1] + ' дБ/окт';
            this.updateFxTrack(this.els.xoverSlopeTrack, e.target);
            this.drawXoverVisual();
        });
        this.els.xoverLowGainSlider.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.els.xoverLowGainValue.textContent = (v >= 0 ? '+' : '') + v.toFixed(1) + ' dB';
            if (this.xoverLowGain) this.xoverLowGain.gain.setValueAtTime(Math.pow(10, v/20), this.audioContext.currentTime);
            this.updateCenterTrack(this.els.xoverLowGainTrack, this.els.xoverLowGainSlider);
        });
        this.els.xoverHighGainSlider.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.els.xoverHighGainValue.textContent = (v >= 0 ? '+' : '') + v.toFixed(1) + ' dB';
            if (this.xoverHighGain) this.xoverHighGain.gain.setValueAtTime(Math.pow(10, v/20), this.audioContext.currentTime);
            this.updateCenterTrack(this.els.xoverHighGainTrack, this.els.xoverHighGainSlider);
        });
        // Bandpass
        this.els.bandpassToggle.addEventListener('change', (e) => {
            this.bandpassOn = e.target.checked;
            this.els.bandpassBody.classList.toggle('disabled', !this.bandpassOn);
            this.rebuildAudioChain();
        });
        this.els.bpLowSlider.addEventListener('input', (e) => {
            this.els.bpLowValue.textContent = e.target.value + ' Гц';
            if (this.bpHPF) this.bpHPF.frequency.setValueAtTime(parseInt(e.target.value), this.audioContext.currentTime);
            this.updateFxTrack(this.els.bpLowTrack, e.target);
        });
        this.els.bpHighSlider.addEventListener('input', (e) => {
            this.els.bpHighValue.textContent = e.target.value + ' Гц';
            if (this.bpLPF) this.bpLPF.frequency.setValueAtTime(parseInt(e.target.value), this.audioContext.currentTime);
            this.updateFxTrack(this.els.bpHighTrack, e.target);
        });
        this.els.bpSlopeSlider.addEventListener('input', (e) => {
            const slopes = ['6', '12', '18', '24'];
            this.els.bpSlopeValue.textContent = slopes[parseInt(e.target.value)-1] + ' дБ/окт';
            this.updateFxTrack(this.els.bpSlopeTrack, e.target);
        });
        // Time Alignment
        this.els.timeAlignToggle.addEventListener('change', (e) => {
            this.timeAlignOn = e.target.checked;
            this.els.timeAlignBody.classList.toggle('disabled', !this.timeAlignOn);
            this.rebuildAudioChain();
        });
        this.els.taLeftSlider.addEventListener('input', (e) => {
            const v = parseInt(e.target.value) / 10;
            this.els.taLeftValue.textContent = v.toFixed(1) + ' мс';
            if (this.taDelayL) this.taDelayL.delayTime.setValueAtTime(v / 1000, this.audioContext.currentTime);
            this.updateFxTrack(this.els.taLeftTrack, e.target);
        });
        this.els.taRightSlider.addEventListener('input', (e) => {
            const v = parseInt(e.target.value) / 10;
            this.els.taRightValue.textContent = v.toFixed(1) + ' мс';
            if (this.taDelayR) this.taDelayR.delayTime.setValueAtTime(v / 1000, this.audioContext.currentTime);
            this.updateFxTrack(this.els.taRightTrack, e.target);
        });
        this.els.taDistSlider.addEventListener('input', (e) => {
            const cm = parseInt(e.target.value);
            this.els.taDistValue.textContent = cm + ' см';
            const delayMs = (cm / 34300) * 1000;
            this.els.taLeftSlider.value = Math.round(delayMs * 10);
            this.els.taLeftValue.textContent = delayMs.toFixed(1) + ' мс';
            if (this.taDelayL) this.taDelayL.delayTime.setValueAtTime(delayMs / 1000, this.audioContext.currentTime);
            this.updateFxTrack(this.els.taLeftTrack, this.els.taLeftSlider);
            this.updateFxTrack(this.els.taDistTrack, e.target);
        });
        // DSP
        this.els.dspToggle.addEventListener('change', (e) => {
            this.dspOn = e.target.checked;
            this.els.dspBody.classList.toggle('disabled', !this.dspOn);
            this.rebuildAudioChain();
        });
        this.els.dspNoiseSlider.addEventListener('input', (e) => {
            this.els.dspNoiseValue.textContent = e.target.value + '%';
            if (this.dspNoiseGate) {
                const freq = 20 + (parseInt(e.target.value) / 100) * 400;
                this.dspNoiseGate.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            }
            this.updateFxTrack(this.els.dspNoiseTrack, e.target);
        });
        this.els.dspStereoSlider.addEventListener('input', (e) => {
            this.els.dspStereoValue.textContent = e.target.value + '%';
            this.applyStereoWidth(parseInt(e.target.value) / 100);
            this.updateFxTrack(this.els.dspStereoTrack, e.target);
        });
        this.els.dspDynBassSlider.addEventListener('input', (e) => {
            this.els.dspDynBassValue.textContent = e.target.value + ' dB';
            if (this.dspDynBassFilter) {
                this.dspDynBassFilter.gain.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            }
            this.updateFxTrack(this.els.dspDynBassTrack, e.target);
        });
        this.els.dspLoudnessSlider.addEventListener('input', (e) => {
            this.els.dspLoudnessValue.textContent = e.target.value + '%';
            this.applyLoudnessContour(parseInt(e.target.value) / 100);
            this.updateFxTrack(this.els.dspLoudnessTrack, e.target);
        });
        this.els.fxResetCrossover.addEventListener('click', () => this.resetCrossoverDsp());
    }

    bindSoundfieldEvents() {
        this.els.soundfieldToggle.addEventListener('change', (e) => {
            this.soundfieldOn = e.target.checked;
            this.els.soundfieldBody.classList.toggle('disabled', !this.soundfieldOn);
            this.rebuildAudioChain();
        });

        document.querySelectorAll('[data-sf]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.sf;
                this.applySfPreset(key);
            });
        });

        ['FL', 'FR', 'RL', 'RR'].forEach(ch => {
            this.els[`sf${ch}`].addEventListener('input', (e) => {
                this.els[`sf${ch}Value`].textContent = e.target.value + '%';
                this.updateFxTrack(this.els[`sf${ch}Track`], e.target);
                this.applySfGains();
                this.markSfCustom();
                this.drawCarDiagram();
            });
        });

        this.els.sfFaderSlider.addEventListener('input', (e) => {
            const v = parseInt(e.target.value);
            this.els.sfFaderValue.textContent = v === 0 ? 'Центр' : v > 0 ? `Фронт ${v}%` : `Тыл ${Math.abs(v)}%`;
            this.updateCenterTrack(this.els.sfFaderTrack, this.els.sfFaderSlider);
            this.applySfGains();
            this.markSfCustom();
        });

        this.els.sfSubSlider.addEventListener('input', (e) => {
            const db = parseFloat(e.target.value);
            this.els.sfSubValue.textContent = (db >= 0 ? '+' : '') + db.toFixed(1) + ' dB';
            if (this.sfSubGain) this.sfSubGain.gain.setValueAtTime(Math.pow(10, db/20), this.audioContext.currentTime);
            this.updateFxTrack(this.els.sfSubTrack, e.target);
        });
        this.els.sfSubFreqSlider.addEventListener('input', (e) => {
            this.els.sfSubFreqValue.textContent = e.target.value + ' Гц';
            if (this.sfSubFilter) this.sfSubFilter.frequency.setValueAtTime(parseInt(e.target.value), this.audioContext.currentTime);
            this.updateFxTrack(this.els.sfSubFreqTrack, e.target);
        });

        const fp = this.els.sfFocusPoint;
        const container = this.els.sfCanvas.parentElement;

        const startDrag = (e) => {
            e.preventDefault();
            this.isDraggingSF = true;
            fp.style.transition = 'none';
        };
        const doDrag = (e) => {
            if (!this.isDraggingSF) return;
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            let x = (clientX - rect.left) / rect.width;
            let y = (clientY - rect.top) / rect.height;
            x = Math.max(0.05, Math.min(0.95, x));
            y = Math.max(0.05, Math.min(0.95, y));
            this.sfFocusX = x;
            this.sfFocusY = y;
            fp.style.left = (x * 100) + '%';
            fp.style.top = (y * 100) + '%';
            this.updateSfFromFocus();
            this.markSfCustom();
            this.drawCarDiagram();
        };
        const endDrag = () => {
            this.isDraggingSF = false;
            fp.style.transition = '';
        };

        fp.addEventListener('mousedown', startDrag);
        fp.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);

        this.els.fxResetSoundfield.addEventListener('click', () => this.resetSoundfield());
    }
}

// Применяем миксины к прототипу
Object.assign(AuroraPlayer.prototype, eqMethods);
Object.assign(AuroraPlayer.prototype, effectsMethods);
Object.assign(AuroraPlayer.prototype, advancedMethods);
Object.assign(AuroraPlayer.prototype, crossoverMethods);
Object.assign(AuroraPlayer.prototype, soundfieldMethods);
Object.assign(AuroraPlayer.prototype, playlistMethods);
Object.assign(AuroraPlayer.prototype, visualizerMethods);
Object.assign(AuroraPlayer.prototype, uiMethods);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.player = new AuroraPlayer();
});