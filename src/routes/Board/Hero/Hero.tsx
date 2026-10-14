// PP: destaque no topo da tela inicial. Mostra os primeiros títulos do primeiro catálogo
// (imagem de fundo, logo, ano, duração, nota e descrição) e troca sozinho a cada alguns segundos.
// Dá para arrastar com o dedo (ou o mouse) para um lado e para o outro, ou usar as setas.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import Icon from '@stremio/stremio-icons/react';
import { useNavigateWithOrigin } from 'stremio-router';
import { Button } from 'stremio/components';
import getMetaDetailsHref from 'stremio/common/getMetaDetailsHref';
import styles from './Hero.less';

const MAX_ITEMS = 6;
const INTERVAL = 8000;
// Quanto o dedo precisa andar para decidir se é arrasto para o lado (px) e para trocar de título
const DRAG_START = 8;
const SWIPE_MIN = 50;
const SWIPE_RATIO = 0.15;

type HeroItem = {
    id: string,
    name: string,
    background?: string | null,
    logo?: string | null,
    description?: string | null,
    releaseInfo?: string | null,
    runtime?: string | null,
    links?: { name: string, category: string }[],
    deepLinks?: {
        metaDetailsVideos?: string | null,
        metaDetailsStreams?: string | null,
    },
};

type Props = {
    className?: string,
    items: HeroItem[],
};

type DragState = {
    pointerId: number,
    startX: number,
    startY: number,
    dx: number,
    horizontal: boolean | null,
};

