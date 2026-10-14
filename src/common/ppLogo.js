// PP: desenho da logo (SVG). Duas letras P de vidro sobrepostas sobre um fundo com degradê e luzes
// de "aurora"; o "olho" do segundo P é um botão de play.
// As cores seguem a cor de destaque do tema. Usado pela logo do app (components/PPLogo), pelo ícone
// da aba do navegador (common/ppTheme.ts) e pelos ícones gerados por tools/gerar-icones.js.

// Letra P numa caixa de 74 x 100 (cantos arredondados)
const P_OUTER = 'M14,0 H42 A32,32 0 0 1 42,64 H28 V86 A14,14 0 0 1 0,86 V14 A14,14 0 0 1 14,0 Z';
const P_ROUND_EYE = 'M28,18 H42 A14,14 0 0 1 42,46 H28 Z';

// Triângulo de play com pontas arredondadas
const roundedTriangle = (points, r) => {
    const unit = ([x, y]) => {
        const length = Math.hypot(x, y);
        return [x / length, y / length];
    };
    const f = ([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`;
    return points.map((v, i) => {
        const prev = points[(i + points.length - 1) % points.length];
        const next = points[(i + 1) % points.length];
        const toPrev = unit([prev[0] - v[0], prev[1] - v[1]]);
        const toNext = unit([next[0] - v[0], next[1] - v[1]]);
        const a = [v[0] + toPrev[0] * r, v[1] + toPrev[1] * r];
        const b = [v[0] + toNext[0] * r, v[1] + toNext[1] * r];
        return `${i === 0 ? 'M' : 'L'}${f(a)} Q${f(v)} ${f(b)}`;
    }).join(' ') + ' Z';
};

const P_PLAY_EYE = roundedTriangle([[27, 15], [56, 32], [27, 49]], 4);

// Cores da logo a partir do tom (h) e da intensidade (s, em %) da cor de destaque:
// degradê claro -> escuro, luz branca no canto, luzes vizinhas (+40 e -40 no tom) nos outros cantos.
const COLOR_RECIPE = {
    light: [0, 1, 56],
    mid: [0, 1, 35],
    dark: [0, 0.9, 8],
    glowA: [0, 1, 80],
    glowB: [40, 1, 55],
    glowC: [-40, 1, 66],
};

// Cores fixas (hex) para um tom e intensidade; usadas nos ícones gerados e no ícone da aba
const logoColors = (h, s) => {
    const toHex = (hue, sat, l) => {
        sat /= 100; l /= 100;
        const k = (n) => (n + ((hue % 360) + 360) % 360 / 30) % 12;
        const a = sat * Math.min(l, 1 - l);
        const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
    };
    const colors = Object.fromEntries(Object.entries(COLOR_RECIPE).map(([name, [shift, k, l]]) => [
        name,
        toHex(h + shift, Math.min(100, s * k), l),
    ]));
    return { ...colors, tint: toHex(h, Math.min(100, s * 1.2), 96) };
};

// Cores que acompanham o tema ao vivo (variáveis CSS de src/common/ppTheme.ts); só funcionam dentro da página
const LIVE_COLORS = {
    ...Object.fromEntries(Object.entries(COLOR_RECIPE).map(([name, [shift, k, l]]) => [
        name,
        `hsl(${shift === 0 ? 'var(--pp-accent-h)' : `calc(var(--pp-accent-h) ${shift > 0 ? '+' : '-'} ${Math.abs(shift)})`}, ${k === 1 ? 'var(--pp-accent-s)' : `calc(var(--pp-accent-s) * ${k})`}, ${l}%)`,
    ])),
    tint: 'hsl(var(--pp-accent-h), 100%, 96%)',
};

const stop = (offset, color, opacity = 1) => `<stop offset="${offset}" style="stop-color:${color};stop-opacity:${opacity}"/>`;

// Defs (o prefixo id evita ids repetidos quando há várias logos na mesma página)
const defs = (id, colors) => `
  <defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">
      ${stop(0, colors.light)}${stop(0.48, colors.mid)}${stop(1, colors.dark)}
    </linearGradient>
    <radialGradient id="${id}gA" cx="0.15" cy="0.08" r="0.75">
      ${stop(0, colors.glowA, 0.55)}${stop(1, colors.glowA, 0)}
    </radialGradient>
    <radialGradient id="${id}gB" cx="1" cy="1" r="0.75">
      ${stop(0, colors.glowB, 0.7)}${stop(1, colors.glowB, 0)}
    </radialGradient>
    <radialGradient id="${id}gC" cx="0.98" cy="0.05" r="0.55">
      ${stop(0, colors.glowC, 0.45)}${stop(1, colors.glowC, 0)}
    </radialGradient>
    <linearGradient id="${id}front" x1="0" y1="0" x2="0" y2="1">
      ${stop(0, '#ffffff')}${stop(1, colors.tint, 0.86)}
    </linearGradient>
    <linearGradient id="${id}back" x1="0" y1="0" x2="0" y2="1">
      ${stop(0, '#ffffff', 0.5)}${stop(1, '#ffffff', 0.2)}
    </linearGradient>
    <linearGradient id="${id}edge" x1="0" y1="0" x2="0" y2="1">
      ${stop(0, '#ffffff', 0.95)}${stop(0.5, '#ffffff', 0.15)}${stop(1, '#ffffff', 0.45)}
    </linearGradient>
    <linearGradient id="${id}rim" x1="0" y1="0" x2="1" y2="1">
      ${stop(0, '#ffffff', 0.7)}${stop(0.4, '#ffffff', 0.05)}${stop(1, '#ffffff', 0.3)}
    </linearGradient>
    <filter id="${id}shadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="9" stdDeviation="11" flood-color="#01040d" flood-opacity="0.5"/>
    </filter>
  </defs>`;

// As duas letras centralizadas em (cx, cy) com altura h. mono = só a forma, em branco.
const letters = (id, cx, cy, h, { mono = false } = {}) => {
    const s = h / 100;
    const offset = 60;
    const width = (offset + 74) * s;
    const x1 = cx - width / 2;
    const x2 = x1 + offset * s;
    const y = cy - h / 2;
    const at = (x) => `transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)})"`;
    const back = `${P_OUTER} ${P_ROUND_EYE}`;
    const front = `${P_OUTER} ${P_PLAY_EYE}`;
    if (mono) {
        return `<path d="${back}" fill="#ffffff" fill-rule="evenodd" fill-opacity="0.55" ${at(x1)}/>
  <path d="${front}" fill="#ffffff" fill-rule="evenodd" ${at(x2)}/>`;
    }

    const stroke = (w) => `stroke-width="${(w / s).toFixed(3)}"`;
    return `<g filter="url(#${id}shadow)">
    <path d="${back}" fill="url(#${id}back)" fill-rule="evenodd" ${at(x1)}/>
    <path d="${back}" fill="none" stroke="url(#${id}edge)" ${stroke(2.2)} ${at(x1)}/>
    <path d="${front}" fill="url(#${id}front)" fill-rule="evenodd" ${at(x2)}/>
  </g>
  <path d="${front}" fill="none" stroke="url(#${id}edge)" ${stroke(2)} stroke-opacity="0.9" ${at(x2)}/>`;
};

// Fundo arredondado (rx) ou cheio (rx = 0) de tamanho 512
const background = (id, rx) => {
    const shape = (fill) => `<rect width="512" height="512" rx="${rx}" fill="${fill}"/>`;
    return `${shape(`url(#${id}bg)`)}
  ${shape(`url(#${id}gC)`)}
  ${shape(`url(#${id}gB)`)}
  ${shape(`url(#${id}gA)`)}
  <rect x="3" y="3" width="506" height="506" rx="${Math.max(0, rx - 3)}" fill="none" stroke="url(#${id}rim)" stroke-width="6"/>`;
};

// Ícone completo (quadrado arredondado) em 512 x 512
const icon = ({ id = 'pp', colors, rx = 116, letterHeight = 224 }) => `${defs(id, colors)}
  ${background(id, rx)}
  ${letters(id, 256, 258, letterHeight)}`;

// Documento SVG completo
const svg = (inner, size = '100%') =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">${inner}</svg>`;

module.exports = { logoColors, LIVE_COLORS, defs, letters, background, icon, svg };
