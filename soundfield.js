import { SF_PRESETS } from './constants.js';

export const soundfieldMethods = {
    applySfPreset(key) {
        const preset = SF_PRESETS[key];
        if (!preset) return;

        this.sfCurrentPreset = key;
        document.querySelectorAll('[data-sf]').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-sf="${key}"]`).classList.add('active');

        this.els.sfFL.value = preset.fl;
        this.els.sfFR.value = preset.fr;
        this.els.sfRL.value = preset.rl;
        this.els.sfRR.value = preset.rr;
        this.els.sfFLValue.textContent = preset.fl + '%';
        this.els.sfFRValue.textContent = preset.fr + '%';
        this.els.sfRLValue.textContent = preset.rl + '%';
        this.els.sfRRValue.textContent = preset.rr + '%';
        this.els.sfFaderSlider.value = preset.fader;
        const v = preset.fader;
        this.els.sfFaderValue.textContent = v === 0 ? 'Центр' : v > 0 ? `Фронт ${v}%` : `Тыл ${Math.abs(v)}%`;

        this.sfFocusX = preset.focusX;
        this.sfFocusY = preset.focusY;
        this.els.sfFocusPoint.style.left = (preset.focusX * 100) + '%';
        this.els.sfFocusPoint.style.top = (preset.focusY * 100) + '%';

        ['FL', 'FR', 'RL', 'RR'].forEach(ch => {
            this.updateFxTrack(this.els[`sf${ch}Track`], this.els[`sf${ch}`]);
        });
        this.updateCenterTrack(this.els.sfFaderTrack, this.els.sfFaderSlider);
        this.applySfGains();
        this.drawCarDiagram();
    },

    applySfGains() {
        if (!this.isContextCreated) return;
        const fl = parseInt(this.els.sfFL.value) / 100;
        const fr = parseInt(this.els.sfFR.value) / 100;
        if (this.sfGainFL) this.sfGainFL.gain.setValueAtTime(fl, this.audioContext.currentTime);
        if (this.sfGainFR) this.sfGainFR.gain.setValueAtTime(fr, this.audioContext.currentTime);
    },

    updateSfFromFocus() {
        const x = this.sfFocusX;
        const y = this.sfFocusY;
        const fl = Math.round(Math.max(20, 100 - Math.hypot(x, y) * 60));
        const fr = Math.round(Math.max(20, 100 - Math.hypot(1-x, y) * 60));
        const rl = Math.round(Math.max(20, 100 - Math.hypot(x, 1-y) * 60));
        const rr = Math.round(Math.max(20, 100 - Math.hypot(1-x, 1-y) * 60));

        this.els.sfFL.value = fl;
        this.els.sfFR.value = fr;
        this.els.sfRL.value = rl;
        this.els.sfRR.value = rr;
        this.els.sfFLValue.textContent = fl + '%';
        this.els.sfFRValue.textContent = fr + '%';
        this.els.sfRLValue.textContent = rl + '%';
        this.els.sfRRValue.textContent = rr + '%';

        ['FL', 'FR', 'RL', 'RR'].forEach(ch => {
            this.updateFxTrack(this.els[`sf${ch}Track`], this.els[`sf${ch}`]);
        });
        this.applySfGains();
    },

    markSfCustom() {
        document.querySelectorAll('[data-sf]').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-sf="custom"]').classList.add('active');
        this.sfCurrentPreset = 'custom';
    },

    drawCarDiagram() {
        const canvas = this.els.sfCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        const carX = 40, carY = 20, carW = w - 80, carH = h - 40, r = 20;
        ctx.beginPath();
        ctx.moveTo(carX + r, carY);
        ctx.lineTo(carX + carW - r, carY);
        ctx.quadraticCurveTo(carX + carW, carY, carX + carW, carY + r);
        ctx.lineTo(carX + carW, carY + carH - r);
        ctx.quadraticCurveTo(carX + carW, carY + carH, carX + carW - r, carY + carH);
        ctx.lineTo(carX + r, carY + carH);
        ctx.quadraticCurveTo(carX, carY + carH, carX, carY + carH - r);
        ctx.lineTo(carX, carY + r);
        ctx.quadraticCurveTo(carX, carY, carX + r, carY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(carX + 45, carY + 50, 12, 0, Math.PI * 2);
        ctx.stroke();

        const seats = [
            { x: carX + 45, y: carY + 50, label: 'FL' },
            { x: carX + carW - 45, y: carY + 50, label: 'FR' },
            { x: carX + 45, y: carY + carH - 45, label: 'RL' },
            { x: carX + carW - 45, y: carY + carH - 45, label: 'RR' }
        ];
        const levels = {
            FL: parseInt(this.els.sfFL.value),
            FR: parseInt(this.els.sfFR.value),
            RL: parseInt(this.els.sfRL.value),
            RR: parseInt(this.els.sfRR.value)
        };

        seats.forEach(seat => {
            const level = levels[seat.label] / 100;
            const alpha = 0.1 + level * 0.5;
            const grad = ctx.createRadialGradient(seat.x, seat.y, 0, seat.x, seat.y, 25);
            grad.addColorStop(0, `rgba(124, 58, 237, ${alpha})`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(seat.x - 25, seat.y - 25, 50, 50);

            ctx.beginPath();
            ctx.arc(seat.x, seat.y, 5 + level * 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(167, 139, 250, ${0.3 + level * 0.7})`;
            ctx.fill();

            ctx.fillStyle = `rgba(255,255,255, ${0.4 + level * 0.4})`;
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(seat.label, seat.x, seat.y + 20);
            ctx.fillText(levels[seat.label] + '%', seat.x, seat.y + 30);
        });

        const fx = carX + this.sfFocusX * carW;
        const fy = carY + this.sfFocusY * carH;
        for (let i = 3; i > 0; i--) {
            ctx.beginPath();
            ctx.arc(fx, fy, i * 12, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 * (4 - i)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    },

    resetSoundfield() {
        this.els.soundfieldToggle.checked = false;
        this.soundfieldOn = false;
        this.els.soundfieldBody.classList.add('disabled');
        this.applySfPreset('center');
        this.els.sfSubSlider.value = 0;
        this.els.sfSubFreqSlider.value = 80;
        this.els.sfSubValue.textContent = '0 dB';
        this.els.sfSubFreqValue.textContent = '80 Гц';
        this.updateFxTrack(this.els.sfSubTrack, this.els.sfSubSlider);
        this.updateFxTrack(this.els.sfSubFreqTrack, this.els.sfSubFreqSlider);
        this.rebuildAudioChain();
    },

    updateAllSoundfieldTracks() {
        ['FL', 'FR', 'RL', 'RR'].forEach(ch => {
            this.updateFxTrack(this.els[`sf${ch}Track`], this.els[`sf${ch}`]);
        });
        this.updateCenterTrack(this.els.sfFaderTrack, this.els.sfFaderSlider);
        this.updateFxTrack(this.els.sfSubTrack, this.els.sfSubSlider);
        this.updateFxTrack(this.els.sfSubFreqTrack, this.els.sfSubFreqSlider);
    }
};