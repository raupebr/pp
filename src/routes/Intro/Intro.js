// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const { useTranslation } = require('react-i18next');
const { useSearchParams, useNavigate } = require('react-router-dom');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const Modal = require('stremio/router/Modal');
const { useCore } = require('stremio/core');
const { useBinaryState } = require('stremio/common');
const { default: useRouteFocused } = require('stremio/common/useRouteFocused');
const { Button, Checkbox } = require('stremio/components');
const CredentialsTextInput = require('./CredentialsTextInput');
const PasswordResetModal = require('./PasswordResetModal');
const useFacebookLogin = require('./useFacebookLogin');
const { default: useAppleLogin } = require('./useAppleLogin');

const { default: PPLogo } = require('stremio/components/PPLogo');
const { setGuest } = require('stremio/common/ppGuest');
const IntroBackground = require('./IntroBackground');
const styles = require('./styles');

const SIGNUP_FORM = 'signup';
const LOGIN_FORM = 'login';

// PP: ícones dos campos (traço fino, no mesmo estilo dos ícones do app)
const FieldIcon = ({ children }) => (
    <svg className={styles['field-icon']} viewBox={'0 0 24 24'} fill={'none'} stroke={'currentColor'} strokeWidth={1.8} strokeLinecap={'round'} strokeLinejoin={'round'} aria-hidden={true}>
        {children}
    </svg>
);

FieldIcon.propTypes = {
    children: PropTypes.node
};

const MAIL_ICON = (
    <FieldIcon>
        <rect x={3} y={5} width={18} height={14} rx={3.5} />
        <path d={'m4.5 7.5 7.5 5.5 7.5-5.5'} />
    </FieldIcon>
);

const LOCK_ICON = (
    <FieldIcon>
        <rect x={4.5} y={10.5} width={15} height={10} rx={3} />
        <path d={'M8 10.5V8a4 4 0 0 1 8 0v2.5'} />
        <path d={'M12 14.5v2'} />
    </FieldIcon>
);

const SHIELD_ICON = (
    <FieldIcon>
        <path d={'M12 3.5 5 6.2v5.3c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V6.2Z'} />
        <path d={'m9 12 2.2 2.2L15.5 10'} />
    </FieldIcon>
);

// PP: vantagens de entrar com a conta (aparecem ao lado do cartão em telas largas)
const FEATURES = [
    { icon: 'addons', label: 'PP_LOGIN_FEATURE_ADDONS' },
    { icon: 'play', label: 'PP_LOGIN_FEATURE_RESUME' },
    { icon: 'tv', label: 'PP_LOGIN_FEATURE_DEVICES' },
];

// PP: atraso de cada item na animação de entrada da tela
const reveal = (index) => ({ '--pp-reveal': index });

