import { EQ_FREQUENCIES } from './constants.js';

export function createAllNodes(ctx, self) {
    // EQ filters
    self.eqFilters = EQ_FREQUENCIES.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? 'lowshelf' : (i === 9 ? 'highshelf' : 'peaking');
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = self.eqValues[i];
        return filter;
    });

    // Bass boost
    self.bassBoostFilter = ctx.createBiquadFilter();
    self.bassBoostFilter.type = 'lowshelf';
    self.bassBoostFilter.frequency.value = 150;
    self.bassBoostFilter.gain.value = self.bassBoostVal;

    // Panner
    self.pannerNode = ctx.createStereoPanner();
    self.pannerNode.pan.value = self.balanceVal;

    // Delay/Echo
    self.delayNode = ctx.createDelay(2);
    self.feedbackGainNode = ctx.createGain();
    self.wetGainNode = ctx.createGain();
    self.dryGainNode = ctx.createGain();
    self.delayNode.delayTime.value = self.echoDelayVal / 1000;
    self.feedbackGainNode.gain.value = self.echoFeedbackVal / 100;
    self.wetGainNode.gain.value = self.echoMixVal / 100;
    self.dryGainNode.gain.value = 1;

    // Compressor
    self.compressorNode = ctx.createDynamicsCompressor();
    self.compressorNode.threshold.value = parseFloat(self.els.compThresholdSlider.value);
    self.compressorNode.knee.value = parseFloat(self.els.compKneeSlider.value);
    self.compressorNode.ratio.value = parseFloat(self.els.compRatioSlider.value);
    self.compressorNode.attack.value = parseFloat(self.els.compAttackSlider.value) / 1000;
    self.compressorNode.release.value = parseFloat(self.els.compReleaseSlider.value) / 1000;

    // Reverb
    self.convolverNode = ctx.createConvolver();
    self.reverbWetGain = ctx.createGain();
    self.reverbDryGain = ctx.createGain();
    self.reverbWetGain.gain.value = 0.3;
    self.reverbDryGain.gain.value = 0.85;
    // generateReverb() will be called separately

    // Distortion
    self.waveshaperNode = ctx.createWaveShaper();
    self.waveshaperNode.oversample = '4x';
    self.waveshaperNode.curve = self.makeDistortionCurve(50);
    self.distToneFilter = ctx.createBiquadFilter();
    self.distToneFilter.type = 'lowpass';
    self.distToneFilter.frequency.value = 3000;
    self.distDryGain = ctx.createGain();
    self.distWetGain = ctx.createGain();
    self.distDryGain.gain.value = 0.5;
    self.distWetGain.gain.value = 0.5;

    // HPF / LPF
    self.hpfNode = ctx.createBiquadFilter();
    self.hpfNode.type = 'highpass';
    self.hpfNode.frequency.value = 20;
    self.hpfNode.Q.value = 0.7;
    self.lpfNode = ctx.createBiquadFilter();
    self.lpfNode.type = 'lowpass';
    self.lpfNode.frequency.value = 20000;
    self.lpfNode.Q.value = 0.7;

    // Tremolo
    self.tremoloGain = ctx.createGain();
    self.tremoloGain.gain.value = 0.5;
    self.tremoloOsc = ctx.createOscillator();
    self.tremoloOsc.type = 'sine';
    self.tremoloOsc.frequency.value = 5;
    self.tremoloOsc.start();

    // Karaoke
    self.karaokeSplitter = ctx.createChannelSplitter(2);
    self.karaokeMerger = ctx.createChannelMerger(2);
    self.karaokeGainL = ctx.createGain();
    self.karaokeGainR = ctx.createGain();
    self.karaokeInvertGain = ctx.createGain();
    self.karaokeInvertGain.gain.value = -1;
    self.karaokeLowFilter = ctx.createBiquadFilter();
    self.karaokeLowFilter.type = 'highpass';
    self.karaokeLowFilter.frequency.value = 100;
    self.karaokeHighFilter = ctx.createBiquadFilter();
    self.karaokeHighFilter.type = 'lowpass';
    self.karaokeHighFilter.frequency.value = 8000;
    self.karaokeMixGain = ctx.createGain();
    self.karaokeMixGain.gain.value = 1;
    self.karaokeBypassGain = ctx.createGain();
    self.karaokeBypassGain.gain.value = 0;

    // Auto Gain / Limiter
    self.autoGainNode = ctx.createGain();
    self.autoGainNode.gain.value = 1;
    self.limiterNode = ctx.createDynamicsCompressor();
    self.limiterNode.threshold.value = -1;
    self.limiterNode.knee.value = 0;
    self.limiterNode.ratio.value = 20;
    self.limiterNode.attack.value = 0.001;
    self.limiterNode.release.value = 0.1;

    // ===== CROSSOVER NODES =====
    self.xoverLPF = ctx.createBiquadFilter();
    self.xoverLPF.type = 'lowpass';
    self.xoverLPF.frequency.value = 250;
    self.xoverLPF.Q.value = 0.707;
    self.xoverHPF = ctx.createBiquadFilter();
    self.xoverHPF.type = 'highpass';
    self.xoverHPF.frequency.value = 250;
    self.xoverHPF.Q.value = 0.707;
    self.xoverLowGain = ctx.createGain();
    self.xoverLowGain.gain.value = 1;
    self.xoverHighGain = ctx.createGain();
    self.xoverHighGain.gain.value = 1;
    self.xoverMerger = ctx.createGain();

    // Bandpass
    self.bpHPF = ctx.createBiquadFilter();
    self.bpHPF.type = 'highpass';
    self.bpHPF.frequency.value = 20;
    self.bpHPF.Q.value = 0.707;
    self.bpLPF = ctx.createBiquadFilter();
    self.bpLPF.type = 'lowpass';
    self.bpLPF.frequency.value = 20000;
    self.bpLPF.Q.value = 0.707;

    // Time Alignment
    self.taSplitter = ctx.createChannelSplitter(2);
    self.taMerger = ctx.createChannelMerger(2);
    self.taDelayL = ctx.createDelay(1);
    self.taDelayR = ctx.createDelay(1);
    self.taDelayL.delayTime.value = 0;
    self.taDelayR.delayTime.value = 0;

    // DSP
    self.dspNoiseGate = ctx.createBiquadFilter();
    self.dspNoiseGate.type = 'highpass';
    self.dspNoiseGate.frequency.value = 20;
    self.dspNoiseGate.Q.value = 0.5;

    self.dspStereoSplitter = ctx.createChannelSplitter(2);
    self.dspStereoMerger = ctx.createChannelMerger(2);
    self.dspMidGain = ctx.createGain();
    self.dspMidGain.gain.value = 1;
    self.dspSideGain = ctx.createGain();
    self.dspSideGain.gain.value = 1;

    self.dspDynBassFilter = ctx.createBiquadFilter();
    self.dspDynBassFilter.type = 'lowshelf';
    self.dspDynBassFilter.frequency.value = 100;
    self.dspDynBassFilter.gain.value = 0;

    self.dspLoudnessLow = ctx.createBiquadFilter();
    self.dspLoudnessLow.type = 'lowshelf';
    self.dspLoudnessLow.frequency.value = 80;
    self.dspLoudnessLow.gain.value = 0;
    self.dspLoudnessHigh = ctx.createBiquadFilter();
    self.dspLoudnessHigh.type = 'highshelf';
    self.dspLoudnessHigh.frequency.value = 12000;
    self.dspLoudnessHigh.gain.value = 0;

    // Sound field
    self.sfSplitter = ctx.createChannelSplitter(2);
    self.sfMerger = ctx.createChannelMerger(2);
    self.sfGainFL = ctx.createGain();
    self.sfGainFR = ctx.createGain();
    self.sfSubFilter = ctx.createBiquadFilter();
    self.sfSubFilter.type = 'lowpass';
    self.sfSubFilter.frequency.value = 80;
    self.sfSubGain = ctx.createGain();
    self.sfSubGain.gain.value = 1;
}

