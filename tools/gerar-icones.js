// PP: gera os ícones, o símbolo da barra de cima, o favicon e as telas de abertura do iPhone/iPad
// a partir do desenho em src/common/ppLogo.js, na cor padrão do tema (azul).
// Precisa do "sharp", instalado fora do projeto (para não mexer nas dependências do app):
//   npm i --prefix %TEMP%\pp-sharp sharp
//   set NODE_PATH=%TEMP%\pp-sharp\node_modules && node tools/gerar-icones.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { logoColors, defs, letters, background, icon } = require('../src/common/ppLogo');
const { PP_ACCENT_PRESETS, hexToHueSat } = require('../src/common/ppPresets');

const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'assets', 'images');
const FAVICONS = path.join(ROOT, 'assets', 'favicons');

// Cor padrão do PP (a mesma de PP_DEFAULT_THEME em src/common/ppTheme.ts): azul #2563eb
const COLORS = logoColors(221.2, 83.2);
const BACKGROUND = '#050a1a';

const svg = (size, inner, viewBox = '0 0 512 512') =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${inner}</svg>`;
const png = (source) => sharp(Buffer.from(source)).png();

// Ícone normal: quadrado arredondado com margem transparente
const iconSvg = (size) => svg(size, icon({ colors: COLORS }));

// Ícone "maskable" (o Android recorta em círculo ou gota): fundo cheio e letras menores
const maskableSvg = (size) => svg(size, `${defs('m', COLORS)}
  ${background('m', 0)}
  ${letters('m', 256, 258, 180)}`);

// Ícone monocromático (só a forma)
const monoSvg = (size) => svg(size, letters('o', 256, 258, 224, { mono: true }));

// Tela de abertura: ícone no centro sobre o fundo escuro do app
const splashSvg = (width, height) => {
    const size = Math.round(Math.min(width, height) * 0.26);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="aurora" cx="0.2" cy="0" r="0.9">
      <stop offset="0" stop-color="${COLORS.mid}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${COLORS.mid}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="${BACKGROUND}"/>
  <rect width="${width}" height="${height}" fill="url(#aurora)"/>
  <svg x="${(width - size) / 2}" y="${(height - size) / 2}" width="${size}" height="${size}" viewBox="0 0 512 512">${icon({ id: 'splash', colors: COLORS })}</svg>
</svg>`;
};

// .ico com várias resoluções (PNG dentro do ICO)
const ico = (images) => {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(images.length, 4);
    let offset = 6 + images.length * 16;
    const entries = images.map(({ size, data }) => {
        const entry = Buffer.alloc(16);
        entry.writeUInt8(size >= 256 ? 0 : size, 0);
        entry.writeUInt8(size >= 256 ? 0 : size, 1);
        entry.writeUInt16LE(1, 4);
        entry.writeUInt16LE(32, 6);
        entry.writeUInt32LE(data.length, 8);
        entry.writeUInt32LE(offset, 12);
        offset += data.length;
        return entry;
    });
    return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
};

(async () => {
    await png(iconSvg(512)).toFile(path.join(IMAGES, 'icon.png'));
    await png(iconSvg(512)).toFile(path.join(IMAGES, 'icon_512x512.png'));
    await png(iconSvg(196)).toFile(path.join(IMAGES, 'icon_196x196.png'));
    await png(iconSvg(256)).toFile(path.join(IMAGES, 'pp_symbol.png'));
    await png(maskableSvg(512)).toFile(path.join(IMAGES, 'maskable_icon.png'));
    await png(maskableSvg(512)).toFile(path.join(IMAGES, 'maskable_icon_512x512.png'));
    await png(maskableSvg(196)).toFile(path.join(IMAGES, 'maskable_icon_196x196.png'));
    await png(monoSvg(512)).toFile(path.join(IMAGES, 'monochrome_icon_512x512.png'));

    const favicon = ico(await Promise.all([16, 32, 48, 256].map(async (size) => ({
        size,
        data: await png(iconSvg(size)).toBuffer(),
    }))));
    fs.writeFileSync(path.join(FAVICONS, 'favicon.ico'), favicon);
    fs.writeFileSync(path.join(FAVICONS, 'icon_256x256.ico'), favicon);

    const splashDir = path.join(IMAGES, 'splash');
    for (const file of fs.readdirSync(splashDir)) {
        const match = file.match(/(\d+)-(\d+)\.(jpg|png)$/);
        if (match === null) continue;
        const image = sharp(Buffer.from(splashSvg(Number(match[1]), Number(match[2]))));
        await (match[3] === 'jpg' ? image.jpeg({ quality: 90 }) : image.png()).toFile(path.join(splashDir, file));
    }

    // App Android (Capacitor): ícone normal, redondo, adaptativo e tela de abertura.
    // Além do ícone padrão (ic_launcher), um conjunto por cor pronta (ic_launcher_azul, ic_launcher_rosa...):
    // o app troca o ícone da tela inicial conforme a cor escolhida (ver PPIconPlugin.java).
    const res = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
    if (fs.existsSync(res)) {
        const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
        const androidIcons = async (suffix, colors) => {
            const fullSvg = (size) => svg(size, icon({ id: 'a', colors }));
            const roundSvg = (size) => svg(size, `${defs('r', colors)}
  <clipPath id="rclip"><circle cx="256" cy="256" r="256"/></clipPath>
  <g clip-path="url(#rclip)">${background('r', 0)}</g>
  ${letters('r', 256, 258, 200)}`);
            // Ícone adaptativo: 108dp, com as letras dentro da área que nunca é cortada (66dp)
            const foregroundSvg = (size) => svg(size, `${defs('f', colors)}
  ${letters('f', 256, 258, 170)}`);
            const backgroundSvg = (size) => svg(size, `${defs('b', colors)}
  ${background('b', 0)}`);
            for (const [name, scale] of Object.entries(densities)) {
                const dir = path.join(res, `mipmap-${name}`);
                fs.mkdirSync(dir, { recursive: true });
                await png(fullSvg(48 * scale)).toFile(path.join(dir, `ic_launcher${suffix}.png`));
                await png(roundSvg(48 * scale)).toFile(path.join(dir, `ic_launcher${suffix}_round.png`));
                await png(foregroundSvg(108 * scale)).toFile(path.join(dir, `ic_launcher${suffix}_foreground.png`));
                await png(backgroundSvg(108 * scale)).toFile(path.join(dir, `ic_launcher${suffix}_background.png`));
            }
            const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher${suffix}_background"/>
    <foreground android:drawable="@mipmap/ic_launcher${suffix}_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher${suffix}_foreground"/>
</adaptive-icon>
`;
            fs.writeFileSync(path.join(res, 'mipmap-anydpi-v26', `ic_launcher${suffix}.xml`), adaptive);
            fs.writeFileSync(path.join(res, 'mipmap-anydpi-v26', `ic_launcher${suffix}_round.xml`), adaptive);
        };
        await androidIcons('', COLORS);
        for (const preset of PP_ACCENT_PRESETS) {
            const [hue, saturation] = hexToHueSat(preset.color);
            await androidIcons(`_${preset.id}`, logoColors(hue, saturation));
        }

        for (const dir of fs.readdirSync(res).filter((d) => d.startsWith('drawable'))) {
            const file = path.join(res, dir, 'splash.png');
            if (!fs.existsSync(file)) continue;
            const { width, height } = await sharp(file).metadata();
            await png(splashSvg(width, height)).toFile(`${file}.tmp`);
            fs.renameSync(`${file}.tmp`, file);
        }
        console.log('ícones do Android gerados');
    }

    console.log('ícones do PP gerados');
})();
