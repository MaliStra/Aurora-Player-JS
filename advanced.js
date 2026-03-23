import { REVERB_PRESETS } from './constants.js';

export const advancedMethods = {
    applyCompressor() { this.rebuildAudioChain(); },
    applyReverb() { this.rebuildAudioChain(); },
    applyDistortion() { this.rebuildAudioChain(); },
    applyFilters() { this.rebuildAudioChain(); },
    applyTremolo() { this.rebuildAudioChain(); },
    applyKaraoke() { this.rebuildAudioChain(); },
    applyAutoGain() { this.rebuildAudioChain(); },

    generateReverb() {
        if (!this.audioContext) return;
        const size = parseInt(this.els.reverbSizeSlider.value) / 10;
        const decay = parseInt(this.els.reverbDecaySlider.value) / 100;
        const rate = this.audioContext.sampleRate;
        const length = Math.max(rate * size, rate * 0.1);
        const buffer = this.audioContext.createBuffer(2, length, rate);

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay * 3 + 1);
            }
        }
        this.convolverNode.buffer = buffer;
    },

    makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    },

    applyStereoWidth(ratio) {
        if (!this.isContextCreated) return;
        if (this.dspMidGain) this.dspMidGain.gain.value = 1;
        if (this.dspSideGain) this.dspSideGain.gain.value = ratio;
    },

    applyLoudnessContour(amount) {
        if (!this.isContextCreated) return;
        if (this.dspLoudnessLow) this.dspLoudnessLow.gain.setValueAtTime(amount * 8, this.audioContext.currentTime);
        if (this.dspLoudnessHigh) this.dspLoudnessHigh.gain.setValueAtTime(amount * 4, this.audioContext.currentTime);
    },

    resetAdvancedFx() {
        this.els.compressorToggle.checked = false;
        this.compressorOn = false;
        this.els.compressorBody.classList.add('disabled');
        this.els.compThresholdSlider.value = -24;
        this.els.compKneeSlider.value = 30;
        this.els.compRatioSlider.value = 12;
        this.els.compAttackSlider.value = 3;
        this.els.compReleaseSlider.value = 250;
        this.els.compThresholdValue.textContent = '-24 dB';
        this.els.compKneeValue.textContent = '30 dB';
        this.els.compRatioValue.textContent = '12:1';
        this.els.compAttackValue.textContent = '3 мс';
        this.els.compReleaseValue.textContent = '250 мс';

        this.els.reverbToggle.checked = false;
        this.reverbOn = false;
        this.els.reverbBody.classList.add('disabled');
        this.els.reverbSizeSlider.value = 20;
        this.els.reverbDecaySlider.value = 50;
        this.els.reverbMixSlider.value = 30;
        this.els.reverbSizeValue.textContent = '2.0 с';
        this.els.reverbDecayValue.textContent = '50%';
        this.els.reverbMixValue.textContent = '30%';
        document.querySelectorAll('[data-reverb]').forEach(b => b.classList.remove('active'));

        this.els.distortionToggle.checked = false;
        this.distortionOn = false;
        this.els.distortionBody.classList.add('disabled');
        this.els.distAmountSlider.value = 50;
        this.els.distToneSlider.value = 3000;
        this.els.distMixSlider.value = 50;
        this.els.distAmountValue.textContent = '50';
        this.els.distToneValue.textContent = '3К Гц';
        this.els.distMixValue.textContent = '50%';

        this.els.filtersToggle.checked = false;
        this.filtersOn = false;
        this.els.filtersBody.classList.add('disabled');
        this.els.hpfSlider.value = 20;
        this.els.lpfSlider.value = 20000;
        this.els.filterQSlider.value = 7;
        this.els.hpfValue.textContent = '20 Гц';
        this.els.lpfValue.textContent = '20000 Гц';
        this.els.filterQValue.textContent = '0.7';

        this.els.tremoloToggle.checked = false;
        this.tremoloOn = false;
        this.els.tremoloBody.classList.add('disabled');
        this.els.tremoloRateSlider.value = 50;
        this.els.tremoloDepthSlider.value = 50;
        this.els.tremoloRateValue.textContent = '5.0 Гц';
        this.els.tremoloDepthValue.textContent = '50%';

        this.els.karaokeToggle.checked = false;
        this.karaokeOn = false;
        this.els.karaokeBody.classList.add('disabled');
        this.els.karaokeAmountSlider.value = 100;
        this.els.karaokeLowSlider.value = 100;
        this.els.karaokeHighSlider.value = 8000;
        this.els.karaokeAmountValue.textContent = '100%';
        this.els.karaokeLowValue.textContent = '100 Гц';
        this.els.karaokeHighValue.textContent = '8000 Гц';

        this.els.autoGainToggle.checked = false;
        this.autoGainOn = false;
        this.els.autoGainBody.classList.add('disabled');
        this.els.autoGainSlider.value = 0;
        this.els.limiterCeilingSlider.value = -1;
        this.els.autoGainValue.textContent = '0 dB';
        this.els.limiterCeilingValue.textContent = '-1 dB';

        this.updateAllAdvancedTracks();
        this.rebuildAudioChain();
    },

    updateAllAdvancedTracks() {
        this.updateFxTrack(this.els.compThresholdTrack, this.els.compThresholdSlider);
        this.updateFxTrack(this.els.compKneeTrack, this.els.compKneeSlider);
        this.updateFxTrack(this.els.compRatioTrack, this.els.compRatioSlider);
        this.updateFxTrack(this.els.compAttackTrack, this.els.compAttackSlider);
        this.updateFxTrack(this.els.compReleaseTrack, this.els.compReleaseSlider);
        this.updateFxTrack(this.els.reverbSizeTrack, this.els.reverbSizeSlider);
        this.updateFxTrack(this.els.reverbDecayTrack, this.els.reverbDecaySlider);
        this.updateFxTrack(this.els.reverbMixTrack, this.els.reverbMixSlider);
        this.updateFxTrack(this.els.distAmountTrack, this.els.distAmountSlider);
        this.updateFxTrack(this.els.distToneTrack, this.els.distToneSlider);
        this.updateFxTrack(this.els.distMixTrack, this.els.distMixSlider);
        this.updateFxTrack(this.els.hpfTrack, this.els.hpfSlider);
        this.updateFxTrack(this.els.lpfTrack, this.els.lpfSlider);
        this.updateFxTrack(this.els.filterQTrack, this.els.filterQSlider);
        this.updateFxTrack(this.els.tremoloRateTrack, this.els.tremoloRateSlider);
        this.updateFxTrack(this.els.tremoloDepthTrack, this.els.tremoloDepthSlider);
        this.updateFxTrack(this.els.karaokeAmountTrack, this.els.karaokeAmountSlider);
        this.updateFxTrack(this.els.karaokeLowTrack, this.els.karaokeLowSlider);
        this.updateFxTrack(this.els.karaokeHighTrack, this.els.karaokeHighSlider);
        this.updateFxTrack(this.els.autoGainTrack, this.els.autoGainSlider);
        this.updateFxTrack(this.els.limiterCeilingTrack, this.els.limiterCeilingSlider);
    }
};