const Intro = () => {
    const [queryParams, setQueryParams] = useSearchParams();
    const navigate = useNavigate();
    const core = useCore();
    const { t } = useTranslation();
    const routeFocused = useRouteFocused();
    const [startFacebookLogin, stopFacebookLogin] = useFacebookLogin();
    const [startAppleLogin, stopAppleLogin] = useAppleLogin();
    const emailRef = React.useRef(null);
    const passwordRef = React.useRef(null);
    const confirmPasswordRef = React.useRef(null);
    const termsRef = React.useRef(null);
    const privacyPolicyRef = React.useRef(null);
    const marketingRef = React.useRef(null);
    const errorRef = React.useRef(null);
    const [passwordRestModalOpen, openPasswordRestModal, closePasswordResetModal] = useBinaryState(false);
    const [loaderModalOpen, openLoaderModal, closeLoaderModal] = useBinaryState(false);
    const [state, dispatch] = React.useReducer(
        (state, action) => {
            switch (action.type) {
                case 'set-form':
                    if (state.form !== action.form) {
                        return {
                            form: action.form,
                            email: '',
                            password: '',
                            confirmPassword: '',
                            termsAccepted: false,
                            privacyPolicyAccepted: false,
                            marketingAccepted: false,
                            // PP: a troca de aba pode já vir com um aviso (ex.: convidado precisa aceitar os termos)
                            error: action.error || ''
                        };
                    }
                    return state;
                case 'change-credentials':
                    return {
                        ...state,
                        error: '',
                        [action.name]: action.value
                    };
                case 'toggle-checkbox':
                    return {
                        ...state,
                        error: '',
                        [action.name]: !state[action.name]
                    };
                case 'error':
                    return {
                        ...state,
                        error: action.error
                    };
                default:
                    return state;
            }
        },
        {
            form: [LOGIN_FORM, SIGNUP_FORM].includes(queryParams.get('form')) ? queryParams.get('form') : SIGNUP_FORM,
            email: '',
            password: '',
            confirmPassword: '',
            termsAccepted: false,
            privacyPolicyAccepted: false,
            marketingAccepted: false,
            error: ''
        }
    );
    const loginWithFacebook = React.useCallback(() => {
        openLoaderModal();
        startFacebookLogin()
            .then(({ email, password }) => {
                core.transport.dispatch({
                    action: 'Ctx',
                    args: {
                        action: 'Authenticate',
                        args: {
                            type: 'Login',
                            email,
                            password,
                            facebook: true
                        }
                    }
                });
            })
            .catch((error) => {
                closeLoaderModal();
                dispatch({ type: 'error', error: error.message });
            });
    }, [startFacebookLogin, openLoaderModal, closeLoaderModal]);
    const loginWithApple = React.useCallback(() => {
        openLoaderModal();
        startAppleLogin()
            .then(({ token, sub, email, name }) => {
                core.transport.dispatch({
                    action: 'Ctx',
                    args: {
                        action: 'Authenticate',
                        args: {
                            type: 'Apple',
                            token,
                            sub,
                            email,
                            name
                        }
                    }
                });
            })
            .catch((error) => {
                closeLoaderModal();
                dispatch({ type: 'error', error: error.message });
            });
    }, [startAppleLogin, openLoaderModal, closeLoaderModal]);
    const cancelSocialLogin = React.useCallback(() => {
        stopFacebookLogin();
        stopAppleLogin();
        closeLoaderModal();
    }, [stopFacebookLogin, stopAppleLogin, closeLoaderModal]);
    const loginWithEmail = React.useCallback(() => {
        if (typeof state.email !== 'string' || state.email.length === 0 || !emailRef.current.validity.valid) {
            dispatch({ type: 'error', error: t('INVALID_EMAIL') });
            return;
        }
        if (typeof state.password !== 'string' || state.password.length === 0) {
            dispatch({ type: 'error', error: t('INVALID_PASSWORD') });
            return;
        }
        openLoaderModal();
        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'Authenticate',
                args: {
                    type: 'Login',
                    email: state.email,
                    password: state.password
                }
            }
        });
    }, [state.email, state.password]);
    const loginAsGuest = React.useCallback(() => {
        // PP: o botão de convidado aparece nas duas abas; os termos ficam na aba "Criar conta"
        if (state.form === LOGIN_FORM) {
            dispatch({ type: 'set-form', form: SIGNUP_FORM, error: t('MUST_ACCEPT_TERMS') });
            setQueryParams(new URLSearchParams([['form', SIGNUP_FORM]]), { replace: true });
            return;
        }
        if (!state.termsAccepted) {
            dispatch({ type: 'error', error: t('MUST_ACCEPT_TERMS') });
            return;
        }
        // PP: lembra a escolha para a tela de entrar não aparecer de novo
        setGuest(true);
        navigate('/');
    }, [state.form, state.termsAccepted, setQueryParams]);
    const signup = React.useCallback(() => {
        if (typeof state.email !== 'string' || state.email.length === 0 || !emailRef.current.validity.valid) {
            dispatch({ type: 'error', error: t('INVALID_EMAIL') });
            return;
        }
        if (typeof state.password !== 'string' || state.password.length === 0) {
            dispatch({ type: 'error', error: t('INVALID_PASSWORD') });
            return;
        }
        if (state.password !== state.confirmPassword) {
            dispatch({ type: 'error', error: t('PASSWORDS_NOMATCH') });
            return;
        }
        if (!state.termsAccepted) {
            dispatch({ type: 'error', error: t('MUST_ACCEPT_TERMS') });
            return;
        }
        if (!state.privacyPolicyAccepted) {
            dispatch({ type: 'error', error: t('MUST_ACCEPT_PRIVACY_POLICY') });
            return;
        }
        openLoaderModal();
        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'Authenticate',
                args: {
                    type: 'Register',
                    email: state.email,
                    password: state.password,
                    gdpr_consent: {
                        tos: state.termsAccepted,
                        privacy: state.privacyPolicyAccepted,
                        marketing: state.marketingAccepted,
                        from: 'web'
                    }
                }
            }
        });
    }, [state.email, state.password, state.confirmPassword, state.termsAccepted, state.privacyPolicyAccepted, state.marketingAccepted]);
    const emailOnChange = React.useCallback((event) => {
        dispatch({
            type: 'change-credentials',
            name: 'email',
            value: event.currentTarget.value
        });
    }, []);
    const emailOnSubmit = React.useCallback(() => {
        passwordRef.current.focus();
    }, []);
    const passwordOnChange = React.useCallback((event) => {
        dispatch({
            type: 'change-credentials',
            name: 'password',
            value: event.currentTarget.value
        });
    }, []);
    const passwordOnSubmit = React.useCallback(() => {
        if (state.form === SIGNUP_FORM) {
            confirmPasswordRef.current.focus();
        } else {
            loginWithEmail();
        }
    }, [state.form, loginWithEmail]);
    const confirmPasswordOnChange = React.useCallback((event) => {
        dispatch({
            type: 'change-credentials',
            name: 'confirmPassword',
            value: event.currentTarget.value
        });
    }, []);
    const confirmPasswordOnSubmit = React.useCallback(() => {
        termsRef.current.focus();
    }, []);
    const toggleTermsAccepted = React.useCallback(() => {
        dispatch({ type: 'toggle-checkbox', name: 'termsAccepted' });
    }, []);
    const togglePrivacyPolicyAccepted = React.useCallback(() => {
        dispatch({ type: 'toggle-checkbox', name: 'privacyPolicyAccepted' });
    }, []);
    const toggleMarketingAccepted = React.useCallback(() => {
        dispatch({ type: 'toggle-checkbox', name: 'marketingAccepted' });
    }, []);
    // PP: abas "Entrar" e "Criar conta" no lugar dos botões de trocar de formulário
    // (trocar de aba não é trocar de tela: sem a animação de tela e sem entrar no histórico)
    const selectFormOnClick = React.useCallback((event) => {
        const form = event.currentTarget.dataset.form;
        if (form !== state.form) {
            setQueryParams(new URLSearchParams([['form', form]]), { replace: true });
        }
    }, [state.form, setQueryParams]);
    // PP: mostrar/esconder a senha (o botão não tira o foco do campo)
    const [passwordVisible, setPasswordVisible] = React.useState(false);
    const togglePasswordVisible = React.useCallback(() => {
        setPasswordVisible((visible) => !visible);
    }, []);
    const keepFieldFocus = React.useCallback((event) => {
        event.preventDefault();
        event.nativeEvent.buttonBlurPrevented = true;
    }, []);
    // PP: a altura do formulário anima ao trocar de aba ou aparecer um aviso
    const formRef = React.useRef(null);
    const [formHeight, setFormHeight] = React.useState(null);
    React.useLayoutEffect(() => {
        if (typeof ResizeObserver !== 'function') {
            return;
        }
        const observer = new ResizeObserver(() => {
            if (formRef.current !== null) {
                setFormHeight(formRef.current.offsetHeight);
            }
        });
        observer.observe(formRef.current);
        return () => {
            observer.disconnect();
        };
    }, []);
    React.useEffect(() => {
        if ([LOGIN_FORM, SIGNUP_FORM].includes(queryParams.get('form'))) {
            dispatch({ type: 'set-form', form: queryParams.get('form') });
        }
    }, [queryParams]);
    React.useEffect(() => {
        if (routeFocused && typeof state.error === 'string' && state.error.length > 0) {
            errorRef.current.scrollIntoView();
        }
    }, [state.error]);
    React.useEffect(() => {
        // PP: no celular e no tablet o teclado não abre sozinho (a tela aparece inteira primeiro)
        if (routeFocused && !window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
            emailRef.current.focus();
        }
    }, [state.form, routeFocused]);
    React.useEffect(() => {
        const onCoreEvent = (name) => {
            if (name === 'UserAuthenticated') {
                closeLoaderModal();
                if (routeFocused) {
                    navigate('/');
                }
            }
        };
        const onCoreError = (source) => {
            if (source.event === 'UserAuthenticated') {
                closeLoaderModal();
            }
        };
        core.on('event', onCoreEvent);
        core.on('error', onCoreError);
        return () => {
            core.off('event', onCoreEvent);
            core.off('error', onCoreError);
        };
    }, [routeFocused]);
    // PP: luz que segue o mouse dentro do cartão
    const onCardPointerMove = React.useCallback((event) => {
        if (event.pointerType !== 'mouse') {
            return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--pp-spot-x', `${Math.round(event.clientX - rect.left)}px`);
        event.currentTarget.style.setProperty('--pp-spot-y', `${Math.round(event.clientY - rect.top)}px`);
    }, []);
    // PP: tela de entrar redesenhada (fundo animado, logo com brilho, abas e campos de vidro)
    return (
        <div className={styles['intro-container']}>
            <IntroBackground />
            <div className={styles['intro-content']}>
                <div className={styles['heading-container']}>
                    <div className={classnames(styles['logo-container'], styles['reveal-logo'])}>
                        <div className={styles['logo-glow']} />
                        <div className={styles['logo-frame']}>
                            <PPLogo className={styles['logo']} />
                            <div className={styles['logo-shine']} />
                        </div>
                    </div>
                    <div className={classnames(styles['title-container'], styles['reveal'])} style={reveal(1)}>
                        {t('PP_LOGIN_TITLE')}
                    </div>
                    <div className={classnames(styles['slogan-container'], styles['reveal'])} style={reveal(2)}>
                        {t('PP_LOGIN_NOTICE')}
                    </div>
                    <div className={styles['features-container']}>
                        {
                            FEATURES.map(({ icon, label }, index) => (
                                <div key={icon} className={classnames(styles['feature'], styles['reveal'])} style={reveal(3 + index)}>
                                    <div className={styles['feature-icon']}>
                                        <Icon className={styles['icon']} name={icon} />
                                    </div>
                                    <div className={styles['feature-label']}>{t(label)}</div>
                                </div>
                            ))
                        }
                    </div>
                </div>
                <div className={classnames(styles['content-container'], styles['reveal-card'])} onPointerMove={onCardPointerMove}>
                    <div className={styles['card-border']} />
                    <div className={styles['card-spotlight']} />
                    <div className={styles['form-switch']}>
                        <div className={classnames(styles['switch-indicator'], { [styles['signup']]: state.form === SIGNUP_FORM })} />
                        <Button
                            className={classnames(styles['switch-option'], { [styles['selected']]: state.form === LOGIN_FORM })}
                            title={t('PP_LOGIN_TAB_LOGIN')}
                            data-form={LOGIN_FORM}
                            onClick={selectFormOnClick}
                        >
                            {t('PP_LOGIN_TAB_LOGIN')}
                        </Button>
                        <Button
                            className={classnames(styles['switch-option'], { [styles['selected']]: state.form === SIGNUP_FORM })}
                            title={t('PP_LOGIN_TAB_SIGNUP')}
                            data-form={SIGNUP_FORM}
                            onClick={selectFormOnClick}
                        >
                            {t('PP_LOGIN_TAB_SIGNUP')}
                        </Button>
                    </div>
                    <div className={styles['form-frame']} style={formHeight !== null ? { height: formHeight } : null}>
                        <div ref={formRef} className={styles['form-container']}>
                            <div className={styles['field']}>
                                {MAIL_ICON}
                                <CredentialsTextInput
                                    ref={emailRef}
                                    className={styles['credentials-text-input']}
                                    type={'email'}
                                    placeholder={' '}
                                    aria-label={t('EMAIL')}
                                    value={state.email}
                                    onChange={emailOnChange}
                                    onSubmit={emailOnSubmit}
                                />
                                <div className={styles['field-label']}>{t('EMAIL')}</div>
                            </div>
                            <div className={styles['field']}>
                                {LOCK_ICON}
                                <CredentialsTextInput
                                    ref={passwordRef}
                                    className={classnames(styles['credentials-text-input'], styles['with-action'])}
                                    type={passwordVisible ? 'text' : 'password'}
                                    placeholder={' '}
                                    aria-label={t('PASSWORD')}
                                    value={state.password}
                                    onChange={passwordOnChange}
                                    onSubmit={passwordOnSubmit}
                                />
                                <div className={styles['field-label']}>{t('PASSWORD')}</div>
                                <Button
                                    className={styles['field-action']}
                                    title={passwordVisible ? t('PP_HIDE_PASSWORD') : t('PP_SHOW_PASSWORD')}
                                    tabIndex={-1}
                                    onMouseDown={keepFieldFocus}
                                    onClick={togglePasswordVisible}
                                >
                                    <Icon className={styles['icon']} name={passwordVisible ? 'eye-off' : 'eye'} />
                                </Button>
                            </div>
                            {
                                state.form === SIGNUP_FORM ?
                                    <div key={SIGNUP_FORM} className={styles['form-extra']}>
                                        <div className={styles['field']}>
                                            {SHIELD_ICON}
                                            <CredentialsTextInput
                                                ref={confirmPasswordRef}
                                                className={styles['credentials-text-input']}
                                                type={passwordVisible ? 'text' : 'password'}
                                                placeholder={' '}
                                                aria-label={t('PASSWORD_CONFIRM')}
                                                value={state.confirmPassword}
                                                onChange={confirmPasswordOnChange}
                                                onSubmit={confirmPasswordOnSubmit}
                                            />
                                            <div className={styles['field-label']}>{t('PASSWORD_CONFIRM')}</div>
                                        </div>
                                        <div className={styles['consents-container']}>
                                            <Checkbox
                                                ref={termsRef}
                                                className={styles['consent']}
                                                label={t('READ_AND_AGREE')}
                                                link={t('TOS')}
                                                href={'https://www.stremio.com/tos'}
                                                checked={state.termsAccepted}
                                                onChange={toggleTermsAccepted}
                                            />
                                            <Checkbox
                                                ref={privacyPolicyRef}
                                                className={styles['consent']}
                                                label={t('READ_AND_AGREE')}
                                                link={t('PRIVACY_POLICY')}
                                                href={'https://www.stremio.com/privacy'}
                                                checked={state.privacyPolicyAccepted}
                                                onChange={togglePrivacyPolicyAccepted}
                                            />
                                            <Checkbox
                                                ref={marketingRef}
                                                className={styles['consent']}
                                                label={t('MARKETING_AGREE')}
                                                checked={state.marketingAccepted}
                                                onChange={toggleMarketingAccepted}
                                            />
                                        </div>
                                    </div>
                                    :
                                    <div key={LOGIN_FORM} className={classnames(styles['form-extra'], styles['forgot-password-link-container'])}>
                                        <Button className={styles['forgot-password-link']} onClick={openPasswordRestModal}>{t('FORGOT_PASSWORD')}</Button>
                                    </div>
                            }
                            {
                                state.error && state.error.length > 0 ?
                                    <div key={state.error} ref={errorRef} className={styles['error-message']}>
                                        <Icon className={styles['icon']} name={'warning'} />
                                        <div className={styles['label']}>{state.error}</div>
                                    </div>
                                    :
                                    null
                            }
                            <Button className={classnames(styles['form-button'], styles['submit-button'])} onClick={state.form === SIGNUP_FORM ? signup : loginWithEmail}>
                                <div className={styles['label']}>{state.form === SIGNUP_FORM ? t('PP_LOGIN_TAB_SIGNUP') : t('PP_LOGIN_TAB_LOGIN')}</div>
                                <Icon className={styles['icon']} name={'chevron-forward'} />
                            </Button>
                        </div>
                    </div>
                    <div className={styles['divider']}>
                        <div className={styles['label']}>{t('OR')}</div>
                    </div>
                    <div className={styles['options-container']}>
                        <Button className={classnames(styles['form-button'], styles['social-button'], styles['facebook-button'])} title={t('FB_LOGIN')} onClick={loginWithFacebook}>
                            <div className={styles['badge']}>
                                <Icon className={styles['icon']} name={'facebook'} />
                            </div>
                            <div className={styles['label']}>{t('PP_LOGIN_FACEBOOK')}</div>
                        </Button>
                        <Button className={classnames(styles['form-button'], styles['social-button'], styles['apple-button'])} title={t('APPLE_LOGIN')} onClick={loginWithApple}>
                            <div className={styles['badge']}>
                                <Icon className={styles['icon']} name={'macos'} />
                            </div>
                            <div className={styles['label']}>{t('PP_LOGIN_APPLE')}</div>
                        </Button>
                    </div>
                    <Button className={styles['guest-login-button']} title={t('GUEST_LOGIN')} onClick={loginAsGuest}>
                        <Icon className={styles['icon']} name={'person-outline'} />
                        <div className={styles['label']}>{t('GUEST_LOGIN')}</div>
                        <Icon className={styles['arrow']} name={'chevron-forward'} />
                    </Button>
                    {/* PP: a conta é do Stremio; quem entra ou cria conta precisa saber para quem vão os dados */}
                    <div className={styles['account-notice']}>{t('PP_LOGIN_ACCOUNT_NOTICE')}</div>
                </div>
            </div>
            {
                passwordRestModalOpen ?
                    <PasswordResetModal email={state.email} onCloseRequest={closePasswordResetModal} />
                    :
                    null
            }
            {
                loaderModalOpen ?
                    <Modal className={styles['loading-modal-container']}>
                        <div className={styles['loader-container']}>
                            <div className={styles['loader-logo']}>
                                <div className={styles['loader-ring']} />
                                <PPLogo className={styles['logo']} />
                            </div>
                            <div className={styles['label']}>{t('AUTHENTICATING')}</div>
                            <Button className={styles['button']} onClick={cancelSocialLogin}>
                                {t('BUTTON_CANCEL')}
                            </Button>
                        </div>
                    </Modal>
                    :
                    null
            }
        </div>
    );
};

module.exports = Intro;