export function buildAudioChain(ctx, self) {
    // Disconnect everything first
    try { self.source.disconnect(); } catch(e) {}

    let chain = self.source;

    // EQ
    self.eqFilters.forEach(f => { chain.connect(f); chain = f; });

    // Bass boost
    chain.connect(self.bassBoostFilter);
    chain = self.bassBoostFilter;

    // Compressor (if on)
    if (self.compressorOn) {
        chain.connect(self.compressorNode);
        chain = self.compressorNode;
    }

    // Filters (if on)
    if (self.filtersOn) {
        chain.connect(self.hpfNode);
        self.hpfNode.connect(self.lpfNode);
        chain = self.lpfNode;
    }

    // Crossover (if on)
    if (self.crossoverOn) {
        const xInput = ctx.createGain();
        chain.connect(xInput);
        xInput.connect(self.xoverLPF);
        xInput.connect(self.xoverHPF);
        self.xoverLPF.connect(self.xoverLowGain);
        self.xoverHPF.connect(self.xoverHighGain);
        self.xoverLowGain.connect(self.xoverMerger);
        self.xoverHighGain.connect(self.xoverMerger);
        chain = self.xoverMerger;
    }

    // Bandpass (if on)
    if (self.bandpassOn) {
        chain.connect(self.bpHPF);
        self.bpHPF.connect(self.bpLPF);
        chain = self.bpLPF;
    }

    // Distortion (if on)
    if (self.distortionOn) {
        const distInput = ctx.createGain();
        chain.connect(distInput);
        distInput.connect(self.waveshaperNode);
        self.waveshaperNode.connect(self.distToneFilter);
        self.distToneFilter.connect(self.distWetGain);
        distInput.connect(self.distDryGain);
        const distMerge = ctx.createGain();
        self.distWetGain.connect(distMerge);
        self.distDryGain.connect(distMerge);
        chain = distMerge;
    }

    // DSP (if on)
    if (self.dspOn) {
        chain.connect(self.dspNoiseGate);
        self.dspNoiseGate.connect(self.dspDynBassFilter);
        self.dspDynBassFilter.connect(self.dspLoudnessLow);
        self.dspLoudnessLow.connect(self.dspLoudnessHigh);
        chain = self.dspLoudnessHigh;
    }

    // Balance
    chain.connect(self.pannerNode);
    chain = self.pannerNode;

    // Time Alignment (if on)
    if (self.timeAlignOn) {
        chain.connect(self.taSplitter);
        self.taSplitter.connect(self.taDelayL, 0);
        self.taSplitter.connect(self.taDelayR, 1);
        self.taDelayL.connect(self.taMerger, 0, 0);
        self.taDelayR.connect(self.taMerger, 0, 1);
        chain = self.taMerger;
    }

    // Sound field (if on)
    if (self.soundfieldOn) {
        chain.connect(self.sfSplitter);
        self.sfSplitter.connect(self.sfGainFL, 0);
        self.sfSplitter.connect(self.sfGainFR, 1);
        self.sfGainFL.connect(self.sfMerger, 0, 0);
        self.sfGainFR.connect(self.sfMerger, 0, 1);
        // Sub
        chain.connect(self.sfSubFilter);
        self.sfSubFilter.connect(self.sfSubGain);
        self.sfSubGain.connect(self.sfMerger, 0, 0);
        self.sfSubGain.connect(self.sfMerger, 0, 1);
        chain = self.sfMerger;
    }

    // Karaoke (if on)
    if (self.karaokeOn) {
        const karaokeInput = ctx.createGain();
        chain.connect(karaokeInput);
        karaokeInput.connect(self.karaokeSplitter);
        self.karaokeSplitter.connect(self.karaokeGainL, 0);
        self.karaokeSplitter.connect(self.karaokeGainR, 1);
        self.karaokeGainR.connect(self.karaokeInvertGain);
        const sumNode = ctx.createGain();
        self.karaokeGainL.connect(sumNode);
        self.karaokeInvertGain.connect(sumNode);
        sumNode.connect(self.karaokeLowFilter);
        self.karaokeLowFilter.connect(self.karaokeHighFilter);
        self.karaokeHighFilter.connect(self.karaokeMixGain);
        const karaokeMerge = ctx.createChannelMerger(2);
        self.karaokeMixGain.connect(karaokeMerge, 0, 0);
        self.karaokeMixGain.connect(karaokeMerge, 0, 1);
        karaokeInput.connect(self.karaokeBypassGain);
        const karaokeOut = ctx.createGain();
        karaokeMerge.connect(karaokeOut);
        self.karaokeBypassGain.connect(karaokeOut);
        chain = karaokeOut;
    }

    // Echo/Delay
    const echoMerge = ctx.createGain();
    chain.connect(self.dryGainNode);
    chain.connect(self.delayNode);
    self.delayNode.connect(self.feedbackGainNode);
    self.feedbackGainNode.connect(self.delayNode);
    self.delayNode.connect(self.wetGainNode);
    self.dryGainNode.connect(echoMerge);
    self.wetGainNode.connect(echoMerge);
    chain = echoMerge;

    // Reverb (if on)
    if (self.reverbOn) {
        const reverbInput = ctx.createGain();
        chain.connect(reverbInput);
        reverbInput.connect(self.reverbDryGain);
        reverbInput.connect(self.convolverNode);
        self.convolverNode.connect(self.reverbWetGain);
        const reverbMerge = ctx.createGain();
        self.reverbDryGain.connect(reverbMerge);
        self.reverbWetGain.connect(reverbMerge);
        chain = reverbMerge;
    }

    // Tremolo (if on)
    if (self.tremoloOn) {
        const tremoloTarget = ctx.createGain();
        tremoloTarget.gain.value = 1;
        chain.connect(tremoloTarget);
        try { self.tremoloOsc.disconnect(); } catch(e) {}
        self.tremoloOsc.connect(self.tremoloGain);
        self.tremoloGain.connect(tremoloTarget.gain);
        chain = tremoloTarget;
    }

    // Auto Gain / Limiter (if on)
    if (self.autoGainOn) {
        chain.connect(self.autoGainNode);
        self.autoGainNode.connect(self.limiterNode);
        chain = self.limiterNode;
    }

    // Analyser -> output
    chain.connect(self.analyser);
    self.analyser.connect(ctx.destination);
}

