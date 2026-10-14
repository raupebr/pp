// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { Button } = require('stremio/components');
const { useServices } = require('stremio/services');
const SeekBar = require('./SeekBar');
const VolumeSlider = require('./VolumeSlider');
const styles = require('./styles');
const { useBinaryState, usePlatform } = require('stremio/common');
const { t } = require('i18next');

// PP: ícone de voltar/adiantar 10 segundos (seta circular com o número 10)
const SkipIcon = ({ className, forward }) => (
    <svg className={className} viewBox={'0 0 24 24'} aria-hidden={true}>
        <path
            d={forward ?
                'M12 4.5V2l4.2 3.5L12 9V6.5a6.5 6.5 0 1 0 6.5 6.5h2A8.5 8.5 0 1 1 12 4.5z'
                :
                'M12 4.5V2L7.8 5.5 12 9V6.5a6.5 6.5 0 1 1-6.5 6.5h-2A8.5 8.5 0 1 0 12 4.5z'}
            fill={'currentColor'}
        />
        <text x={'12'} y={'15.6'} textAnchor={'middle'} fontSize={'6.2'} fontWeight={'800'} fill={'currentColor'}>{10}</text>
    </svg>
);

SkipIcon.propTypes = {
    className: PropTypes.string,
    forward: PropTypes.bool,
};

const VIDEO_SCALE_ICONS = {
    contain: 'video-scale-fit',
    cover: 'video-scale-crop',
    fill: 'video-scale-stretch'
};

