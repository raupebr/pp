// PP: gera as imagens da página do PP na Play Store, na pasta loja/:
//  - icone-512.png: ícone da loja (versão arco-íris da logo)
//  - destaque-1024x500.jpg: imagem de destaque
//  - celular-*.jpg (1080 x 1920) e tablet-*.jpg (1920 x 1200): prints do app com legenda
//
// Os prints mostram o app de verdade (a pasta build/, gerada por "npx pnpm@11.8.0 run build"), mas com
// filmes, séries e canais de exemplo inventados aqui: a loja não aceita cartazes de filmes de terceiros.
//
// Uso: gere o build e rode com o sharp e o puppeteer-core instalados fora do projeto:
//   npm i --prefix %TEMP%\pp-sharp sharp puppeteer-core
//   set NODE_PATH=%TEMP%\pp-sharp\node_modules
//   node tools/gerar-loja.js
// Usa o Google Chrome instalado (ou o caminho em CHROME_PATH).

const fs = require('fs');
const http = require('http');
const path = require('path');
const sharp = require('sharp');
const puppeteer = require('puppeteer-core');
const { letters } = require('../src/common/ppLogo');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const OUT = path.join(ROOT, 'loja');
const PORT = 8092;
const BASE = `http://localhost:${PORT}`;
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------------------------
// Ícone arco-íris: fundo escuro e o arco-íris correndo pelas duas letras, com brilho de neon
// ---------------------------------------------------------------------------------------------

const RAINBOW = ['#ff3d6e', '#ff8a1f', '#ffd21f', '#35d07f', '#1fb6ff', '#5b6cff', '#b04dff'];
const stop = (offset, color, opacity = 1) => `<stop offset="${offset}" style="stop-color:${color};stop-opacity:${opacity}"/>`;

