import PropTypes from 'prop-types';
import AceEditor from 'react-ace';

import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-min-noconflict/ext-searchbox';
import 'ace-builds/src-min-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import 'ace-builds/src-noconflict/theme-chrome';

import {
    MenuItem, Select, Dialog, DialogTitle, Button, DialogContent, DialogActions, IconButton, CircularProgress,
} from '@mui/material';

import { HelpOutline, Check as CheckIcon } from '@mui/icons-material';

import I18n from '@iobroker/adapter-react-v5/i18n';
import { useEffect, useState } from 'react';

const CSS = props => {
    const [type, setType] = useState('global');

    const [localCss, setLocalCss] = useState('');
    const [globalCss, setGlobalCss] = useState('');
    const [showHelp, setShowHelp] = useState(false);

    const [localCssTimer, setLocalCssTimer] = useState(null);
    const [globalCssTimer, setGlobalCssTimer] = useState(null);

    const timers = {
        global: {
            timer: globalCssTimer,
            setTimer: setGlobalCssTimer,
            value: globalCss,
            setValue: setGlobalCss,
            directory: 'vis',
            file: 'css/vis-common-user.css',
        },
        local: {
            timer: localCssTimer,
            setTimer: setLocalCssTimer,
            value: localCss,
            setValue: setLocalCss,
            directory: 'vis.0',
            file: `${props.projectName}/vis-user.css`,
        },
    };

    useEffect(async () => {
        setGlobalCss(await props.socket.readFile('vis', 'css/vis-common-user.css'));
        setLocalCss(await props.socket.readFile('vis.0', `${props.projectName}/vis-user.css`));
        if (window.localStorage.getItem('CSS.type')) {
            setType(window.localStorage.getItem('CSS.type'));
        }
    }, []);

    const save = (value, saveType) => {
        timers[saveType].setValue(value);
        clearTimeout(timers[saveType].timer);
        timers[saveType].setTimer(setTimeout(() => {
            timers[saveType].setTimer(null);
            props.socket.writeFile64(timers[saveType].directory, timers[saveType].file, value);
        }, 1000));
    };

    return <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Dialog
                open={!!showHelp}
                maxWidth={props.maxWidth || 'md'}
            >
                <DialogTitle>{I18n.t('Explanation')}</DialogTitle>
                <DialogContent>
                    {type === 'global' ? I18n.t('help_css_global') : I18n.t('help_css_project')}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => setShowHelp(false)}
                        startIcon={<CheckIcon />}
                    >
                        {I18n.t('Ok')}
                    </Button>
                </DialogActions>
            </Dialog>
            <Select variant="standard"
                value={type}
                onChange={e => {
                    setType(e.target.value);
                    window.localStorage.setItem('CSS.type', e.target.value);
                }}
            >
                <MenuItem value="global">{I18n.t('Global')}</MenuItem>
                <MenuItem value="local">{I18n.t('Project')}</MenuItem>
            </Select>
            <IconButton onClick={() => setShowHelp(true)} size="small"><HelpOutline /></IconButton>
            {globalCssTimer || localCssTimer ? <CircularProgress size={20} /> : null}
        </div>
        <AceEditor
            mode="css"
            theme={props.themeName === 'dark' ? 'clouds_midnight' : 'chrome'}
            value={type === 'global' ? globalCss : localCss}
            onChange={newValue => save(newValue, type)}
            width="100%"
            setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
            }}
        />
    </div>;
};

CSS.propTypes = {
    projectName: PropTypes.string,
    socket: PropTypes.object,
    themeName: PropTypes.string,
};

export default CSS;