const Hero = ({ className, items }: Props) => {
    const { t } = useTranslation();
    const { navigateWithOrigin } = useNavigateWithOrigin();
    const slides = useMemo(() => {
        return items
            .filter((item) => typeof item.background === 'string' && item.background.length > 0)
            .slice(0, MAX_ITEMS);
    }, [items]);
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [drag, setDrag] = useState<number | null>(null);
    const [logoFailed, setLogoFailed] = useState<Record<string, boolean>>({});
    const heroRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<DragState | null>(null);
    const justDragged = useRef(false);

    const count = slides.length;
    const position = Math.min(index, count - 1);
    const current = slides[position];

    const go = useCallback((delta: number) => {
        setIndex((i) => (Math.min(i, count - 1) + delta + count) % count);
    }, [count]);

    // Troca sozinho (para enquanto o mouse está em cima, com foco ou arrastando)
    useEffect(() => {
        if (paused || drag !== null || count < 2) {
            return;
        }

        const timeout = setTimeout(() => go(1), INTERVAL);
        return () => clearTimeout(timeout);
    }, [index, paused, drag, count, go]);

    const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (count < 2 || (event.pointerType === 'mouse' && event.button !== 0)) {
            return;
        }

        dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, horizontal: null };
    }, [count]);

    const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const state = dragRef.current;
        if (state === null || state.pointerId !== event.pointerId) {
            return;
        }

        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;
        if (state.horizontal === null) {
            if (Math.abs(dx) < DRAG_START && Math.abs(dy) < DRAG_START) {
                return;
            }
            // Arrasto mais na vertical é rolagem da página: deixa passar
            state.horizontal = Math.abs(dx) > Math.abs(dy);
            if (!state.horizontal) {
                dragRef.current = null;
                return;
            }
            event.currentTarget.setPointerCapture(event.pointerId);
        }

        state.dx = dx;
        setDrag(dx);
    }, []);

    const onPointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const state = dragRef.current;
        if (state === null || state.pointerId !== event.pointerId) {
            return;
        }

        dragRef.current = null;
        if (state.horizontal) {
            const width = heroRef.current?.clientWidth ?? 0;
            const threshold = Math.max(SWIPE_MIN, width * SWIPE_RATIO);
            if (state.dx <= -threshold) {
                go(1);
            } else if (state.dx >= threshold) {
                go(-1);
            }
            // Só o clique que vem logo depois de soltar é ignorado (no toque ele nem sempre acontece)
            justDragged.current = Math.abs(state.dx) > DRAG_START;
            setTimeout(() => {
                justDragged.current = false;
            }, 80);
        }
        setDrag(null);
    }, [go]);

    // Depois de arrastar, o soltar do dedo não pode contar como clique no botão "Assistir agora"
    const onClickCapture = useCallback((event: React.MouseEvent) => {
        if (justDragged.current) {
            justDragged.current = false;
            event.preventDefault();
            event.stopPropagation();
        }
    }, []);

    const rating = useMemo(() => {
        return current?.links?.find(({ category }) => category === 'imdb')?.name ?? null;
    }, [current]);

    const meta = [current?.releaseInfo, current?.runtime].filter((value) => typeof value === 'string' && value.length > 0);

    const onWatch = useCallback(() => {
        const href = getMetaDetailsHref(current?.deepLinks);
        if (typeof href === 'string') {
            navigateWithOrigin(href);
        }
    }, [current, navigateWithOrigin]);

    const onLogoError = useCallback(() => {
        if (current) {
            setLogoFailed((failed) => ({ ...failed, [current.id]: true }));
        }
    }, [current]);

    if (!current) {
        return null;
    }

    const width = heroRef.current?.clientWidth || 1;
    const dragging = drag !== null;

    return (
        <div
            ref={heroRef}
            className={classNames(className, styles['hero'], { [styles['dragging']]: dragging }, 'animation-fade-in')}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onClickCapture={onClickCapture}>
            <div
                className={styles['track']}
                style={{ transform: `translate3d(calc(${-position * 100}% + ${drag ?? 0}px), 0, 0)` }}>
                {
                    slides.map((item, i) => (
                        <div
                            key={item.id}
                            className={classNames(styles['backdrop'], { [styles['active']]: i === position })}
                            style={{ backgroundImage: `url('${item.background}')` }}
                            aria-hidden={i !== position}
                        />
                    ))
                }
            </div>
            <div className={styles['shade']} />
            <div
                key={current.id}
                className={styles['info']}
                style={dragging ? { opacity: Math.max(0.15, 1 - Math.abs(drag) / (width * 0.6)) } : undefined}>
                {
                    typeof current.logo === 'string' && current.logo.length > 0 && !logoFailed[current.id] ?
                        <img className={styles['logo']} src={current.logo} alt={current.name} draggable={false} onError={onLogoError} />
                        :
                        <div className={styles['title']}>{current.name}</div>
                }
                {
                    meta.length > 0 || rating !== null ?
                        <div className={styles['meta']}>
                            {meta.map((value) => <span key={value}>{value}</span>)}
                            {
                                rating !== null ?
                                    <span className={styles['rating']}>
                                        <Icon className={styles['imdb']} name={'imdb'} />
                                        {rating}
                                    </span>
                                    :
                                    null
                            }
                        </div>
                        :
                        null
                }
                {
                    typeof current.description === 'string' && current.description.length > 0 ?
                        <div className={styles['description']}>{current.description}</div>
                        :
                        null
                }
                <Button className={styles['watch-button']} title={t('WATCH_NOW')} tabIndex={0} onClick={onWatch}>
                    <Icon className={styles['icon']} name={'play'} />
                    <div className={styles['label']}>{t('WATCH_NOW')}</div>
                </Button>
            </div>
            {
                count > 1 ?
                    <div className={styles['dots']}>
                        <Button className={styles['arrow']} title={t('BUTTON_PREV')} tabIndex={-1} onClick={() => go(-1)}>
                            <Icon className={styles['icon']} name={'chevron-back'} />
                        </Button>
                        {
                            slides.map((item, i) => (
                                <Button
                                    key={item.id}
                                    className={classNames(styles['dot'], { [styles['active']]: i === position })}
                                    title={item.name}
                                    tabIndex={-1}
                                    onClick={() => setIndex(i)}>
                                    {null}
                                </Button>
                            ))
                        }
                        <Button className={styles['arrow']} title={t('BUTTON_NEXT')} tabIndex={-1} onClick={() => go(1)}>
                            <Icon className={styles['icon']} name={'chevron-forward'} />
                        </Button>
                    </div>
                    :
                    null
            }
        </div>
    );
};

export default Hero;
