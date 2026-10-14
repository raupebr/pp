// PP: logo do app desenhada na própria página, com as cores do tema
// (muda junto quando a pessoa troca a cor em Configurações > Aparência)

import React, { useId, useMemo } from 'react';
import classNames from 'classnames';
import { icon, LIVE_COLORS, svg } from 'stremio/common/ppLogo';
import styles from './PPLogo.less';

type Props = {
    className?: string,
};

const PPLogo = ({ className }: Props) => {
    const id = useId().replace(/[^a-zA-Z0-9]/g, '');
    const markup = useMemo(() => svg(icon({ id: `pplogo${id}`, colors: LIVE_COLORS })), [id]);
    return (
        <div
            className={classNames(className, styles['pp-logo'])}
            role={'img'}
            aria-label={'PP'}
            dangerouslySetInnerHTML={{ __html: markup }}
        />
    );
};

export default PPLogo;
