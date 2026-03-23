// EQ presets
export const EQ_PRESETS = {
    'flat':          { name: 'Без обработки', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    'bass-boost':    { name: 'Бас',           values: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
    'treble-boost':  { name: 'Высокие',       values: [0, 0, 0, 0, 0, 2, 4, 5, 6, 6] },
    'vocal':         { name: 'Вокал',         values: [-2, -1, 0, 3, 5, 5, 3, 1, -1, -2] },
    'rock':          { name: 'Рок',           values: [5, 4, 2, 0, -1, 0, 2, 4, 5, 5] },
    'pop':           { name: 'Поп',           values: [-1, 1, 3, 4, 3, 0, -1, -1, 1, 2] },
    'jazz':          { name: 'Джаз',          values: [3, 2, 0, 2, -1, -1, 0, 1, 3, 4] },
    'classical':     { name: 'Классика',      values: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4] },
    'electronic':    { name: 'Электроника',   values: [5, 4, 1, 0, -2, 0, 1, 4, 5, 5] },
    'rnb':           { name: 'R&B',           values: [3, 5, 4, 1, -1, 1, 2, 3, 3, 2] },
    'acoustic':      { name: 'Акустика',      values: [4, 3, 1, 0, 1, 1, 2, 3, 2, 1] },
    'loudness':      { name: 'Громкость',     values: [6, 4, 0, -2, -1, 0, -1, -2, 4, 6] }
};

// Reverb presets
export const REVERB_PRESETS = {
    room:   { size: 8,  decay: 30, mix: 25, label: 'Комната' },
    hall:   { size: 30, decay: 60, mix: 35, label: 'Зал' },
    church: { size: 60, decay: 80, mix: 45, label: 'Храм' },
    plate:  { size: 15, decay: 90, mix: 40, label: 'Пластина' }
};

// Sound field presets
export const SF_PRESETS = {
    center:    { fl: 100, fr: 100, rl: 100, rr: 100, fader: 0,   focusX: 0.5,  focusY: 0.5 },
    driver:    { fl: 60,  fr: 100, rl: 40,  rr: 80,  fader: 30,  focusX: 0.25, focusY: 0.35 },
    passenger: { fl: 100, fr: 60,  rl: 80,  rr: 40,  fader: 30,  focusX: 0.75, focusY: 0.35 },
    front:     { fl: 100, fr: 100, rl: 40,  rr: 40,  fader: 60,  focusX: 0.5,  focusY: 0.25 },
    rear:      { fl: 40,  fr: 40,  rl: 100, rr: 100, fader: -60, focusX: 0.5,  focusY: 0.75 },
    custom:    { fl: 100, fr: 100, rl: 100, rr: 100, fader: 0,   focusX: 0.5,  focusY: 0.5 }
};

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
export const EQ_LABELS = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];