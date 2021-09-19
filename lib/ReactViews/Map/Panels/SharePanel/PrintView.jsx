"use strict";
import createReactClass from "create-react-class";
import DOMPurify from "dompurify/dist/purify";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { formatDateTime } from "../../../BottomDock/Timeline/DateFormats";
import FeatureInfoPanel from "../../../FeatureInfo/FeatureInfoPanel";
import Description from "../../../Preview/Description";
import Legend from "../../../Workbench/Controls/Legend";

const PrintView = createReactClass({
  displayName: "PrintView",

  propTypes: {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    window: PropTypes.object,
    readyCallback: PropTypes.func
  },

  getInitialState() {
    return {
      mapImageDataUrl: undefined,
      ready: false,
      printingStarted: false
    };
  },

  componentDidMount() {
    return this.props.terria.currentViewer
      .captureScreenshot()
      .then(mapImageDataUrl => {
        // We need to periodically check whether all images are loaded.
        // We can theoretically do that either with a setInterval on the original TerriaJS window,
        // or on the print view window. But:
        //    * Chrome (as of v66.0.3359.139 anyway) seems to aggressively suspend setInterval calls in background
        // tabs, so only a setInterval on the print view window works reliably.
        //    * Internet Explorer 11 does not seem to allow a cross-window setInterval call, so only a setInterval
        // on the original TerriaJS window works reliably.
        // So, we'll do both.

        const printWindow = this.props.window;
        const mainWindow = window;

        const printWindowIntervalId = printWindow.setInterval(
          this.checkForImagesReady,
          200
        );
        const mainWindowIntervalId = mainWindow.setInterval(
          this.checkForImagesReady,
          200
        );

        this._stopCheckingForImages = () => {
          printWindow.clearInterval(printWindowIntervalId);
          mainWindow.clearInterval(mainWindowIntervalId);
          this._stopCheckingForImages = undefined;
        };

        this.setState({
          mapImageDataUrl: mapImageDataUrl
        });
      });
  },

  componentWillUnmount() {
    this.stopCheckingForImages();
  },

  componentDidUpdate() {
    if (this.state.ready && !this.state.printingStarted) {
      if (this.props.readyCallback) {
        this.props.readyCallback(this.props.window);
      }
      this.setState({
        printingStarted: true
      });
    }
  },

  stopCheckingForImages() {
    if (this._stopCheckingForImages) {
      this._stopCheckingForImages();
    }
  },

  checkForImagesReady() {
    if (this.state.ready) {
      return;
    }

    const imageTags = this.props.window.document.getElementsByTagName("img");
    if (imageTags.length === 0) {
      return;
    }

    let allImagesReady = true;
    for (let i = 0; allImagesReady && i < imageTags.length; ++i) {
      allImagesReady = imageTags[i].complete;
    }

    if (allImagesReady) {
      this.stopCheckingForImages();
      this.setState({
        ready: allImagesReady
      });
    }
  },

  render() {
    if (!this.state.mapImageDataUrl) {
      return <div>Creating print view...</div>;
    }

    return (
      <div>
        <p>
          <img
            className="map-image"
            src={this.state.mapImageDataUrl}
            alt="Map snapshot"
          />
        </p>
        <h1>Legends</h1>
        {this.props.terria.workbench.items.map(this.renderLegend)}
        {this.renderFeatureInfo()}
        <h1>Dataset Details</h1>
        {this.props.terria.workbench.items.map(this.renderDetails)}
        <h1>Map Credits</h1>
        {/* TODO: We don't have a way of getting credits yet*/}
        <If condition={this.props.terria.configParameters.printDisclaimer}>
          <h1>Print Disclaimer</h1>
          <p>{this.props.terria.configParameters.printDisclaimer.text}</p>
        </If>
      </div>
    );
  },

  renderAttribution(attribution) {
    // For reasons I don't entirely understanding, using parseCustomHtmlToReact instead
    // of dangerouslySetInnerHTML here doesn't work in IE11 or Edge. All elements after
    // the first attribution end up just completely missing from the DOM.
    const html = { __html: DOMPurify.sanitize(attribution) };
    return <li key={attribution} dangerouslySetInnerHTML={html} />;
  },

  renderLegend(catalogItem) {
    if (!catalogItem.isMappable) {
      return null;
    }

    return (
      <div key={catalogItem.uniqueId} className="layer-legends">
        <div className="layer-title">{catalogItem.name}</div>
        {catalogItem.discreteTime && (
          <div className="layer-time">
            Time: {formatDateTime(catalogItem.discreteTime)}
          </div>
        )}
        <Legend forPrint={true} item={catalogItem} />
      </div>
    );
  },

  renderDetails(catalogItem) {
    if (!catalogItem.isMappable) {
      return null;
    }

    const nowViewingItem = catalogItem.nowViewingCatalogItem || catalogItem;
    return (
      <div key={catalogItem.uniqueId} className="layer-details">
        <h2>{catalogItem.name}</h2>
        <Description item={nowViewingItem} printView={true} />
      </div>
    );
  },

  renderFeatureInfo() {
    if (
      !this.props.viewState.featureInfoPanelIsVisible ||
      !this.props.terria.pickedFeatures ||
      !this.props.terria.pickedFeatures.features ||
      this.props.terria.pickedFeatures.features.length === 0
    ) {
      return null;
    }

    return (
      <div className="feature-info">
        <h1>Feature Information</h1>
        <FeatureInfoPanel
          terria={this.props.terria}
          viewState={this.props.viewState}
          printView={true}
        />
      </div>
    );
  }
});

