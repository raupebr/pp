// PP: deixa as cores do tema personalizáveis.
// 1. Gera src/common/pp-colors.less a partir da paleta do Stremio (@stremio/stremio-colors): os tons roxos e
//    azuis viram hsla(var(--pp-h) ...), mantendo o mesmo brilho de cada cor.
// 2. Troca as cores roxas/azuis fixas nos arquivos .less do app pelo mesmo tipo de cor dinâmica.
// --pp-h (tom) e --pp-s (intensidade) vêm da cor escolhida em Configurações > Aparência (src/common/ppTheme.ts).
// Uso: node tools/gerar-cores.js   (pode rodar de novo: o que já foi trocado não muda)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const PALETTE_IN = path.join(ROOT, 'node_modules', '@stremio', 'stremio-colors', 'less', 'stremio-colors.less');
const PALETTE_OUT = path.join(SRC, 'common', 'pp-colors.less');
// As variáveis principais do tema ficam em App/styles.less, feitas à mão
const SKIP = new Set([PALETTE_OUT, path.join(SRC, 'App', 'styles.less')]);
// Cores de marcas (Discord, Facebook) não mudam
const KEEP = new Set(['#5865f2', '#1877f1']);

// Famílias da paleta do Stremio: tom original -> deslocamento em relação à cor escolhida
// (primary roxo fica um pouco "à frente", secondary azul um pouco "atrás": dá profundidade ao tema)
const FAMILIES = [
    { hue: 275.1, shift: 12 },   // primary
    { hue: 276.8, shift: 12 },   // primaryvariant1
    { hue: 226.6, shift: -8 },   // secondary
    { hue: 224.3, shift: -8 },   // secondaryvariant1
    { hue: 222.8, shift: -8 },   // secondaryvariant2
    { hue: 243, shift: 0 },      // background
];

// Cores soltas nos .less: tons roxo/azul do tema original
const HUE_MIN = 240;
const HUE_MAX = 262;

const round = (v) => Math.round(v * 10) / 10;

const hueExpr = (shift) => shift === 0 ? 'var(--pp-h)' : `calc(var(--pp-h) ${shift > 0 ? '+' : '-'} ${Math.abs(shift)})`;
const dynamic = (shift, s, l, a) => `~"hsla(${hueExpr(shift)}, calc(var(--pp-s) * ${round(s)}%), ${round(l)}%, ${a})"`;

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l * 100];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h * 60, s * 100, l * 100];
}

// 1. Paleta
const palette = fs.readFileSync(PALETTE_IN, 'utf8').replace(
    /hsla\(([\d.]+), ([\d.]+)%, ([\d.]+)%, ([\d.]+)\)/g,
    (match, h, s, l, a) => {
        const family = FAMILIES.find(({ hue }) => Math.abs(hue - Number(h)) < 0.05);
        return family ? dynamic(family.shift, Number(s), Number(l), a) : match;
    }
);
fs.writeFileSync(PALETTE_OUT, `// Gerado por tools/gerar-cores.js a partir de @stremio/stremio-colors. Não edite à mão.\n${palette}`);
console.log('paleta:', path.relative(ROOT, PALETTE_OUT));

// 2. Cores soltas
const isThemeHue = (h, s) => s >= 5 && h >= HUE_MIN && h <= HUE_MAX;

function convertHex(match) {
    if (KEEP.has(match.toLowerCase())) return match;
    let hex = match.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = hex.split('').map((c) => c + c).join('');
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const alpha = hex.length === 8 ? round(parseInt(hex.slice(6), 16) / 255 * 100) / 100 : 1;
    const [h, s, l] = rgbToHsl(r, g, b);
    return isThemeHue(h, s) ? dynamic(0, s, l, alpha) : match;
}

function convertRgb(match, args) {
    const parts = args.split(',').map((p) => p.trim());
    const [r, g, b] = parts.slice(0, 3).map(Number);
    if ([r, g, b].some(Number.isNaN)) return match;
    const [h, s, l] = rgbToHsl(r, g, b);
    return isThemeHue(h, s) ? dynamic(0, s, l, parts[3] ?? 1) : match;
}

const convertLess = (text) => text
    // O que já está entre ~"..." fica como está
    .split(/(~"[^"]*")/)
    .map((chunk, i) => i % 2 === 1 ? chunk : chunk
        .replace(/rgba?\(([^()]*)\)/g, convertRgb)
        .replace(/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b/g, convertHex))
    .join('');

const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(file);
        } else if (entry.name.endsWith('.less') && !SKIP.has(file)) {
            const before = fs.readFileSync(file, 'utf8');
            const after = convertLess(before);
            if (after !== before) {
                fs.writeFileSync(file, after);
                console.log('cores dinâmicas:', path.relative(ROOT, file));
            }
        }
    }
};
walk(SRC);
