// Copyright (C) 2017-2025 Smart code 203358507

import React from 'react';
import { flushSync } from 'react-dom';
import { Routes as RRoutes, Route as RRoute, useLocation, useNavigate, useNavigationType, matchPath } from 'react-router';
import type { Location } from 'react-router';
import { useProfile } from 'stremio/common';
import { supportsViewTransitions } from 'stremio/common/Platform/device';
import { isGuest, setGuest } from 'stremio/common/ppGuest';
import routerPaths from './routerPaths';
import Route from './Route';

type RouterPath = typeof routerPaths[number];
type CachedView = {
    key: string,
    location: Location,
    route: RouterPath,
};

const VIEW_COUNT = Math.max(...routerPaths.map((route) => route.view)) + 1;

const getRouteForLocation = (location: Location) => {
    return routerPaths.find((route) => matchPath({ path: route.path, end: true }, location.pathname));
};

const getNextViews = (currentViews: (CachedView | null)[], location: Location) => {
    const route = getRouteForLocation(location);
    if (!route) {
        return currentViews;
    }

    return Array.from({ length: VIEW_COUNT }, (_, index) => {
        if (index < route.view) {
            return currentViews[index] || null;
        }

        if (index === route.view) {
            return {
                key: `${route.view}:${route.path}`,
                location,
                route,
            };
        }

        return null;
    });
};

const Routes = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const navigationType = useNavigationType();
    const profile = useProfile();
    const previousAuthRef = React.useRef(profile.auth);
    const [views, setViews] = React.useState<(CachedView | null)[]>(() => getNextViews([], location));

    // PP: login como no Stremio. Sem conta, o app abre na tela de entrar até a pessoa entrar
    // ou escolher "Entrar como convidado"; ao sair da conta, volta para a tela de entrar.
    React.useEffect(() => {
        if (previousAuthRef.current !== null && profile.auth === null) {
            setGuest(false);
            navigate('/intro', { replace: true });
        } else if (profile.auth !== null && location.pathname === '/intro') {
            navigate('/', { replace: true });
        } else if (profile.auth === null && !isGuest() && location.pathname !== '/intro') {
            navigate('/intro', { replace: true });
        }
        previousAuthRef.current = profile.auth;
    }, [location.pathname, profile.auth]);

    React.useLayoutEffect(() => {
        const updateViews = () => setViews((currentViews) => getNextViews(currentViews, location));

        if (
            navigationType === 'PUSH' &&
            supportsViewTransitions &&
            typeof document.startViewTransition === 'function' &&
            !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            // PP: a animação pode ser interrompida (outra navegação, janela redimensionada); não é um erro
            const transition = document.startViewTransition(() => flushSync(updateViews));
            const ignoreAbort = () => undefined;
            transition.ready.catch(ignoreAbort);
            transition.finished.catch(ignoreAbort);
        } else {
            updateViews();
        }
    }, [location, navigationType]);

    const visibleViews = views.filter((view): view is CachedView => view !== null);

    return (
        <div className={'routes-container'}>
            {
                visibleViews.map((view, index) => (
                    <RRoutes key={view.key} location={view.location}>
                        <RRoute
                            path={view.route.path}
                            element={<Route component={view.route.element} focused={index === visibleViews.length - 1} />}
                        />
                    </RRoutes>
                ))
            }
        </div>
    );
};

export default Routes;