PrintView.Styles = `
    .tjs-_base__list-reset {
        list-style: none;
        padding-left: 0;
        margin: 0;
    }

    .background {
        width: 100%;
        fill: rgba(255, 255, 255, 1.0);
    }

    .map-image {
        max-width: 95vw;
        max-height: 95vh;
    }

    .layer-legends {
        display: inline;
        float: left;
        padding-left: 20px;
        padding-right: 20px;
    }

    .layer-title {
        font-weight: bold;
    }

    h1, h2, h3 {
        clear: both;
    }

    .tjs-_form__input {
        width: 80%;
    }
`;

/**
 * Creates a new printable view.
 *
 * @param {Terria} options.terria The Terria instance.
 * @param {ViewState} options.viewState The terria ViewState instance.
 * @param {Window} [options.printWindow] The window in which to create the print view. This is usually a new window created with
 *                 `window.open()` or an iframe's `contentWindow`. If undefined, a new window (tab) will be created.
 * @param {Function} [options.readyCallback] A function that is called when the print view is ready to be used. The function is
 *                   given the print view window as its only parameter.
 * @param {Function} [options.closeCallback] A function that is called when the print view is closed. The function is given
 *                   the print view window as its only parameter.
 */
PrintView.create = function(options) {
  const {
    terria,
    viewState,
    printWindow = window.open(),
    readyCallback,
    closeCallback
  } = options;

  if (closeCallback) {
    printWindow.addEventListener("unload", () => {
      closeCallback(printWindow);
    });
  }

  // Open and immediately close the document. This works around a problem in Firefox that is
  // captured here: https://bugzilla.mozilla.org/show_bug.cgi?id=667227.
  // Essentially, when we first create an iframe, it has no document loaded and asynchronously
  // starts a load of "about:blank". If we access the document object and start manipulating it
  // before that async load completes, a new document will be automatically created. But then
  // when the async load completes, the original, automatically-created document gets unloaded
  // and the new "about:blank" gets swapped in. End result: everything we add to the DOM before
  // the async load complete gets lost and Firefox ends up printing a blank page.
  // Explicitly opening and then closing a new document _seems_ to avoid this.
  printWindow.document.open();
  printWindow.document.close();

  printWindow.document.head.innerHTML = `
        <meta charset="UTF-8">
        <title>${terria.appName} Print View</title>
        <style>${PrintView.Styles}</style>
        `;
  printWindow.document.body.innerHTML = '<div id="print"></div>';

  const printView = (
    <PrintView
      terria={terria}
      viewState={viewState}
      window={printWindow}
      readyCallback={readyCallback}
    />
  );
  ReactDOM.render(printView, printWindow.document.getElementById("print"));
};

module.exports = PrintView;
