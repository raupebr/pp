// Copyright (C) 2017-2023 Smart code 203358507

require('spatial-navigation-polyfill');
const React = require('react');
const { useTranslation } = require('react-i18next');
const { createPath, useLocation, useNavigate } = require('react-router');
const { useCore } = require('stremio/core');
const { Routes, useGoBack } = require('stremio-router');
const { Chromecast, ServicesProvider, GamepadProvider } = require('stremio/services');
const { FullscreenProvider, ToastProvider, TooltipProvider, ShortcutsProvider, DiscordProvider, CONSTANTS, useBinaryState, useProfile, withCoreSuspender, usePlatform, interfaceLanguages } = require('stremio/common');
const ServicesToaster = require('./ServicesToaster');
const SearchParamsHandler = require('./SearchParamsHandler');
const DeepLinkHandler = require('./DeepLinkHandler');
const { default: ShellOpenHandler } = require('./ShellOpenHandler');
const { default: UpdaterBanner } = require('./UpdaterBanner');
const { default: ShortcutsModal } = require('./ShortcutsModal');
const { default: GamepadModal } = require('./GamepadModal');
const { default: useInterfaceScale } = require('./useInterfaceScale');
const { default: useAndroidBackButton } = require('./useAndroidBackButton');
const styles = require('./styles');

const ProtectedRoutes = withCoreSuspender(Routes);
const NAVIGATE_TABS_ROUTES = ['/', '/discover', '/library', '/calendar', '/addons', '/settings'];
const PP_LANGUAGE_CHOSEN_KEY = 'pp-language-chosen';

// PP: idioma do aparelho (ex.: pt-BR num celular brasileiro), se o app tiver tradução para ele
const deviceInterfaceLanguage = () => {
    const device = (navigator.language || '').toLowerCase();
    const exact = interfaceLanguages.find(({ codes }) => codes[0].toLowerCase() === device);
    const sameLanguage = interfaceLanguages.find(({ codes }) => codes[0].split('-')[0].toLowerCase() === device.split('-')[0]);
    return (exact || sameLanguage)?.codes[0] ?? null;
};

