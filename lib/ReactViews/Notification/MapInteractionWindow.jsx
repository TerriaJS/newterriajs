'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import parseCustomHtmlToReact from '../../Models/parseCustomHtmlToReact';

const MapInteractionWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object
    },

    render() {
        const interactionMode = this.props.terria.mapInteractionModeStack && this.props.terria.mapInteractionModeStack[this.props.terria.mapInteractionModeStack.length - 1];
        return (
            <div className={`map-interaction-window ${interactionMode ? 'is-active' : ''}`} aria-hidden={ !interactionMode }>
            <div className="map-interaction-content">{interactionMode && parseCustomHtmlToReact(interactionMode.message())}</div>
            <button type='button' onClick={interactionMode && interactionMode.onCancel}
                          className='btn btn-primary'>{interactionMode && interactionMode.buttonText}</button>
            </div>);
    }
});

module.exports = MapInteractionWindow;