const ControlBar = React.forwardRef(({
    className,
    paused,
    time,
    duration,
    buffered,
    volume,
    muted,
    playbackSpeed,
    subtitlesTracks,
    audioTracks,
    metaItem,
    nextVideo,
    stream,
    statisticsAvailable,
    onPlayRequested,
    onPauseRequested,
    onNextVideoRequested,
    onMuteRequested,
    onUnmuteRequested,
    onVolumeChangeRequested,
    onSeekRequested,
    onToggleSubtitlesMenu,
    onToggleAudioMenu,
    onToggleSpeedMenu,
    onToggleSideDrawer,
    onToggleOptionsMenu,
    shellCastSupported,
    onToggleCastDevicesMenu,
    videoScale,
    videoScaleLabel,
    live,
    liveTiming,
    seekable,
    buffering,
    onVideoScaleChanged,
    onToggleStatisticsMenu,
    onTouchEnd,
    onSeekBackRequested,
    onSeekForwardRequested,
    subtitlesEnabled,
    onToggleSubtitles,
    onHideInfoRequested,
    ...props
}, ref) => {
    const { chromecast } = useServices();
    const platform = usePlatform();
    const [chromecastServiceActive, setChromecastServiceActive] = React.useState(() => chromecast.active);
    const [buttonsMenuOpen, , , toggleButtonsMenu] = useBinaryState(false);
    const onSubtitlesButtonMouseDown = React.useCallback((event) => {
        event.nativeEvent.subtitlesMenuClosePrevented = true;
    }, []);
    const onAudioButtonMouseDown = React.useCallback((event) => {
        event.nativeEvent.audioMenuClosePrevented = true;
    }, []);
    const onSpeedButtonMouseDown = React.useCallback((event) => {
        event.nativeEvent.speedMenuClosePrevented = true;
    }, []);
    const onVideosButtonMouseDown = React.useCallback((event) => {
        event.nativeEvent.videosMenuClosePrevented = true;
    }, []);
    const onOptionsButtonMouseDown = React.useCallback((event) => {
        event.nativeEvent.optionsMenuClosePrevented = true;
    }, []);
    const onStatisticsButtonMouseDown = React.useCallback((event) => {
        event.nativeEvent.statisticsMenuClosePrevented = true;
    }, []);
    const onCastDevicesButtonMouseDown = React.useCallback((event) => {
        event.nativeEvent.castDevicesMenuClosePrevented = true;
    }, []);
    const onPlayPauseButtonClick = React.useCallback(() => {
        if (paused) {
            if (typeof onPlayRequested === 'function') {
                onPlayRequested();
            }
        } else {
            if (typeof onPauseRequested === 'function') {
                onPauseRequested();
            }
        }
    }, [paused, onPlayRequested, onPauseRequested]);
    const onNextVideoButtonClick = React.useCallback(() => {
        if (nextVideo !== null && typeof onNextVideoRequested === 'function') {
            onNextVideoRequested();
        }
    }, [nextVideo, onNextVideoRequested]);
    const onMuteButtonClick = React.useCallback(() => {
        if (muted) {
            if (typeof onUnmuteRequested === 'function') {
                onUnmuteRequested();
            }
        } else {
            if (typeof onMuteRequested === 'function') {
                onMuteRequested();
            }
        }
    }, [muted, onMuteRequested, onUnmuteRequested]);
    const castButtonDisabled = platform.shell.active ? !shellCastSupported : !chromecastServiceActive;
    const onChromecastButtonClick = React.useCallback(() => {
        if (platform.shell.active) {
            if (shellCastSupported && typeof onToggleCastDevicesMenu === 'function') {
                onToggleCastDevicesMenu();
            }
            return;
        }
        if (castButtonDisabled) {
            return;
        }
        chromecast.transport.requestSession();
    }, [castButtonDisabled, platform.shell.active, shellCastSupported, onToggleCastDevicesMenu]);
    React.useEffect(() => {
        const onStateChanged = () => {
            setChromecastServiceActive(chromecast.active);
        };
        chromecast.on('stateChanged', onStateChanged);
        return () => {
            chromecast.off('stateChanged', onStateChanged);
        };
    }, []);
    return (
        <div ref={ref} {...props} onTouchStart={props.onMouseOver} onTouchMove={props.onMouseMove} onTouchEnd={onTouchEnd} className={classnames(className, styles['control-bar-container'])}>
            <SeekBar
                className={styles['seek-bar']}
                time={time}
                duration={duration}
                buffered={buffered}
                onSeekRequested={onSeekRequested}
                playbackSpeed={playbackSpeed}
                live={live}
                liveTiming={liveTiming}
                paused={paused}
                onPlayRequested={onPlayRequested}
                seekable={seekable}
                buffering={buffering}
            />
            <div className={styles['control-bar-buttons-container']}>
                {/* PP: voltar 10 segundos */}
                <Button className={classnames(styles['control-bar-button'], { 'disabled': !seekable })} title={t('PP_SEEK_BACK')} tabIndex={-1} onClick={onSeekBackRequested}>
                    <SkipIcon className={styles['icon']} />
                </Button>
                <Button className={classnames(styles['control-bar-button'], { 'disabled': typeof paused !== 'boolean' })} title={paused ? t('PLAYER_PLAY') : t('PLAYER_PAUSE')} tabIndex={-1} onClick={onPlayPauseButtonClick}>
                    <Icon className={styles['icon']} name={typeof paused !== 'boolean' || paused ? 'play' : 'pause'} />
                </Button>
                {/* PP: adiantar 10 segundos */}
                <Button className={classnames(styles['control-bar-button'], { 'disabled': !seekable })} title={t('PP_SEEK_FORWARD')} tabIndex={-1} onClick={onSeekForwardRequested}>
                    <SkipIcon className={styles['icon']} forward={true} />
                </Button>
                {
                    nextVideo !== null ?
                        <Button className={classnames(styles['control-bar-button'])} title={t('PLAYER_NEXT_VIDEO')} tabIndex={-1} onClick={onNextVideoButtonClick}>
                            <Icon className={styles['icon']} name={'next'} />
                        </Button>
                        :
                        null
                }
                <Button className={classnames(styles['control-bar-button'], { 'disabled': typeof muted !== 'boolean' })} title={muted ? t('PLAYER_UNMUTE') : t('PLAYER_MUTE')} tabIndex={-1} onClick={onMuteButtonClick}>
                    <Icon
                        className={styles['icon']}
                        name={
                            (typeof muted === 'boolean' && muted) ? 'volume-mute' :
                                (volume === null || isNaN(volume)) ? 'volume-off' :
                                    volume === 0 ? 'volume-mute' :
                                        volume < 30 ? 'volume-low' :
                                            volume < 70 ? 'volume-medium' :
                                                'volume-high'
                        }
                    />
                </Button>
                {
                    !platform.isMobile ?
                        <VolumeSlider
                            className={styles['volume-slider']}
                            volume={volume}
                            muted={muted}
                            onVolumeChangeRequested={onVolumeChangeRequested}
                        />
                        : null
                }
                <div className={styles['spacing']} />
                {/* PP: ligar/desligar legenda e esconder as informações, sempre à vista */}
                <Button
                    className={classnames(styles['control-bar-button'], styles['subtitles-toggle'], { [styles['on']]: subtitlesEnabled })}
                    title={subtitlesEnabled ? t('PP_SUBTITLES_OFF') : t('PP_SUBTITLES_ON')}
                    tabIndex={-1}
                    onClick={onToggleSubtitles}>
                    <Icon className={styles['icon']} name={'subtitles'} />
                </Button>
                <Button className={styles['control-bar-button']} title={t('PP_HIDE_INFO')} tabIndex={-1} onClick={onHideInfoRequested}>
                    <Icon className={styles['icon']} name={'eye-off'} />
                </Button>
                <Button className={styles['control-bar-buttons-menu-button']} onClick={toggleButtonsMenu}>
                    <Icon className={styles['icon']} name={'more-vertical'} />
                </Button>
                <div className={classnames(styles['control-bar-buttons-menu-container'], { 'open': buttonsMenuOpen })}>
                    {
                        statisticsAvailable &&
                            <Button className={styles['control-bar-button']} tabIndex={-1} onMouseDown={onStatisticsButtonMouseDown} onClick={onToggleStatisticsMenu}>
                                <Icon className={styles['icon']} name={'network'} />
                            </Button>
                    }
                    <Button className={classnames(styles['control-bar-button'], { 'disabled': playbackSpeed === null })} tabIndex={-1} onMouseDown={onSpeedButtonMouseDown} onClick={onToggleSpeedMenu}>
                        <Icon className={styles['icon']} name={'speed'} />
                    </Button>
                    <Button className={classnames(styles['control-bar-button'], { 'disabled': castButtonDisabled })} tabIndex={-1} onMouseDown={onCastDevicesButtonMouseDown} onClick={onChromecastButtonClick}>
                        <Icon className={styles['icon']} name={'cast'} />
                    </Button>
                    <Button className={classnames(styles['control-bar-button'], { 'disabled': !Array.isArray(subtitlesTracks) || subtitlesTracks.length === 0 })} tabIndex={-1} onMouseDown={onSubtitlesButtonMouseDown} onClick={onToggleSubtitlesMenu}>
                        <Icon className={styles['icon']} name={'subtitles'} />
                    </Button>
                    <Button className={classnames(styles['control-bar-button'], { 'disabled': !Array.isArray(audioTracks) || audioTracks.length === 0 })} tabIndex={-1} onMouseDown={onAudioButtonMouseDown} onClick={onToggleAudioMenu}>
                        <Icon className={styles['icon']} name={'audio-tracks'} />
                    </Button>
                    {
                        metaItem?.content?.videos?.length > 0 ?
                            <Button className={styles['control-bar-button']} tabIndex={-1} onMouseDown={onVideosButtonMouseDown} onClick={onToggleSideDrawer}>
                                <Icon className={styles['icon']} name={'episodes'} />
                            </Button>
                            :
                            null
                    }
                    <Button className={classnames(styles['control-bar-button'], { 'disabled': videoScale === null })} title={videoScaleLabel} tabIndex={-1} onClick={onVideoScaleChanged}>
                        <Icon className={styles['icon']} name={VIDEO_SCALE_ICONS[videoScale || 'contain']} />
                    </Button>
                    <Button className={classnames(styles['control-bar-button'], { 'disabled': !stream })} tabIndex={-1} onMouseDown={onOptionsButtonMouseDown} onClick={onToggleOptionsMenu}>
                        <Icon className={styles['icon']} name={'more-horizontal'} />
                    </Button>
                </div>
            </div>
        </div>
    );
});