const App = () => {
    const core = useCore();
    const profile = useProfile();
    const changeInterfaceScale = useInterfaceScale(profile);
    const { i18n } = useTranslation();
    const { shell } = usePlatform();
    const location = useLocation();
    const navigate = useNavigate();
    const goBack = useGoBack();
    const locationPath = createPath(location);
    const previousPathRef = React.useRef(locationPath);
    const [gamepadSupportEnabled, setGamepadSupportEnabled] = React.useState(false);
    const services = React.useMemo(() => {
        return {
            chromecast: new Chromecast(),
        };
    }, []);
    const [shortcutModalOpen,, closeShortcutsModal, toggleShortcutModal] = useBinaryState(false);
    const [gamepadModalOpen,, closeGamepadModal, toggleGamepadModal] = useBinaryState(false);
    useAndroidBackButton();

    const onShortcut = React.useCallback((name, combo, key) => {
        switch (name) {
            case 'interfaceScale':
                changeInterfaceScale(['decrease', 'increase', 'reset'][combo]);
                break;
            case 'shortcuts':
                toggleShortcutModal();
                break;
            case 'gamepadGuide':
                toggleGamepadModal();
                break;
            case 'navigateSearch':
                navigate('/search');
                break;
            case 'navigateTabs': {
                const index = Number(key) - 1;
                if (index >= 0 && index < NAVIGATE_TABS_ROUTES.length)
                    navigate(NAVIGATE_TABS_ROUTES[index]);
                break;
            }
            case 'navigateHistory':
                if (combo === 0) {
                    goBack();
                } else {
                    navigate(1);
                }
                break;
        }
    }, [toggleShortcutModal, toggleGamepadModal, changeInterfaceScale, navigate, goBack]);

    React.useEffect(() => {
        const prevPath = previousPathRef.current;
        previousPathRef.current = locationPath;
        if (prevPath !== locationPath) {
            core.transport.analytics({
                event: 'LocationPathChanged',
                args: { prevPath }
            });
        }
    }, [locationPath, core.transport]);

    React.useEffect(() => {
        const onChromecastStateChange = () => {
            if (services.chromecast.active) {
                services.chromecast.transport.setOptions({
                    receiverApplicationId: CONSTANTS.CHROMECAST_RECEIVER_APP_ID,
                    autoJoinPolicy: chrome.cast.AutoJoinPolicy.PAGE_SCOPED,
                    resumeSavedSession: false,
                    language: null,
                    androidReceiverCompatible: true
                });
            }
        };
        services.chromecast.on('stateChanged', onChromecastStateChange);
        services.chromecast.start();

        window.services = services;
        return () => {
            services.chromecast.stop();
            services.chromecast.off('stateChanged', onChromecastStateChange);
        };
    }, [services]);

    // PP: no primeiro uso o app abre no idioma do aparelho (sem login não há conta de onde trazer o idioma).
    // Depois disso vale o que a pessoa escolher em Configurações.
    React.useEffect(() => {
        if (!profile.settings) {
            return;
        }

        try {
            if (localStorage.getItem(PP_LANGUAGE_CHOSEN_KEY) !== null) {
                return;
            }

            localStorage.setItem(PP_LANGUAGE_CHOSEN_KEY, '1');
        } catch (_e) {
            return;
        }

        const language = deviceInterfaceLanguage();
        if (language !== null && language !== profile.settings.interfaceLanguage) {
            core.transport.dispatch({
                action: 'Ctx',
                args: {
                    action: 'UpdateSettings',
                    args: {
                        ...profile.settings,
                        interfaceLanguage: language
                    }
                }
            });
        }
    }, [profile.settings, core]);

    React.useEffect(() => {
        if (typeof profile.settings?.interfaceLanguage === 'string') {
            i18n.changeLanguage(profile.settings.interfaceLanguage);
        }

        if (typeof profile.settings?.gamepadSupport === 'boolean') {
            setGamepadSupportEnabled(profile.settings.gamepadSupport);
        }

        if (profile.settings?.quitOnClose && shell.state.windowClosed) {
            shell.send('quit');
        }
    }, [profile.settings, i18n, shell]);

    React.useEffect(() => {
        const onWindowFocus = () => {
            core.transport.dispatch({
                action: 'Ctx',
                args: {
                    action: 'PullAddonsFromAPI'
                }
            });
            core.transport.dispatch({
                action: 'Ctx',
                args: {
                    action: 'PullUserFromAPI',
                    args: {}
                }
            });
            core.transport.dispatch({
                action: 'Ctx',
                args: {
                    action: 'SyncLibraryWithAPI'
                }
            });
            core.transport.dispatch({
                action: 'Ctx',
                args: {
                    action: 'PullNotifications'
                }
            });
        };

        onWindowFocus();
        window.addEventListener('focus', onWindowFocus);

        return () => {
            window.removeEventListener('focus', onWindowFocus);
        };
    }, [core.transport]);

    return (
        <ServicesProvider services={services}>
            <ToastProvider className={styles['toasts-container']}>
                <TooltipProvider className={styles['tooltip-container']}>
                    <GamepadProvider enabled={gamepadSupportEnabled} onGuide={toggleGamepadModal}>
                        <ShortcutsProvider onShortcut={onShortcut}>
                            <FullscreenProvider>
                                <DiscordProvider>
                                    {
                                        shortcutModalOpen && <ShortcutsModal onClose={closeShortcutsModal}/>
                                    }
                                    {
                                        gamepadModalOpen && <GamepadModal onClose={closeGamepadModal}/>
                                    }
                                    <ServicesToaster />
                                    <SearchParamsHandler />
                                    <DeepLinkHandler />
                                    <ShellOpenHandler />
                                    <UpdaterBanner className={styles['updater-banner-container']} />
                                    <ProtectedRoutes />
                                </DiscordProvider>
                            </FullscreenProvider>
                        </ShortcutsProvider>
                    </GamepadProvider>
                </TooltipProvider>
            </ToastProvider>
        </ServicesProvider>
    );
};

module.exports = withCoreSuspender(App);
