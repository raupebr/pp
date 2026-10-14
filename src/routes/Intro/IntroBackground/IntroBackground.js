// PP: fundo animado da tela de entrar: luzes de aurora, uma parede de cartazes que desliza
// devagar e partículas de luz subindo. Tudo na cor escolhida em Configurações > Aparência.
// É só decoração (desenhada em CSS), sem nenhuma imagem de filme.

const React = require('react');
const styles = require('./styles');

// Cada coluna de cartazes: tons (somados à cor de destaque), velocidade e sentido
const COLUMNS = [
    { hues: [0, 40, -30, 15, -50, 30, -10, 55], duration: 70, reverse: false },
    { hues: [-20, 25, 50, -40, 5, -15, 35, -55], duration: 58, reverse: true },
    { hues: [35, -10, -45, 20, 55, -25, 10, -35], duration: 82, reverse: false },
    { hues: [-35, 10, 30, -55, 25, 0, -20, 45], duration: 64, reverse: true },
    { hues: [15, -40, 5, 45, -15, 35, -50, 20], duration: 76, reverse: false },
    { hues: [50, -25, -5, 30, -45, 15, 40, -10], duration: 60, reverse: true },
    { hues: [-5, 30, -35, 10, 50, -20, 25, -45], duration: 88, reverse: false },
    { hues: [25, -50, 15, -30, 0, 45, -15, 35], duration: 66, reverse: true },
    { hues: [-45, 20, 40, -10, 30, -35, 5, 50], duration: 74, reverse: false },
    { hues: [10, -30, -55, 35, -5, 25, -40, 15], duration: 62, reverse: true },
    { hues: [40, 0, -20, -45, 20, -5, 55, -30], duration: 80, reverse: false },
    { hues: [-15, 45, 20, -25, 40, -50, 30, 0], duration: 68, reverse: true },
];

// Partículas: posição na horizontal (%), tamanho (px), duração e atraso (s)
const PARTICLES = [
    [4, 3, 16, 0], [11, 2, 21, 6], [18, 4, 18, 11], [26, 2, 24, 3], [33, 3, 17, 14],
    [41, 2, 22, 8], [48, 5, 19, 1], [56, 2, 25, 12], [63, 3, 18, 5], [70, 2, 23, 16],
    [77, 4, 20, 9], [84, 2, 17, 2], [91, 3, 24, 13], [96, 2, 19, 7], [8, 2, 26, 18],
    [37, 2, 27, 20], [59, 3, 21, 17], [88, 2, 22, 21],
];

const IntroBackground = () => {
    const wallRef = React.useRef(null);

    // Com mouse, a parede de cartazes acompanha o ponteiro bem de leve (efeito de profundidade)
    React.useEffect(() => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        let frame = null;
        const onPointerMove = (event) => {
            const x = event.clientX / window.innerWidth - 0.5;
            const y = event.clientY / window.innerHeight - 0.5;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                if (wallRef.current !== null) {
                    wallRef.current.style.transform = `translate3d(${(-x * 28).toFixed(1)}px, ${(-y * 28).toFixed(1)}px, 0)`;
                }
            });
        };
        window.addEventListener('pointermove', onPointerMove);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('pointermove', onPointerMove);
        };
    }, []);

    return (
        <div className={styles['intro-background']} aria-hidden={true}>
            <div className={styles['orb']} />
            <div className={styles['orb']} />
            <div className={styles['orb']} />
            <div ref={wallRef} className={styles['wall-parallax']}>
                <div className={styles['wall']}>
                    {
                        COLUMNS.map(({ hues, duration, reverse }, columnIndex) => (
                            <div
                                key={columnIndex}
                                className={styles['column']}
                                style={{
                                    animationDuration: `${duration}s`,
                                    animationDirection: reverse ? 'reverse' : 'normal',
                                    animationDelay: `${-columnIndex * 7}s`,
                                }}
                            >
                                {
                                    // Duas cópias iguais, para a coluna dar a volta sem emenda
                                    [...hues, ...hues].map((hue, index) => (
                                        <div key={index} className={styles['poster']} style={{ '--pp-poster-hue': hue }} />
                                    ))
                                }
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className={styles['shade']} />
            <div className={styles['particles']}>
                {
                    PARTICLES.map(([left, size, duration, delay], index) => (
                        <span
                            key={index}
                            className={styles['particle']}
                            style={{
                                left: `${left}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                animationDuration: `${duration}s`,
                                animationDelay: `${-delay}s`,
                            }}
                        />
                    ))
                }
            </div>
            <div className={styles['grain']} />
        </div>
    );
};

module.exports = IntroBackground;