export function rebuildAudioChain(ctx, self) {
    if (!self.isContextCreated) return;
    const nodes = [
        self.source, ...self.eqFilters, self.bassBoostFilter, self.pannerNode,
        self.delayNode, self.feedbackGainNode, self.wetGainNode, self.dryGainNode,
        self.compressorNode, self.convolverNode, self.reverbWetGain, self.reverbDryGain,
        self.waveshaperNode, self.distToneFilter, self.distDryGain, self.distWetGain,
        self.hpfNode, self.lpfNode,
        self.tremoloGain, self.tremoloOsc,
        self.karaokeSplitter, self.karaokeGainL, self.karaokeGainR,
        self.karaokeInvertGain, self.karaokeLowFilter, self.karaokeHighFilter,
        self.karaokeMixGain, self.karaokeBypassGain,
        self.autoGainNode, self.limiterNode, self.analyser,
        self.xoverLPF, self.xoverHPF, self.xoverLowGain, self.xoverHighGain, self.xoverMerger,
        self.bpHPF, self.bpLPF,
        self.taSplitter, self.taMerger, self.taDelayL, self.taDelayR,
        self.dspNoiseGate, self.dspDynBassFilter, self.dspLoudnessLow, self.dspLoudnessHigh,
        self.sfSplitter, self.sfMerger, self.sfGainFL, self.sfGainFR, self.sfSubFilter, self.sfSubGain
    ];
    nodes.forEach(n => { try { if (n) n.disconnect(); } catch(e) {} });
    buildAudioChain(ctx, self);
}