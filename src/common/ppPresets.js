// PP: cores prontas de Configurações > Aparência. Cada uma também tem um ícone do app no Android
// (gerados por tools/gerar-icones.js; o ícone da tela inicial muda junto com a cor escolhida).
// id: nome usado nos arquivos dos ícones e no Android (só letras minúsculas, sem acento).

const PP_ACCENT_PRESETS = [
    { id: 'azul', name: 'Azul', color: '#2563eb' },
    { id: 'esmeralda', name: 'Esmeralda', color: '#16a866' },
    { id: 'violeta', name: 'Violeta', color: '#8b5cf6' },
    { id: 'rosa', name: 'Rosa', color: '#e0458f' },
    { id: 'coral', name: 'Coral', color: '#ea5a3a' },
    { id: 'ambar', name: 'Âmbar', color: '#d9890b' },
    { id: 'ciano', name: 'Ciano', color: '#0ea5c0' },
    { id: 'grafite', name: 'Grafite', color: '#8a8f98' },
];

// Tom (0-360) e intensidade (0-100) de uma cor #rrggbb
const hexToHueSat = (hex) => {
    const value = parseInt(hex.replace('#', ''), 16);
    const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((v) => v / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) {
        return [0, 0];
    }
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s * 100];
};

// Cor pronta mais parecida com uma cor qualquer (para o ícone quando a pessoa escolhe "Outra cor")
const nearestPreset = (hex) => {
    const exact = PP_ACCENT_PRESETS.find(({ color }) => color.toLowerCase() === String(hex).toLowerCase());
    if (exact) {
        return exact;
    }
    const [h, s] = hexToHueSat(hex);
    if (s < 15) {
        return PP_ACCENT_PRESETS.find(({ id }) => id === 'grafite');
    }
    const hueDistance = (preset) => {
        const diff = Math.abs(hexToHueSat(preset.color)[0] - h) % 360;
        return Math.min(diff, 360 - diff);
    };
    return PP_ACCENT_PRESETS
        .filter(({ id }) => id !== 'grafite')
        .reduce((best, preset) => hueDistance(preset) < hueDistance(best) ? preset : best);
};

module.exports = { PP_ACCENT_PRESETS, hexToHueSat, nearestPreset };
