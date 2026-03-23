export const effectsMethods = {
    setSpeed(val) {
        this.speedVal = val;
        this.audio.playbackRate = val;
        this.els.speedValue.textContent = val.toFixed(2) + 'x';
        this.updateFxTrack(this.els.speedTrack, this.els.speedSlider);
    },

    setBalance(val) {
        this.balanceVal = val;
        if (this.isContextCreated && this.pannerNode) {
            this.pannerNode.pan.setValueAtTime(val, this.audioContext.currentTime);
        }
        if (val === 0) this.els.balanceValue.textContent = 'Центр';
        else if (val < 0) this.els.balanceValue.textContent = `L ${Math.round(Math.abs(val) * 100)}%`;
        else this.els.balanceValue.textContent = `R ${Math.round(val * 100)}%`;
        this.updateBalanceTrack();
    },

    setBassBoost(val) {
        this.bassBoostVal = val;
        this.els.bassValue.textContent = val + ' dB';
        if (this.isContextCreated && this.bassBoostFilter) {
            this.bassBoostFilter.gain.setValueAtTime(val, this.audioContext.currentTime);
        }
        this.updateFxTrack(this.els.bassTrack, this.els.bassSlider);
    },

    setEchoDelay(val) {
        this.echoDelayVal = val;
        this.els.echoDelayValue.textContent = val + ' мс';
        if (this.isContextCreated && this.delayNode) {
            this.delayNode.delayTime.setValueAtTime(val / 1000, this.audioContext.currentTime);
        }
        this.updateFxTrack(this.els.echoDelayTrack, this.els.echoDelaySlider);
    },

    setEchoFeedback(val) {
        this.echoFeedbackVal = val;
        this.els.echoFeedbackValue.textContent = val + '%';
        if (this.isContextCreated && this.feedbackGainNode) {
            this.feedbackGainNode.gain.setValueAtTime(val / 100, this.audioContext.currentTime);
        }
        this.updateFxTrack(this.els.echoFeedbackTrack, this.els.echoFeedbackSlider);
    },

    setEchoMix(val) {
        this.echoMixVal = val;
        this.els.echoMixValue.textContent = val + '%';
        if (this.isContextCreated && this.wetGainNode) {
            this.wetGainNode.gain.setValueAtTime(val / 100, this.audioContext.currentTime);
        }
        this.updateFxTrack(this.els.echoMixTrack, this.els.echoMixSlider);
    },

    resetEcho() {
        this.els.echoDelaySlider.value = 0;
        this.els.echoFeedbackSlider.value = 0;
        this.els.echoMixSlider.value = 0;
        this.setEchoDelay(0);
        this.setEchoFeedback(0);
        this.setEchoMix(0);
    },

    resetAllFx() {
        this.applyEqPreset('flat');
        this.els.speedSlider.value = 100;
        this.setSpeed(1);
        this.els.balanceSlider.value = 0;
        this.setBalance(0);
        this.els.bassSlider.value = 0;
        this.setBassBoost(0);
        this.resetEcho();
    }
};