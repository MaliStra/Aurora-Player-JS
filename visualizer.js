export const visualizerMethods = {
    setupVisualizer() {
        this.ctx = this.els.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.drawIdleVisualizer();
    },

    resizeCanvas() {
        const wrapper = this.els.canvas.parentElement;
        this.els.canvas.width = wrapper.clientWidth * 2;
        this.els.canvas.height = wrapper.clientHeight * 2;
    },

    drawIdleVisualizer() {
        const { ctx, els } = this;
        const w = els.canvas.width;
        const h = els.canvas.height;
        ctx.clearRect(0, 0, w, h);

        const barCount = 64;
        const barWidth = w / barCount;
        const time = Date.now() / 1000;

        for (let i = 0; i < barCount; i++) {
            const x = i * barWidth;
            const barH = (Math.sin(i * 0.2 + time) * 0.3 + 0.5) * 15;
            const gradient = ctx.createLinearGradient(x, h, x, h - barH);
            gradient.addColorStop(0, 'rgba(124, 58, 237, 0.3)');
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0.1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, h - barH, barWidth - 2, barH);
        }

        if (!this.isPlaying) {
            requestAnimationFrame(() => this.drawIdleVisualizer());
        }
    },

    drawVisualizer() {
        if (!this.isPlaying || !this.analyser) {
            this.drawIdleVisualizer();
            return;
        }

        const { ctx, analyser, els } = this;
        const w = els.canvas.width;
        const h = els.canvas.height;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!this.isPlaying) {
                this.drawIdleVisualizer();
                return;
            }
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, w, h);

            const barCount = 80;
            const barWidth = w / barCount;

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor(i * bufferLength / barCount);
                const value = dataArray[dataIndex] || 0;
                const barH = (value / 255) * h * 0.85;
                const x = i * barWidth;

                const gradient = ctx.createLinearGradient(x, h, x, h - barH);
                gradient.addColorStop(0, `rgba(124, 58, 237, ${0.6 + value / 510})`);
                gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.5 + value / 510})`);
                gradient.addColorStop(1, `rgba(6, 182, 212, ${0.4 + value / 510})`);
                ctx.fillStyle = gradient;

                const radius = Math.min(barWidth / 2 - 1, 3);
                const bx = x + 1;
                const by = h - barH;
                const bw = barWidth - 2;

                if (barH > 0) {
                    ctx.beginPath();
                    ctx.moveTo(bx, h);
                    ctx.lineTo(bx, by + radius);
                    ctx.quadraticCurveTo(bx, by, bx + radius, by);
                    ctx.lineTo(bx + bw - radius, by);
                    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + radius);
                    ctx.lineTo(bx + bw, h);
                    ctx.closePath();
                    ctx.fill();
                }

                const refGrad = ctx.createLinearGradient(x, h, x, h + barH * 0.3);
                refGrad.addColorStop(0, 'rgba(124, 58, 237, 0.15)');
                refGrad.addColorStop(1, 'rgba(124, 58, 237, 0)');
                ctx.fillStyle = refGrad;
                ctx.fillRect(bx, h, bw, barH * 0.3);
            }
        };

        draw();
    }
};