const rainbowIcon = ({ rounded }) => {
    const shape = letters('m', 256, 258, 224, { mono: true });
    const [backOnly, frontOnly] = shape.split('\n').map((line) => line.trim());
    return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">${stop(0, '#1b1d45')}${stop(0.55, '#0b0d22')}${stop(1, '#05060f')}</linearGradient>
    <radialGradient id="g1" cx="0.12" cy="0.08" r="0.6">${stop(0, '#ff3d6e', 0.3)}${stop(1, '#ff3d6e', 0)}</radialGradient>
    <radialGradient id="g2" cx="0.92" cy="0.95" r="0.65">${stop(0, '#5b6cff', 0.35)}${stop(1, '#5b6cff', 0)}</radialGradient>
    <linearGradient id="rb" x1="120" y1="150" x2="400" y2="370" gradientUnits="userSpaceOnUse">${RAINBOW.map((c, i) => stop(i / (RAINBOW.length - 1), c)).join('')}</linearGradient>
    <linearGradient id="gloss" x1="0" y1="146" x2="0" y2="370" gradientUnits="userSpaceOnUse">${stop(0, '#ffffff', 0.55)}${stop(0.42, '#ffffff', 0.12)}${stop(0.5, '#ffffff', 0)}${stop(1, '#ffffff', 0)}</linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">${stop(0, '#ffffff', 0.95)}${stop(0.5, '#ffffff', 0.12)}${stop(1, '#ffffff', 0.4)}</linearGradient>
    <mask id="both" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">${shape}</mask>
    <mask id="front" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">${frontOnly}</mask>
    <filter id="neon" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="drop" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000000" flood-opacity="0.55"/></filter>
    <clipPath id="clip"><rect width="512" height="512" rx="${rounded ? 116 : 0}"/></clipPath>
  </defs>
  <g clip-path="url(#clip)">
    <rect width="512" height="512" fill="url(#bg)"/>
    <rect width="512" height="512" fill="url(#g1)"/>
    <rect width="512" height="512" fill="url(#g2)"/>
    <g filter="url(#neon)" opacity="0.75"><rect width="512" height="512" fill="url(#rb)" mask="url(#both)"/></g>
    <g filter="url(#drop)"><rect width="512" height="512" fill="url(#rb)" mask="url(#both)"/></g>
    <rect width="512" height="512" fill="url(#gloss)" mask="url(#front)"/>
    ${backOnly.replace('fill="#ffffff" fill-rule="evenodd" fill-opacity="0.55"', 'fill="none" stroke="url(#edge)" stroke-width="2" stroke-opacity="0.7"')}
    ${frontOnly.replace('fill="#ffffff" fill-rule="evenodd"', 'fill="none" stroke="url(#edge)" stroke-width="2.2"')}
    ${rounded ? '<rect x="3" y="3" width="506" height="506" rx="113" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="6"/>' : ''}
  </g>
</svg>`;
};

// ---------------------------------------------------------------------------------------------
// Filmes, séries e canais de exemplo (nomes inventados) e as imagens deles, desenhadas aqui
// ---------------------------------------------------------------------------------------------

const MOVIES = ['Farol de Âmbar', 'Maré de Vidro', 'Cidade Neon', 'Órbita Nove', 'Vale dos Ecos', 'Areia Escarlate',
    'O Jardim de Luz', 'Trilha do Lobo Azul', 'Céu de Papel', 'A Ilha Silenciosa', 'Corrida das Sombras', 'Neve em Setembro'];
const SERIES = ['Estação Polar', 'Guardiões do Rio', 'Código Coral', 'Vila Aurora', 'Planeta Ímã', 'Expresso Lunar',
    'Casa dos Ventos Altos', 'Faroeste Digital', 'Ondas Curtas', 'Mapa das Estrelas'];
const CHANNELS = ['Natureza Viva', 'Cozinha Fácil', 'Som da Cidade', 'Esportes Radicais', 'Oficina Criativa', 'Viagens',
    'Ciência Hoje', 'Jardim em Casa'];
const GENRES = ['Aventura', 'Drama', 'Ficção científica', 'Mistério', 'Comédia', 'Animação'];
const DESCRIPTION = 'Título de exemplo, criado só para mostrar o app. No PP, os filmes, as séries e os canais vêm dos addons que você escolher.';

const random = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hsl = (h, s, l, a = 1) => `hsla(${Math.round(((h % 360) + 360) % 360)}, ${s}%, ${l}%, ${a})`;
const escapeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Cena desenhada (montanhas, mar, cidade, espaço, floresta ou luzes) em w x h, com o título opcional
const scene = (seed, w, h, title) => {
    const rnd = random(seed * 7919);
    const hue = Math.floor(rnd() * 360);
    const kind = seed % 6;
    const parts = [];
    const sky = (top, bottom) => parts.push(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${stop(0, top)}${stop(1, bottom)}</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#sky)"/>`);
    const stars = (count) => {
        for (let i = 0; i < count; i++) {
            parts.push(`<circle cx="${(rnd() * w).toFixed(1)}" cy="${(rnd() * h * 0.6).toFixed(1)}" r="${(rnd() * 1.6 + 0.4) * w / 400}" fill="#fff" opacity="${(rnd() * 0.6 + 0.3).toFixed(2)}"/>`);
        }
    };
    const ridge = (base, amp, color) => {
        let d = `M0,${h}`;
        const steps = 7;
        for (let i = 0; i <= steps; i++) {
            d += ` L${(i / steps * w).toFixed(1)},${(h * base - rnd() * h * amp).toFixed(1)}`;
        }
        parts.push(`<path d="${d} L${w},${h} Z" fill="${color}"/>`);
    };
    if (kind === 0) {
        sky(hsl(hue + 20, 80, 68), hsl(hue - 20, 60, 30));
        parts.push(`<circle cx="${w * 0.62}" cy="${h * 0.42}" r="${w * 0.17}" fill="${hsl(hue + 40, 100, 82)}" opacity="0.9"/>`);
        ridge(0.62, 0.12, hsl(hue - 10, 35, 32));
        ridge(0.72, 0.1, hsl(hue - 20, 40, 20));
        ridge(0.84, 0.08, hsl(hue - 30, 45, 10));
    } else if (kind === 1) {
        sky(hsl(hue, 60, 22), hsl(hue + 30, 70, 48));
        stars(30);
        parts.push(`<circle cx="${w * 0.3}" cy="${h * 0.28}" r="${w * 0.1}" fill="#fdf6e3" opacity="0.92"/>`);
        for (let i = 0; i < 6; i++) {
            const y = h * (0.58 + i * 0.07);
            const a = h * 0.02;
            parts.push(`<path d="M0,${y} C${w * 0.25},${y - a} ${w * 0.25},${y + a} ${w * 0.5},${y} S${w * 0.75},${y - a} ${w},${y} L${w},${h} L0,${h} Z" fill="${hsl(hue + 10, 70, 30 - i * 3)}" opacity="0.85"/>`);
        }
    } else if (kind === 2) {
        sky(hsl(hue + 200, 50, 10), hsl(hue + 260, 60, 30));
        stars(40);
        let x = 0;
        while (x < w) {
            const bw = w * (0.08 + rnd() * 0.1);
            const bh = h * (0.25 + rnd() * 0.4);
            parts.push(`<rect x="${x.toFixed(1)}" y="${(h - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${hsl(hue + 230, 30, 8 + rnd() * 6)}"/>`);
            for (let wy = h - bh + w * 0.03; wy < h - w * 0.03; wy += w * 0.045) {
                for (let wx = x + w * 0.015; wx < x + bw - w * 0.02; wx += w * 0.035) {
                    if (rnd() > 0.55) {
                        parts.push(`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${(w * 0.014).toFixed(1)}" height="${(w * 0.02).toFixed(1)}" fill="${hsl(hue + 40 * rnd(), 100, 70)}" opacity="0.85"/>`);
                    }
                }
            }
            x += bw + w * 0.008;
        }
    } else if (kind === 3) {
        sky(hsl(hue + 240, 50, 8), hsl(hue + 270, 60, 18));
        stars(70);
        const r = w * 0.28;
        parts.push(`<defs><radialGradient id="planet" cx="0.35" cy="0.3" r="0.8">${stop(0, hsl(hue, 80, 70))}${stop(1, hsl(hue + 30, 70, 18))}</radialGradient></defs>`);
        parts.push(`<circle cx="${w * 0.55}" cy="${h * 0.45}" r="${r}" fill="url(#planet)"/>`);
        parts.push(`<ellipse cx="${w * 0.55}" cy="${h * 0.45}" rx="${r * 1.7}" ry="${r * 0.35}" fill="none" stroke="${hsl(hue + 50, 90, 80)}" stroke-width="${w * 0.012}" opacity="0.7" transform="rotate(-18 ${w * 0.55} ${h * 0.45})"/>`);
    } else if (kind === 4) {
        sky(hsl(hue + 120, 35, 70), hsl(hue + 140, 40, 28));
        for (let row = 0; row < 4; row++) {
            const y = h * (0.5 + row * 0.13);
            const size = w * (0.09 + row * 0.03);
            for (let x = -size; x < w + size; x += size * 0.8) {
                const tx = x + rnd() * size * 0.4;
                parts.push(`<path d="M${tx},${y - size * 1.6} L${tx + size * 0.55},${y + size * 0.2} L${tx - size * 0.55},${y + size * 0.2} Z" fill="${hsl(hue + 140, 35, 30 - row * 6)}"/>`);
            }
        }
    } else {
        sky(hsl(hue, 50, 10), hsl(hue + 60, 50, 6));
        parts.push(`<defs><filter id="blur"><feGaussianBlur stdDeviation="${w * 0.06}"/></filter></defs>`);
        for (let i = 0; i < 5; i++) {
            parts.push(`<circle cx="${(rnd() * w).toFixed(1)}" cy="${(rnd() * h).toFixed(1)}" r="${(w * (0.15 + rnd() * 0.2)).toFixed(1)}" fill="${hsl(hue + i * 50, 95, 58)}" opacity="0.75" filter="url(#blur)"/>`);
        }
        for (let i = 0; i < 6; i++) {
            const y = h * (0.15 + rnd() * 0.7);
            parts.push(`<line x1="0" y1="${y.toFixed(1)}" x2="${w}" y2="${(y - h * 0.2).toFixed(1)}" stroke="#fff" stroke-opacity="0.18" stroke-width="${w * 0.004}"/>`);
        }
    }
    if (title) {
        const words = title.split(' ');
        const lines = [];
        for (const word of words) {
            if (lines.length > 0 && (lines[lines.length - 1] + ' ' + word).length <= 11) {
                lines[lines.length - 1] += ' ' + word;
            } else {
                lines.push(word);
            }
        }
        const size = w * 0.115;
        const startY = h * 0.86 - (lines.length - 1) * size * 1.05;
        parts.push(`<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">${stop(0.45, '#000', 0)}${stop(1, '#000', 0.75)}</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#fade)"/>`);
        lines.forEach((line, i) => {
            parts.push(`<text x="${w / 2}" y="${(startY + i * size * 1.05).toFixed(1)}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="${size.toFixed(1)}" fill="#fff" letter-spacing="${(size * 0.02).toFixed(1)}">${escapeXml(line.toUpperCase())}</text>`);
        });
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
};

