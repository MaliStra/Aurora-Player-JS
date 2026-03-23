export const crossoverMethods = {
    drawXoverVisual() {
        const canvas = this.els.xoverCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const freq = parseInt(this.els.xoverFreqSlider.value);
        const logMin = Math.log10(20);
        const logMax = Math.log10(20000);
        const freqToX = (f) => ((Math.log10(f) - logMin) / (logMax - logMin)) * w;
        const xoverX = freqToX(freq);

        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(xoverX - 20, 10);
        ctx.quadraticCurveTo(xoverX, 10, xoverX + 10, h - 10);
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xoverX - 10, h - 10);
        ctx.quadraticCurveTo(xoverX, 10, xoverX + 20, 10);
        ctx.lineTo(w, 10);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xoverX, 0);
        ctx.lineTo(xoverX, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(124, 58, 237, 0.7)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LOW', xoverX / 2, h - 5);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
        ctx.fillText('HIGH', (xoverX + w) / 2, h - 5);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(freq + ' Гц', xoverX, h - 5);
    },

    resetCrossoverDsp() {
        this.els.crossoverToggle.checked = false;
        this.crossoverOn = false;
        this.els.crossoverBody.classList.add('disabled');
        this.els.xoverFreqSlider.value = 250;
        this.els.xoverSlopeSlider.value = 2;
        this.els.xoverLowGainSlider.value = 0;
        this.els.xoverHighGainSlider.value = 0;
        this.els.xoverFreqValue.textContent = '250 Гц';
        this.els.xoverSlopeValue.textContent = '12 дБ/окт';
        this.els.xoverLowGainValue.textContent = '0 dB';
        this.els.xoverHighGainValue.textContent = '0 dB';

        this.els.bandpassToggle.checked = false;
        this.bandpassOn = false;
        this.els.bandpassBody.classList.add('disabled');
        this.els.bpLowSlider.value = 20;
        this.els.bpHighSlider.value = 20000;
        this.els.bpSlopeSlider.value = 2;
        this.els.bpLowValue.textContent = '20 Гц';
        this.els.bpHighValue.textContent = '20000 Гц';
        this.els.bpSlopeValue.textContent = '12 дБ/окт';

        this.els.timeAlignToggle.checked = false;
        this.timeAlignOn = false;
        this.els.timeAlignBody.classList.add('disabled');
        this.els.taLeftSlider.value = 0;
        this.els.taRightSlider.value = 0;
        this.els.taDistSlider.value = 0;
        this.els.taLeftValue.textContent = '0.0 мс';
        this.els.taRightValue.textContent = '0.0 мс';
        this.els.taDistValue.textContent = '0 см';

        this.els.dspToggle.checked = false;
        this.dspOn = false;
        this.els.dspBody.classList.add('disabled');
        this.els.dspNoiseSlider.value = 0;
        this.els.dspStereoSlider.value = 100;
        this.els.dspDynBassSlider.value = 0;
        this.els.dspLoudnessSlider.value = 0;
        this.els.dspNoiseValue.textContent = '0%';
        this.els.dspStereoValue.textContent = '100%';
        this.els.dspDynBassValue.textContent = '0 dB';
        this.els.dspLoudnessValue.textContent = '0%';

        this.updateAllCrossoverTracks();
        this.drawXoverVisual();
        this.rebuildAudioChain();
    },

    updateAllCrossoverTracks() {
        this.updateFxTrack(this.els.xoverFreqTrack, this.els.xoverFreqSlider);
        this.updateFxTrack(this.els.xoverSlopeTrack, this.els.xoverSlopeSlider);
        this.updateCenterTrack(this.els.xoverLowGainTrack, this.els.xoverLowGainSlider);
        this.updateCenterTrack(this.els.xoverHighGainTrack, this.els.xoverHighGainSlider);
        this.updateFxTrack(this.els.bpLowTrack, this.els.bpLowSlider);
        this.updateFxTrack(this.els.bpHighTrack, this.els.bpHighSlider);
        this.updateFxTrack(this.els.bpSlopeTrack, this.els.bpSlopeSlider);
        this.updateFxTrack(this.els.taLeftTrack, this.els.taLeftSlider);
        this.updateFxTrack(this.els.taRightTrack, this.els.taRightSlider);
        this.updateFxTrack(this.els.taDistTrack, this.els.taDistSlider);
        this.updateFxTrack(this.els.dspNoiseTrack, this.els.dspNoiseSlider);
        this.updateFxTrack(this.els.dspStereoTrack, this.els.dspStereoSlider);
        this.updateFxTrack(this.els.dspDynBassTrack, this.els.dspDynBassSlider);
        this.updateFxTrack(this.els.dspLoudnessTrack, this.els.dspLoudnessSlider);
    }
};