ControlBar.propTypes = {
    className: PropTypes.string,
    paused: PropTypes.bool,
    time: PropTypes.number,
    duration: PropTypes.number,
    buffered: PropTypes.number,
    volume: PropTypes.number,
    muted: PropTypes.bool,
    playbackSpeed: PropTypes.number,
    videoScale: PropTypes.string,
    videoScaleLabel: PropTypes.string,
    live: PropTypes.bool,
    liveTiming: PropTypes.object,
    seekable: PropTypes.bool,
    buffering: PropTypes.bool,
    onVideoScaleChanged: PropTypes.func,
    subtitlesTracks: PropTypes.array,
    audioTracks: PropTypes.array,
    metaItem: PropTypes.object,
    nextVideo: PropTypes.object,
    stream: PropTypes.object,
    statisticsAvailable: PropTypes.bool,
    onPlayRequested: PropTypes.func,
    onPauseRequested: PropTypes.func,
    onNextVideoRequested: PropTypes.func,
    onMuteRequested: PropTypes.func,
    onUnmuteRequested: PropTypes.func,
    onVolumeChangeRequested: PropTypes.func,
    onSeekRequested: PropTypes.func,
    onToggleSubtitlesMenu: PropTypes.func,
    onToggleAudioMenu: PropTypes.func,
    onToggleSpeedMenu: PropTypes.func,
    onToggleSideDrawer: PropTypes.func,
    onToggleOptionsMenu: PropTypes.func,
    shellCastSupported: PropTypes.bool,
    onToggleCastDevicesMenu: PropTypes.func,
    onToggleStatisticsMenu: PropTypes.func,
    onMouseOver: PropTypes.func,
    onMouseMove: PropTypes.func,
    onTouchEnd: PropTypes.func,
    onSeekBackRequested: PropTypes.func,
    onSeekForwardRequested: PropTypes.func,
    subtitlesEnabled: PropTypes.bool,
    onToggleSubtitles: PropTypes.func,
    onHideInfoRequested: PropTypes.func,
};

module.exports = ControlBar;