// Códigos no formato do catálogo (tt + número), para o app pedir os detalhes ao addon de catálogo;
// os números (tt99...) estão muito acima dos usados de verdade
const makeItems = (names, type, seedBase) => names.map((name, index) => {
    const id = `tt99${String(seedBase + index).padStart(6, '0')}`;
    const rnd = random(seedBase + index);
    return {
        id, type, name, seed: seedBase + index,
        poster: `${BASE}/__demo/poster/${id}.jpg`,
        posterShape: type === 'channel' ? 'square' : 'poster',
        background: `${BASE}/__demo/bg/${id}.jpg`,
        description: DESCRIPTION,
        releaseInfo: type === 'series' ? '2024–' : String(2020 + Math.floor(rnd() * 6)),
        imdbRating: (6.8 + rnd() * 2.1).toFixed(1),
        genres: [GENRES[index % GENRES.length], GENRES[(index + 2) % GENRES.length]],
        runtime: type === 'movie' ? `${95 + Math.floor(rnd() * 50)} min` : '45 min',
    };
});
const ITEMS = {
    movie: makeItems(MOVIES, 'movie', 100),
    series: makeItems(SERIES, 'series', 200),
    channel: makeItems(CHANNELS, 'channel', 300),
};
const BY_ID = Object.fromEntries(Object.values(ITEMS).flat().map((item) => [item.id, item]));
const publicMeta = ({ seed, ...meta }) => meta;

