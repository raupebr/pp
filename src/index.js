// Copyright (C) 2017-2023 Smart code 203358507

if (typeof process.env.SENTRY_DSN === 'string') {
    const Sentry = require('@sentry/browser');
    Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const Bowser = require('bowser');
const browser = Bowser.parse(window.navigator?.userAgent || '');
if (browser?.platform?.type === 'desktop') {
    document.querySelector('meta[name="viewport"]')?.setAttribute('content', '');
}

const React = require('react');
const ReactDOM = require('react-dom/client');
const { HashRouter } = require('react-router-dom');
const i18n = require('i18next');
const { initReactI18next } = require('react-i18next');
const stremioTranslations = require('stremio-translations');
const App = require('./App');
const { default: WebUpdateScreen } = require('./App/WebUpdateScreen');
const { CoreProvider } = require('./core');
const { FileDropProvider, PlatformProvider } = require('./common');
const { applyTheme, loadTheme, syncAppIcon } = require('./common/ppTheme');
const ppTranslations = require('./common/ppTranslations');

// PP: aplica a cor e o fundo escolhidos antes da primeira tela aparecer (e confere o ícone do app Android)
applyTheme(loadTheme());
syncAppIcon(loadTheme());

// PP: o app se chama PP e os textos não citam o Stremio. A única exceção é a tela de entrar: a conta
// é do Stremio, então os termos e o aviso de marketing aceitos ao criar a conta dizem de quem são.
const PP_KEEP_STREMIO = new Set(['READ_AND_AGREE', 'MARKETING_AGREE']);
const rebrand = (strings) => Object.fromEntries(Object.entries(strings).map(([key, text]) => [
    key,
    typeof text === 'string' && !PP_KEEP_STREMIO.has(key) ?
        text.replace(/\bStremio\b(?!\.[a-z])/g, 'PP')
        :
        text
]));

const translations = Object.fromEntries(Object.entries(stremioTranslations()).map(([key, value]) => [key, {
    translation: { ...rebrand(value), ...ppTranslations[key] }
}]));

i18n
    .use(initReactI18next)
    .init({
        resources: translations,
        lng: 'en-US',
        fallbackLng: 'en-US',
        interpolation: {
            escapeValue: false
        }
    });

const appInfo = {
    appVersion: process.env.VERSION,
    shellVersion: null
};

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(
    <React.StrictMode>
        <PlatformProvider>
            <CoreProvider appInfo={appInfo}>
                <FileDropProvider>
                    <HashRouter>
                        <>
                            <WebUpdateScreen />
                            <App />
                        </>
                    </HashRouter>
                </FileDropProvider>
            </CoreProvider>
        </PlatformProvider>
    </React.StrictMode>
);
