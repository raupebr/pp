// PP: Configurações > Aparência (cor de destaque, fundo e efeito vidro)

import React, { forwardRef, useCallback } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import Icon from '@stremio/stremio-icons/react';
import { Button, Toggle } from 'stremio/components';
import { PP_ACCENT_PRESETS, PP_BACKGROUNDS, usePPTheme } from 'stremio/common/ppTheme';
import { Section, Option } from '../components';
import styles from './Appearance.less';

const Appearance = forwardRef<HTMLDivElement>((_props, ref) => {
    const { t } = useTranslation();
    const [theme, updateTheme, resetTheme] = usePPTheme();
    const customSelected = !PP_ACCENT_PRESETS.some(({ color }) => color === theme.accent);

    const onCustomColorChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        updateTheme({ accent: event.target.value });
    }, [updateTheme]);

    const glassToggle = {
        checked: theme.glass,
        onClick: () => updateTheme({ glass: !theme.glass }),
    };

    return (
        <Section ref={ref} label={'PP_APPEARANCE'}>
            <div className={styles['group']}>
                <div className={styles['heading']}>{t('PP_ACCENT_COLOR')}</div>
                <div className={styles['hint']}>{t('PP_ACCENT_COLOR_HINT')}</div>
                <div className={styles['swatches']}>
                    {
                        PP_ACCENT_PRESETS.map(({ name, color }) => (
                            <Button
                                key={color}
                                className={classNames(styles['swatch'], { [styles['selected']]: theme.accent === color })}
                                style={{ '--swatch-color': color }}
                                title={name}
                                onClick={() => updateTheme({ accent: color })}>
                                {theme.accent === color ? <Icon className={styles['icon']} name={'checkmark'} /> : null}
                            </Button>
                        ))
                    }
                    <label
                        className={classNames(styles['swatch'], styles['custom'], { [styles['selected']]: customSelected })}
                        style={customSelected ? { '--swatch-color': theme.accent } as React.CSSProperties : undefined}
                        title={t('PP_CUSTOM_COLOR')}>
                        <input className={styles['color-input']} type={'color'} value={theme.accent} onChange={onCustomColorChange} />
                        <Icon className={styles['icon']} name={customSelected ? 'checkmark' : 'add'} />
                    </label>
                </div>
            </div>

            <div className={styles['group']}>
                <div className={styles['heading']}>{t('PP_BACKGROUND')}</div>
                <div className={styles['backgrounds']}>
                    {
                        PP_BACKGROUNDS.map(({ id }) => (
                            <Button
                                key={id}
                                className={classNames(styles['background'], { [styles['selected']]: theme.background === id })}
                                title={t(`PP_BACKGROUND_${id.toUpperCase()}`)}
                                onClick={() => updateTheme({ background: id })}>
                                <div className={classNames(styles['preview'], styles[`preview-${id}`])} />
                                <div className={styles['label']}>{t(`PP_BACKGROUND_${id.toUpperCase()}`)}</div>
                            </Button>
                        ))
                    }
                </div>
            </div>

            <Option label={'PP_GLASS'}>
                <Toggle tabIndex={-1} {...glassToggle} />
            </Option>
            <div className={classNames(styles['hint'], styles['glass-hint'])}>{t('PP_GLASS_HINT')}</div>

            <Button className={styles['reset']} title={t('PP_RESET_THEME')} onClick={resetTheme}>
                <Icon className={styles['icon']} name={'reset'} />
                {t('PP_RESET_THEME')}
            </Button>
        </Section>
    );
});

Appearance.displayName = 'Appearance';

export default Appearance;
