// PP: Configurações > Código aberto (código-fonte do PP, licença GPL-2.0, aviso de conteúdo e versões)

import React, { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlatform } from 'stremio/common';
import PPLogo from 'stremio/components/PPLogo';
import { Option, Section, Link } from '../components';
import styles from './About.less';

// Endereço público do código-fonte do PP. A licença GPL exige oferecer o código de cada versão
// distribuída a quem usa o app.
const PP_SOURCE_CODE_URL = 'https://github.com/raupebr/pp';
const PP_LICENSE_URL = 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html';

type Props = {
    streamingServer: StreamingServer,
};

const About = forwardRef<HTMLDivElement, Props>(({ streamingServer }: Props, ref) => {
    const { shell } = usePlatform();
    const { t } = useTranslation();

    const settings = useMemo(() => (
        streamingServer?.settings?.type === 'Ready' ?
            streamingServer.settings.content as StreamingServerSettings : null
    ), [streamingServer?.settings]);

    return (
        <Section ref={ref} className={styles['about']} label={'PP_OPEN_SOURCE'}>
            <div className={styles['brand']}>
                <PPLogo className={styles['logo']} />
                <div className={styles['brand-info']}>
                    <div className={styles['name']}>{t('PP_APP_NAME')}</div>
                    <div className={styles['version']}>{t('SETTINGS_APP_VERSION')} {process.env.VERSION}</div>
                </div>
            </div>
            <p className={styles['text']}>{t('PP_OPEN_SOURCE_TEXT')}</p>
            <p className={styles['text']}>{t('PP_ABOUT_CONTENT')}</p>
            <div className={styles['links']}>
                <Link label={t('PP_SOURCE_PP')} href={PP_SOURCE_CODE_URL} />
                <Link label={t('PP_LICENSE_LINK')} href={PP_LICENSE_URL} />
            </div>
            <div className={styles['versions']}>
                <Option label={t('SETTINGS_BUILD_VERSION')}>
                    <div className={styles['label']}>
                        {process.env.COMMIT_HASH}
                    </div>
                </Option>
                {
                    settings?.serverVersion &&
                        <Option label={t('SETTINGS_SERVER_VERSION')}>
                            <div className={styles['label']}>
                                {settings.serverVersion}
                            </div>
                        </Option>
                }
                {
                    typeof shell.state.version === 'string' &&
                        <Option label={t('SETTINGS_SHELL_VERSION')}>
                            <div className={styles['label']}>
                                {shell.state.version}
                            </div>
                        </Option>
                }
            </div>
        </Section>
    );
});

About.displayName = 'About';

export default About;
