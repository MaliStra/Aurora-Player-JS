import { formatTime, pluralize, escapeHtml } from './utils.js';

export const playlistMethods = {
    handleFiles(files) {
        const fileArray = Array.from(files).filter(f => f.type.startsWith('audio/'));
        const startIdx = this.playlist.length;

        fileArray.forEach((file, idx) => {
            const url = URL.createObjectURL(file);
            const name = file.name.replace(/\.[^.]+$/, '');
            let title = name;
            let artist = 'Неизвестный';

            if (name.includes(' - ')) {
                const parts = name.split(' - ');
                artist = parts[0].trim();
                title = parts.slice(1).join(' - ').trim();
            }

            const track = {
                file,
                url,
                title,
                artist,
                duration: 0,
                durationFormatted: '...',
                coverUrl: null
            };

            this.playlist.push(track);
            const trackIndex = startIdx + idx;

            this.extractCoverArt(file, trackIndex);

            const tempAudio = new Audio();
            tempAudio.src = url;
            tempAudio.addEventListener('loadedmetadata', () => {
                track.duration = tempAudio.duration;
                track.durationFormatted = formatTime(tempAudio.duration);
                this.renderPlaylist();
            });
        });

        if (this.currentIndex === -1 && this.playlist.length > 0) {
            this.loadTrack(startIdx);
        }

        this.renderPlaylist();
    },

    extractCoverArt(file, trackIndex) {
        if (typeof jsmediatags === 'undefined') {
            console.warn('jsmediatags not loaded');
            return;
        }

        jsmediatags.read(file, {
            onSuccess: (tag) => {
                const picture = tag.tags.picture;
                if (picture) {
                    const { data, format } = picture;
                    const coverUrl = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: format }));

                    if (this.playlist[trackIndex]) {
                        this.playlist[trackIndex].coverUrl = coverUrl;
                        if (this.currentIndex === trackIndex) {
                            this.updateAlbumArt(coverUrl);
                        }
                        this.renderPlaylist();
                    }
                }
            },
            onError: (error) => {
                console.warn('No cover art:', error.type);
            }
        });
    },

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const track = this.playlist[index];
        this.audio.src = track.url;
        this.els.trackTitle.textContent = track.title;
        this.els.trackArtist.textContent = track.artist;
        this.updateProgress(0);
        this.renderPlaylist();

        if (track.coverUrl) {
            this.updateAlbumArt(track.coverUrl);
        } else {
            this.updateAlbumArt(null);
        }
    },

    updateAlbumArt(coverUrl) {
        const albumArtDiv = this.els.albumArt;
        while (albumArtDiv.firstChild) {
            albumArtDiv.removeChild(albumArtDiv.firstChild);
        }

        if (coverUrl) {
            const img = document.createElement('img');
            img.src = coverUrl;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            albumArtDiv.appendChild(img);
        } else {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '60');
            svg.setAttribute('height', '60');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'rgba(255,255,255,0.3)');
            svg.setAttribute('stroke-width', '1');
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '12');
            circle.setAttribute('cy', '12');
            circle.setAttribute('r', '10');
            const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle2.setAttribute('cx', '12');
            circle2.setAttribute('cy', '12');
            circle2.setAttribute('r', '3');
            svg.appendChild(circle);
            svg.appendChild(circle2);
            albumArtDiv.appendChild(svg);
        }
    },

    nextTrack() {
        if (this.playlist.length === 0) return;
        let next;
        if (this.isShuffle) {
            next = Math.floor(Math.random() * this.playlist.length);
            this.shuffleHistory.push(this.currentIndex);
        } else {
            next = (this.currentIndex + 1) % this.playlist.length;
        }
        this.loadTrack(next);
        if (this.isPlaying) this.play();
    },

    prevTrack() {
        if (this.playlist.length === 0) return;
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        let prev;
        if (this.isShuffle && this.shuffleHistory.length > 0) {
            prev = this.shuffleHistory.pop();
        } else {
            prev = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        }
        this.loadTrack(prev);
        if (this.isPlaying) this.play();
    },

    onTrackEnd() {
        if (this.repeatMode === 2) {
            this.audio.currentTime = 0;
            this.play();
        } else if (this.repeatMode === 1 || this.currentIndex < this.playlist.length - 1 || this.isShuffle) {
            this.nextTrack();
        } else {
            this.pause();
        }
    },

    removeTrack(index) {
        const track = this.playlist[index];
        if (track.coverUrl) {
            URL.revokeObjectURL(track.coverUrl);
        }
        URL.revokeObjectURL(track.url);
        this.playlist.splice(index, 1);

        if (this.playlist.length === 0) {
            this.currentIndex = -1;
            this.pause();
            this.audio.src = '';
            this.els.trackTitle.textContent = 'Выберите аудиофайлы';
            this.els.trackArtist.textContent = 'Aurora Player';
            this.els.currentTime.textContent = '0:00';
            this.els.totalTime.textContent = '0:00';
            this.updateProgress(0);
            this.updateAlbumArt(null);
        } else if (index === this.currentIndex) {
            const newIndex = Math.min(index, this.playlist.length - 1);
            this.loadTrack(newIndex);
            if (this.isPlaying) this.play();
        } else if (index < this.currentIndex) {
            this.currentIndex--;
        }

        this.renderPlaylist();
    },

    renderPlaylist() {
        const count = this.playlist.length;
        this.els.trackCount.textContent = count + ' ' + pluralize(count, 'трек', 'трека', 'треков');

        if (count === 0) {
            this.els.playlistEmpty.style.display = 'block';
            const items = this.els.playlist.querySelectorAll('.playlist-item');
            items.forEach(item => item.remove());
            return;
        }

        this.els.playlistEmpty.style.display = 'none';
        const oldItems = this.els.playlist.querySelectorAll('.playlist-item');
        oldItems.forEach(item => item.remove());

        this.playlist.forEach((track, i) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            if (i === this.currentIndex) {
                item.classList.add('active');
                if (this.isPlaying) item.classList.add('playing-item');
            }

            item.innerHTML = `
                <span class="pl-index">${i + 1}</span>
                <div class="pl-equalizer">
                    <div class="eq-bar"></div>
                    <div class="eq-bar"></div>
                    <div class="eq-bar"></div>
                    <div class="eq-bar"></div>
                </div>
                <div class="pl-info">
                    <div class="pl-title">${escapeHtml(track.title)}</div>
                    <div class="pl-meta">${escapeHtml(track.artist)}</div>
                </div>
                <span class="pl-duration">${track.durationFormatted}</span>
                <button class="pl-remove" title="Удалить">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;

            item.addEventListener('click', (e) => {
                if (e.target.closest('.pl-remove')) return;
                this.loadTrack(i);
                this.play();
            });

            item.querySelector('.pl-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTrack(i);
            });

            this.els.playlist.appendChild(item);
        });

        const activeEl = this.els.playlist.querySelector('.playlist-item.active');
        if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};