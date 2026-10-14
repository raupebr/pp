import React, { createContext, useContext } from 'react';
import { name, isMobile } from './device';
import useShell from './shell/useShell';

interface PlatformContext {
    name: string;
    isMobile: boolean;
    shell: Shell;
    openExternal: (url: string) => void;
}

const PlatformContext = createContext<PlatformContext>({} as PlatformContext);

type Props = {
    children: JSX.Element;
};

const PlatformProvider = ({ children }: Props) => {
    const shell = useShell();

    // PP: abre o link direto (antes, links de fora passavam por uma página de aviso do site do Stremio)
    const openExternal = (url: string) => {
        try {
            const { protocol } = new URL(url);
            if (!['http:', 'https:', 'webcal:'].includes(protocol)) {
                return;
            }

            window.open(url, '_blank');
        } catch (e) {
            console.error('Failed to parse external url:', e);
        }
    };

    return (
        <PlatformContext.Provider value={{ openExternal, shell, name, isMobile }}>
            {children}
        </PlatformContext.Provider>
    );
};

const usePlatform = () => {
    return useContext(PlatformContext);
};

export {
    PlatformProvider,
    usePlatform
};
