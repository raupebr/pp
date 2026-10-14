// PP: aparência personalizável (cor de destaque, fundo e efeito vidro).
// Fica salva no aparelho e vira variáveis CSS no <html>; App/styles.less e a paleta (pp-colors.less) usam essas variáveis.

import { useCallback, useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { icon, logoColors, svg } from 'stremio/common/ppLogo';
import { PP_ACCENT_PRESETS, nearestPreset } from 'stremio/common/ppPresets';

export { PP_ACCENT_PRESETS };

export type PPBackground = 'aurora' | 'escuro' | 'preto';

export type PPTheme = {
    accent: string,
    background: PPBackground,
    glass: boolean,
};

// Plugin do app Android que troca o ícone da tela inicial (android/.../PPIconPlugin.java)
const PPIcon = registerPlugin<{ setIcon(options: { id: string }): Promise<void> }>('PPIcon');

// No app Android, o ícone de fora acompanha a cor escolhida (a cor pronta mais parecida).
// A troca acontece quando a pessoa sai do app, para não fechar a tela que está aberta.
export const syncAppIcon = (theme: PPTheme) => {
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    const preset = nearestPreset(theme.accent);
    if (preset) {
        PPIcon.setIcon({ id: preset.id }).catch((error) => console.error(error));
    }
};

export const PP_BACKGROUNDS: { id: PPBackground, name: string }[] = [
    { id: 'aurora', name: 'Aurora' },
    { id: 'escuro', name: 'Escuro' },
    { id: 'preto', name: 'Preto' },
];

export const PP_DEFAULT_THEME: PPTheme = {
    accent: PP_ACCENT_PRESETS[0].color,
    background: 'aurora',
    glass: true,
};

const STORAGE_KEY = 'pp-theme';
const CHANGE_EVENT = 'pp-theme-change';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string): [number, number, number] | null => {
    const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (match === null) {
        return null;
    }

    const value = parseInt(match[1], 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHsl = ([r, g, b]: [number, number, number]): [number, number, number] => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) {
        return [0, 0, l * 100];
    }

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s * 100, l * 100];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
};

const luminance = ([r, g, b]: [number, number, number]) => {
    const c = (v: number) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};

const hsla = (h: number, s: number, l: number, a = 1) => `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${a})`;

const sanitize = (value: unknown): PPTheme => {
    const theme = { ...PP_DEFAULT_THEME };
    if (value !== null && typeof value === 'object') {
        const { accent, background, glass } = value as Partial<PPTheme>;
        if (typeof accent === 'string' && hexToRgb(accent) !== null) {
            theme.accent = accent.toLowerCase();
        }
        if (PP_BACKGROUNDS.some(({ id }) => id === background)) {
            theme.background = background as PPBackground;
        }
        if (typeof glass === 'boolean') {
            theme.glass = glass;
        }
    }

    return theme;
};

export const loadTheme = (): PPTheme => {
    try {
        return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
    } catch (_e) {
        return { ...PP_DEFAULT_THEME };
    }
};

export const applyTheme = (theme: PPTheme) => {
    const root = document.documentElement;
    const [h, s, l] = rgbToHsl(hexToRgb(theme.accent) ?? hexToRgb(PP_DEFAULT_THEME.accent)!);

    // Cores quase cinza deixam o app todo em tons neutros
    const tint = s < 12 ? 0 : clamp(s / 70, 0.45, 1.25);

    // O texto dos botões coloridos é branco: escurece a cor escolhida até o texto ficar legível
    let accentL = clamp(l, 28, 62);
    while (accentL > 28 && 1.05 / (luminance(hslToRgb(h, s, accentL)) + 0.05) < 3) {
        accentL -= 1;
    }

    const vars: Record<string, string> = {
        '--pp-h': h.toFixed(1),
        '--pp-s': tint.toFixed(3),
        '--pp-accent-h': h.toFixed(1),
        '--pp-accent-s': `${s.toFixed(1)}%`,
        '--pp-accent-l': `${accentL.toFixed(1)}%`,
        '--primary-accent-color': hsla(h, s, accentL),
        '--secondary-accent-color': hsla(h, s, Math.min(accentL + 8, 68)),
        '--quaternary-accent-color': hsla(h, s * 0.8, accentL * 0.55),
        '--outer-glow': `0px 0px 15px ${hsla(h, s, accentL, 0.4)}`,
    };
    for (const [name, value] of Object.entries(vars)) {
        root.style.setProperty(name, value);
    }
    root.dataset.ppBackground = theme.background;
    root.dataset.ppGlass = theme.glass ? 'on' : 'off';

    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hsla(h, s * tint * 0.35, 6));

    // Ícone da aba do navegador com a logo na cor escolhida
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) {
        favicon.type = 'image/svg+xml';
        favicon.href = `data:image/svg+xml,${encodeURIComponent(svg(icon({ id: 'favicon', colors: logoColors(h, s) }), '64'))}`;
    }
};

export const saveTheme = (theme: PPTheme) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {
        console.error(e);
    }

    applyTheme(theme);
    syncAppIcon(theme);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
};

export const usePPTheme = (): [PPTheme, (changes: Partial<PPTheme>) => void, () => void] => {
    const [theme, setTheme] = useState(loadTheme);

    useEffect(() => {
        const onChange = () => setTheme(loadTheme());
        window.addEventListener(CHANGE_EVENT, onChange);
        return () => window.removeEventListener(CHANGE_EVENT, onChange);
    }, []);

    const updateTheme = useCallback((changes: Partial<PPTheme>) => {
        saveTheme(sanitize({ ...loadTheme(), ...changes }));
    }, []);

    const resetTheme = useCallback(() => {
        saveTheme({ ...PP_DEFAULT_THEME });
    }, []);

    return [theme, updateTheme, resetTheme];
};
