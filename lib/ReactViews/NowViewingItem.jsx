'use strict';

import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';

const NowViewingItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired,
        index: React.PropTypes.number.isRequired,
        dragging: React.PropTypes.bool,
        onDragStart: React.PropTypes.func,
        onDragOver: React.PropTypes.func,
        onDragEnd: React.PropTypes.func,
        onActivateCatalogItemInfo: React.PropTypes.func
    },

    removeFromMap() {
        this.props.nowViewingItem.isEnabled = false;
    },

    toggleDisplay() {
        this.props.nowViewingItem.isLegendVisible = !this.props.nowViewingItem.isLegendVisible;
    },

    toggleVisibility() {
        this.props.nowViewingItem.isShown = !this.props.nowViewingItem.isShown;
    },

    zoom() {
        this.props.nowViewingItem.zoomToAndUseClock();
    },

    changeOpacity(event) {
        this.props.nowViewingItem.opacity = event.target.value;
    },

    onDragStart(e) {
        this.props.onDragStart(e);
    },

    onDragOver(e) {
        this.props.onDragOver(e);
    },

    onDragEnd(e) {
        this.props.onDragEnd(e);
    },

    openModal() {
        this.props.setWrapperState({
            modalWindowIsOpen: true,
            activeTab: 1,
            previewed: this.props.nowViewingItem,
        });
    },

    renderLegend(_nowViewingItem) {
        if (_nowViewingItem.legendUrl && (typeof _nowViewingItem.legendUrl === 'function')) {
            if ((typeof _nowViewingItem.legendUrl.isImage === 'function') && _nowViewingItem.legendUrl.isImage()) {
                return <a href={_nowViewingItem.legendUrl.url} target="_blank"><img src={_nowViewingItem.legendUrl.url}/></a>;
            }
            return <a href={_nowViewingItem.legendUrl.input} target="_blank">Open legend in a separate tab</a>;
        }
        return 'No legend to show';
    },

    previewItem() {
        this.props.onActivateCatalogItemInfo(this.props.nowViewingItem);
    },

    render() {
        const nowViewingItem = this.props.nowViewingItem;

        return (
          <li className={'now-viewing__item ' + (nowViewingItem.isLegendVisible === true ? 'is-open' : '') + ' ' + (this.props.dragging === true ? 'is-dragging' : '')} onDragOver ={this.onDragOver} data-key={this.props.index} >
            <ul className ="now-viewing__item__header">
              <li><button draggable='true' data-key={this.props.index} onDragStart={this.onDragStart} onDragEnd={this.onDragEnd} className="btn btn--drag">{nowViewingItem.name}</button></li>
              <li><button onClick={this.toggleDisplay} className={'btn btn--toggle ' + (nowViewingItem.isLegendVisible === true ? 'is-open' : '')}></button></li>
            </ul>
            <div className ="now-viewing__item__inner">
              <ul className="now-viewing__item__control">
                <li className='zoom'><button onClick={this.zoom} data-key={this.props.index} title="Zoom in data" className="btn">Zoom To</button></li>
                <li className='info'><button onClick={this.previewItem} className='btn' title='info'>info</button></li>
                <li className='remove'><button onClick={this.removeFromMap} title="Remove this data" className="btn">Remove</button></li>
                <li className='visibility'><button onClick={this.toggleVisibility} title="Data show/hide" className={'btn btn--visibility ' + (nowViewingItem.isShown ? 'is-visible' : '')}></button></li>
              </ul>
              <div className="now-viewing__item__opacity">
                <label htmlFor="opacity">Opacity: </label>
                <input type='range' name='opacity' min='0' max='1' step='0.01' value={nowViewingItem.opacity} onChange={this.changeOpacity}/>
              </div>
              <div className="now-viewing__item__legend">
                {this.renderLegend(nowViewingItem)}
              </div>
            </div>
            </li>
      );
    }
});
module.exports = NowViewingItem;