const episodes = (item) => {
    const videos = [];
    for (let season = 1; season <= 2; season++) {
        for (let number = 1; number <= 8; number++) {
            const day = new Date(Date.UTC(2024, 2 + season * 3, number * 7));
            videos.push({
                id: `${item.id}:${season}:${number}`,
                title: `Episódio ${number}`,
                season, episode: number, number,
                released: day.toISOString(),
                thumbnail: `${BASE}/__demo/ep/${item.id}-${season}-${number}.jpg`,
                overview: 'Episódio de exemplo, só para mostrar o app.',
            });
        }
    }
    return videos;
};

// Resposta de exemplo para os pedidos que o app faz aos addons
const demoResponse = (url) => {
    const { pathname } = new URL(url);
    if (pathname.endsWith('/feed.json')) {
        return ITEMS.movie.slice(0, 8).map(publicMeta);
    }
    const catalog = /\/catalog\/(movie|series|channel|tv)\/([^/]+)/.exec(pathname);
    if (catalog) {
        const list = ITEMS[catalog[1] === 'tv' ? 'channel' : catalog[1]];
        const shift = [...catalog[2]].reduce((sum, char) => sum + char.charCodeAt(0), 0) % list.length;
        return { metas: [...list.slice(shift), ...list.slice(0, shift)].map(publicMeta) };
    }
    const meta = /\/meta\/(movie|series|channel|tv)\/([^/]+)\.json$/.exec(pathname);
    if (meta) {
        const item = BY_ID[decodeURIComponent(meta[2])];
        if (!item) {
            return { meta: null };
        }
        return {
            meta: {
                ...publicMeta(item),
                cast: ['Ana Lima', 'Bruno Costa', 'Carla Dias'],
                director: ['Diretora de Exemplo'],
                videos: item.type === 'series' ? episodes(item) : [],
                links: item.genres.map((genre) => ({ name: genre, category: 'Genres', url: `stremio:///discover/x/${item.type}/top?genre=${encodeURIComponent(genre)}` })),
                behaviorHints: { defaultVideoId: item.type === 'movie' ? item.id : null },
            }
        };
    }
    if (/\/stream\//.test(pathname)) return { streams: [] };
    if (/\/subtitles\//.test(pathname)) return { subtitles: [] };
    return null;
};

const images = new Map();
const demoImage = async (pathname) => {
    if (images.has(pathname)) return images.get(pathname);
    const match = /^\/__demo\/(poster|bg|ep)\/(.+)\.jpg$/.exec(pathname);
    if (!match) return null;
    const [, kind, name] = match;
    let svgText;
    if (kind === 'ep') {
        const [, id, season, number] = /^(.+)-(\d+)-(\d+)$/.exec(name);
        svgText = scene(BY_ID[id].seed * 31 + Number(season) * 10 + Number(number), 480, 270);
    } else {
        const item = BY_ID[name];
        if (!item) return null;
        svgText = kind === 'bg' ?
            scene(item.seed, 1280, 720) :
            item.type === 'channel' ? scene(item.seed, 400, 400, item.name) : scene(item.seed, 400, 600, item.name);
    }
    const data = await sharp(Buffer.from(svgText)).jpeg({ quality: 88 }).toBuffer();
    images.set(pathname, data);
    return data;
};

// ---------------------------------------------------------------------------------------------
// Servidor do build e das páginas montadas aqui (prints com legenda e imagem de destaque)
// ---------------------------------------------------------------------------------------------

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const pages = new Map();

const server = http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(req.url.split('?')[0]);
    if (pages.has(pathname)) {
        const { type, body } = pages.get(pathname);
        res.writeHead(200, { 'Content-Type': type });
        return res.end(body);
    }
    if (pathname.startsWith('/__demo/')) {
        const data = await demoImage(pathname).catch(() => null);
        res.writeHead(data ? 200 : 404, { 'Content-Type': 'image/jpeg' });
        return res.end(data);
    }
    let file = path.join(BUILD, pathname);
    if (!file.startsWith(BUILD)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
});

// Todo pedido para fora (inclusive os do "worker" do app) é respondido com os dados de exemplo
const interceptNetwork = async (browser) => {
    const session = await browser.target().createCDPSession();
    session.on('Fetch.requestPaused', async ({ requestId, request }) => {
        try {
            if (request.url.startsWith(BASE)) {
                return await session.send('Fetch.continueRequest', { requestId });
            }
            const body = demoResponse(request.url);
            if (body === null) {
                return await session.send('Fetch.failRequest', { requestId, errorReason: 'ConnectionRefused' });
            }
            await session.send('Fetch.fulfillRequest', {
                requestId,
                responseCode: 200,
                responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }],
                body: Buffer.from(JSON.stringify(body)).toString('base64'),
            });
        } catch (_error) {
            // pedido cancelado pelo próprio app (ex.: troca de tela)
        }
    });
    await session.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
};

