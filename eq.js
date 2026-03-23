import { EQ_PRESETS, EQ_LABELS } from './constants.js';

export const eqMethods = {
    buildEqBands() {
        const container = this.els.eqBands;
        EQ_LABELS.forEach((label, i) => {
            const band = document.createElement('div');
            band.className = 'eq-band';
            band.innerHTML = `
                <span class="eq-db" id="eqDb${i}">0</span>
                <div class="eq-slider-wrap">
                    <input type="range" min="-12" max="12" value="0" step="0.5"
                           data-band="${i}" class="eq-band-slider">
                </div>
                <span class="eq-freq">${label}</span>
            `;
            container.appendChild(band);
        });
    },

    setEqBand(band, value) {
        this.eqValues[band] = value;
        document.getElementById(`eqDb${band}`).textContent = value > 0 ? `+${value}` : value;
        if (this.isContextCreated && this.eqFilters[band]) {
            this.eqFilters[band].gain.setValueAtTime(value, this.audioContext.currentTime);
        }
        this.detectPreset();
    },

    applyEqPreset(key) {
        const preset = EQ_PRESETS[key];
        if (!preset) return;
        this.els.eqPreset.value = key;
        preset.values.forEach((val, i) => {
            this.eqValues[i] = val;
            const slider = document.querySelector(`.eq-band-slider[data-band="${i}"]`);
            if (slider) slider.value = val;
            document.getElementById(`eqDb${i}`).textContent = val > 0 ? `+${val}` : val;
            if (this.isContextCreated && this.eqFilters[i]) {
                this.eqFilters[i].gain.setValueAtTime(val, this.audioContext.currentTime);
            }
        });
    },

    detectPreset() {
        for (const [key, preset] of Object.entries(EQ_PRESETS)) {
            if (preset.values.every((v, i) => Math.abs(v - this.eqValues[i]) < 0.1)) {
                this.els.eqPreset.value = key;
                return;
            }
        }
        this.els.eqPreset.value = '';
    }
};