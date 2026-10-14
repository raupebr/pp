// PP: no app Android, o botão (ou gesto) de voltar volta para a tela anterior do PP.
// Na tela inicial (e na tela de entrar) ele fecha o app, como nos outros apps do Android.

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useGoBack } from 'stremio-router';

const useAndroidBackButton = () => {
    const location = useLocation();
    const goBack = useGoBack();
    const latest = useRef({ pathname: location.pathname, goBack });
    latest.current = { pathname: location.pathname, goBack };

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        const listener = CapacitorApp.addListener('backButton', () => {
            const { pathname, goBack } = latest.current;
            if (pathname === '/' || pathname === '/intro') {
                CapacitorApp.exitApp();
            } else {
                goBack();
            }
        });

        return () => {
            listener.then((handle) => handle.remove());
        };
    }, []);
};

export default useAndroidBackButton;