// ---------------------------------------------------------------------------------------------
// Prints
// ---------------------------------------------------------------------------------------------

const PHONE = {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
    viewport: { width: 360, height: 640, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};
const TABLET = {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X210) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    viewport: { width: 960, height: 600, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const SHOTS = [
    { name: 'entrar', hash: '#/intro?form=login', guest: false, wait: 5000, title: 'Bem-vindo ao PP', subtitle: 'Entre com uma conta ou use como convidado' },
    { name: 'inicio', hash: '#/', wait: 7000, title: 'Tudo num só lugar', subtitle: 'Filmes, séries e canais dos addons que você escolher' },
    { name: 'descobrir', hash: '#/discover', wait: 6000, title: 'Descubra o que assistir', subtitle: 'Catálogos e gêneros para navegar' },
    { name: 'detalhes', hash: `#/detail/series/${ITEMS.series[0].id}`, wait: 6000, title: 'Tudo sobre cada título', subtitle: 'Sinopse, gêneros, temporadas e episódios' },
    { name: 'aparencia', hash: '#/settings', wait: 4000, scrollTo: 'Cor de destaque', title: 'Do seu jeito', subtitle: 'Escolha a cor do app, o fundo e o efeito vidro' },
    { name: 'cores', hash: '#/', wait: 7000, theme: { accent: '#e0458f', background: 'aurora', glass: true }, title: 'Visual Liquid Glass', subtitle: 'Bonito em qualquer cor que você escolher' },
];

const capture = async (browser, device, shot) => {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.emulate(device);
    await page.evaluateOnNewDocument((guest, theme) => {
        Object.defineProperty(navigator, 'language', { get: () => 'pt-BR' });
        Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt'] });
        if (guest) localStorage.setItem('pp-guest', '1');
        if (theme) localStorage.setItem('pp-theme', JSON.stringify(theme));
    }, shot.guest !== false, shot.theme || null);
    await page.goto(`${BASE}/${shot.hash}`, { waitUntil: 'domcontentloaded' });
    await sleep(shot.wait);
    if (shot.scrollTo) {
        await page.evaluate((text) => {
            const el = [...document.querySelectorAll('div')].find((d) => d.children.length === 0 && d.textContent.trim() === text);
            if (el) el.scrollIntoView({ block: 'start' });
        }, shot.scrollTo);
        await sleep(1200);
    }
    // Para o destaque do topo não trocar no meio do print
    await page.mouse.move(device.viewport.width / 2, 150);
    const data = await page.screenshot({ type: 'png' });
    await context.close();
    return data;
};

// Página com o print dentro de um celular/tablet, legenda em cima e fundo de aurora arco-íris
const framePage = (shot, imageUrl, landscape) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Jakarta'; src: url('/fonts/PlusJakartaSans.ttf'); font-weight: 200 900; }
* { margin: 0; box-sizing: border-box; }
body { width: ${landscape ? 1920 : 1080}px; height: ${landscape ? 1200 : 1920}px; overflow: hidden; font-family: 'Jakarta', sans-serif; color: #fff;
  background: radial-gradient(circle at 10% 0%, rgba(255,61,110,.45), transparent 45%), radial-gradient(circle at 95% 10%, rgba(255,210,31,.28), transparent 40%),
  radial-gradient(circle at 100% 70%, rgba(31,182,255,.4), transparent 45%), radial-gradient(circle at 0% 100%, rgba(176,77,255,.45), transparent 50%), #070818;
  display: flex; ${landscape ? 'flex-direction: row; align-items: center; padding: 0 90px; gap: 80px;' : 'flex-direction: column; align-items: center; padding-top: 110px;'} }
.text { ${landscape ? 'flex: 0 0 520px;' : 'text-align: center; padding: 0 70px;'} }
h1 { font-size: ${landscape ? 84 : 78}px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; }
h1 span { background: linear-gradient(90deg, #ff3d6e, #ff8a1f, #ffd21f, #35d07f, #1fb6ff, #b04dff); -webkit-background-clip: text; color: transparent; }
p { margin-top: 26px; font-size: ${landscape ? 40 : 40}px; line-height: 1.35; opacity: .82; font-weight: 500; }
.device { ${landscape ? 'width: 1180px;' : 'margin-top: 90px; width: 820px;'} padding: 18px; border-radius: ${landscape ? 46 : 70}px; background: linear-gradient(160deg, #2a2d48, #0d0f1f);
  box-shadow: 0 0 0 2px rgba(255,255,255,.12), 0 50px 120px -30px rgba(0,0,0,.9), 0 0 80px -20px rgba(91,108,255,.5); }
.device img { display: block; width: 100%; border-radius: ${landscape ? 30 : 54}px; }
small { position: absolute; bottom: 26px; ${landscape ? 'left: 90px;' : 'left: 0; right: 0; text-align: center;'} font-size: 24px; opacity: .45; }
</style></head><body>
<div class="text"><h1>${shot.title.replace(/(\S+)$/, '<span>$1</span>')}</h1><p>${shot.subtitle}</p></div>
<div class="device"><img src="${imageUrl}"></div>
<small>Imagens ilustrativas: títulos de exemplo. O PP não fornece filmes, séries ou canais.</small>
</body></html>`;

const featurePage = (iconUrl, phoneUrl) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Jakarta'; src: url('/fonts/PlusJakartaSans.ttf'); font-weight: 200 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1024px; height: 500px; overflow: hidden; position: relative; font-family: 'Jakarta', sans-serif; color: #fff;
  background: radial-gradient(circle at 0% 0%, rgba(255,61,110,.5), transparent 40%), radial-gradient(circle at 40% 120%, rgba(176,77,255,.5), transparent 45%),
  radial-gradient(circle at 100% 0%, rgba(31,182,255,.45), transparent 45%), radial-gradient(circle at 75% 100%, rgba(53,208,127,.3), transparent 40%), #070818; }
.left { position: absolute; left: 70px; top: 0; bottom: 0; width: 520px; display: flex; flex-direction: column; justify-content: center; }
.brand { display: flex; align-items: center; gap: 26px; }
.brand img { width: 128px; height: 128px; filter: drop-shadow(0 18px 30px rgba(0,0,0,.6)); }
.brand h1 { font-size: 104px; font-weight: 800; letter-spacing: -0.03em; }
p { margin-top: 22px; font-size: 30px; font-weight: 600; line-height: 1.3; }
p span { background: linear-gradient(90deg, #ff3d6e, #ff8a1f, #ffd21f, #35d07f, #1fb6ff, #b04dff); -webkit-background-clip: text; color: transparent; }
.chips { margin-top: 26px; display: flex; gap: 12px; }
.chips div { padding: 9px 18px; border-radius: 99px; font-size: 18px; font-weight: 600; background: rgba(255,255,255,.08); box-shadow: inset 0 0 0 1px rgba(255,255,255,.15); }
.phone { position: absolute; right: 70px; top: 46px; width: 300px; padding: 10px; border-radius: 44px; transform: rotate(8deg);
  background: linear-gradient(160deg, #2a2d48, #0d0f1f); box-shadow: 0 0 0 2px rgba(255,255,255,.12), 0 40px 80px -20px rgba(0,0,0,.9), 0 0 60px -10px rgba(91,108,255,.6); }
.phone img { display: block; width: 100%; border-radius: 34px; }
</style></head><body>
<div class="left">
  <div class="brand"><img src="${iconUrl}"><h1>PP</h1></div>
  <p>Seus filmes, séries e canais<br><span>num só lugar.</span></p>
  <div class="chips"><div>Liquid Glass</div><div>Suas cores</div><div>Código aberto</div></div>
</div>
<div class="phone"><img src="${phoneUrl}"></div>
</body></html>`;

const render = async (browser, html, { width, height, type = 'jpeg', name }) => {
    pages.set(`/__loja/${name}.html`, { type: 'text/html; charset=utf-8', body: html });
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/__loja/${name}.html`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    const data = await page.screenshot({ type, ...(type === 'jpeg' ? { quality: 92 } : {}) });
    await page.close();
    return data;
};

(async () => {
    if (!fs.existsSync(path.join(BUILD, 'index.html'))) {
        throw new Error('Gere o build antes: npx pnpm@11.8.0 run build');
    }
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });
    await new Promise((resolve) => server.listen(PORT, resolve));

    // Ícone da loja: quadrado cheio (a Play Store arredonda os cantos sozinha)
    await sharp(Buffer.from(rainbowIcon({ rounded: false }))).png().toFile(path.join(OUT, 'icone-512.png'));
    const roundedIcon = await sharp(Buffer.from(rainbowIcon({ rounded: true }))).png().toBuffer();
    pages.set('/__loja/icone.png', { type: 'image/png', body: roundedIcon });
    console.log('loja/icone-512.png');

    const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run', '--hide-scrollbars', '--lang=pt-BR'] });
    await interceptNetwork(browser);

    for (const [deviceName, device, shots] of [['celular', PHONE, SHOTS], ['tablet', TABLET, SHOTS.filter((shot) => ['inicio', 'descobrir', 'detalhes', 'cores'].includes(shot.name))]]) {
        const landscape = deviceName === 'tablet';
        for (const [index, shot] of shots.entries()) {
            const raw = await capture(browser, device, shot);
            pages.set(`/__loja/${deviceName}-${shot.name}.png`, { type: 'image/png', body: raw });
            const framed = await render(browser, framePage(shot, `/__loja/${deviceName}-${shot.name}.png`, landscape), {
                width: landscape ? 1920 : 1080, height: landscape ? 1200 : 1920, name: `${deviceName}-${shot.name}`,
            });
            const file = path.join(OUT, `${deviceName}-${index + 1}-${shot.name}.jpg`);
            fs.writeFileSync(file, framed);
            console.log(path.relative(ROOT, file));
        }
    }

    const feature = await render(browser, featurePage('/__loja/icone.png', '/__loja/celular-inicio.png'), { width: 1024, height: 500, name: 'destaque' });
    fs.writeFileSync(path.join(OUT, 'destaque-1024x500.jpg'), feature);
    console.log('loja/destaque-1024x500.jpg');

    await browser.close();
    server.close();
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
