'use strict';

import DataCatalogTab from './DataCatalogTab.jsx';
import MyDataTab from './MyDataTab.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import React from 'react';
import WelcomeTab from './WelcomeTab.jsx';

function getName(str1, str2) {
    return str1.concat(str2);
}

const Tabs = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        activeTabID: React.PropTypes.number,
        catalogSearchText: React.PropTypes.string,
        previewedCatalogItem: React.PropTypes.object,
        myDataPreviewedCatalogItem: React.PropTypes.object,
        onCatalogSearchTextChanged: React.PropTypes.func,
        onActiveTabChanged: React.PropTypes.func,
        onPreviewedCatalogItemChanged: React.PropTypes.func,
        isDraggingDroppingFile: React.PropTypes.bool,
        onFinishDroppingFile: React.PropTypes.func
    },

    getTabs() {
      // This can be passed in as prop
        return [
            {
                title: 'welcome',
                panel: <WelcomeTab terria={this.props.terria} />
            },
            {
                title: 'data-catalog',
                panel: <DataCatalogTab terria={this.props.terria}
                                       searchText={this.props.catalogSearchText}
                                       previewedCatalogItem={this.props.previewedCatalogItem}
                                       onSearchTextChanged={this.props.onCatalogSearchTextChanged}
                                       onPreviewedCatalogItemChanged={this.props.onPreviewedCatalogItemChanged}
                        />
            },
            {
                title: 'my-data',
                panel: <MyDataTab terria={this.props.terria}
                                  onPreviewedCatalogItemChanged ={this.props.onPreviewedCatalogItemChanged}
                                  myDataPreviewedCatalogItem={this.props.myDataPreviewedCatalogItem}
                                  isDraggingDroppingFile ={this.props.isDraggingDroppingFile}
                                  onFinishDroppingFile={this.props.onFinishDroppingFile}
                       />
            }
        ];
    },

    activateTab(i) {
        this.props.onActiveTabChanged(i);
    },

    renderTabs() {
        const that = this;
        return (that.getTabs().map((item, i) =>
                  <li key={i}
                    className={getName('tablist--', item.title) + ' ' + (that.props.activeTabID === i ? 'is-active' : '') }
                    id={getName('tablist--', item.title)}
                    role="tab"
                    aria-controls={getName('panel--', item.title)}
                    aria-selected={that.props.activeTabID === i}>
                  <button onClick={that.activateTab.bind(that, i)}
                    className='btn btn--tab'>{item.title.replace(/-/g, ' ')}</button>
                    </li>
                    ));
    },

    renderPanels() {
        const that = this;
        return (that.getTabs().map((item, i) => <section
                    key={i}
                    aria-hidden={that.props.activeTabID !== i}
                    id={getName('panel--', item.title)}
                    className={getName('tab-panel panel--', item.title) + ' ' + (that.props.activeTabID === i ? 'is-active' : '')}
                    aria-labelledby={getName('tablist--', item.title)}
                    role='tabpanel'
                    tabIndex='0'>
                  <h3 className="hide">{item.title.replace(/-/g, ' ')}</h3>{item.panel}</section>));
    },

    render() {
        return (
            <div className="tabs">
              <ul className="tablist" role="tablist">
              {this.renderTabs()}
              </ul>
              {this.renderPanels()}
            </div>);
    }
});

module.exports = Tabs;
