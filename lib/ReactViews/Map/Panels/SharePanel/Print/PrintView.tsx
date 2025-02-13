import DOMPurify from "dompurify";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { StyleSheetManager, ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../../StandardUserInterface";
import { useViewState } from "../../../../Context";
import { DistanceLegend } from "../../../BottomBar/DistanceLegend";
import {
  buildShareLink,
  buildShortShareLink,
  canShorten
} from "../BuildShareLink";
import PrintDatasets from "./PrintDatasets";
import PrintSource from "./PrintSource";
import PrintViewButtons from "./PrintViewButtons";
import PrintViewMap from "./PrintViewMap";
import PrintWorkbench from "./PrintWorkbench";

const PRINT_MAP_WIDTH = 1000;

const styles = `
    .tjs-_base__list-reset {
        list-style: none;
        padding-left: 0;
        margin: 0;
    }

    .mapContainer {
      position: relative;
    }

    .map-image {
      width: ${PRINT_MAP_WIDTH}px;
    }

    .mapSection {
      display: flex;
      border: 1px solid lightgray;
      margin: 10px 0;
    }

    .mapSection .datasets{
      width:200px
    }

    h1, h2, h3 {
      clear: both;
    }

    .WorkbenchItem {
      padding-bottom: 10px;
      margin: 0 5px;
      border-bottom: 1px solid lightgray;
    }

    .WorkbenchItem:last-of-type {
      border: 0;
      padding-bottom: 0;
    }

    .tjs-_form__input {
      width: 80%;
    }

    .tjs-legend__distanceLegend {
      display: inline-block;
      text-align: center;
      position: absolute;
      bottom: 5px;
      right: 10px;
      background: white;
      padding: 5px;
    }

    .tjs-legend__distanceLegend > label {
      color: black;
    }

    .tjs-legend__distanceLegend:hover {
      background: #fff;
    }

    .tjs-legend__bar {
      border-bottom: 3px solid black;
      border-right: 3px solid black;
      border-left: 3px solid black;
      margin: 0 auto;
    }

    body {
      display:flex;
      justify-content: center;
      width: 100%
    }

    @media print {
      body {
        display: block;
      }
      .PrintView__printControls {
        display: none;
      }
    }

    main {
      width: 1200px;
    }
`;

const mkStyle = (unsafeCSS: string) => {
  const style = document.createElement("style");
  style.innerHTML = DOMPurify.sanitize(unsafeCSS, {});
  return style;
};

export const downloadImg = (
  dataString: string,
  fileName: string = "map.png"
): void => {
  const a = document.createElement("a");
  a.href = dataString;
  a.download = fileName;
  a.click();
};

interface Props {
  window: Window;
  closeCallback: () => void;
}

const getScale = (maybeElement: Element | undefined) =>
  maybeElement
    ? PRINT_MAP_WIDTH / (maybeElement as HTMLElement).offsetWidth
    : 1;

const PrintView = (props: Props) => {
  const viewState = useViewState();
  const rootNode = useRef(document.createElement("main"));

  const [screenshot, setScreenshot] = useState<Promise<string> | null>(null);
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    props.window.document.title = "Print view";
    props.window.document.head.appendChild(mkStyle(styles));
    props.window.document.body.appendChild(rootNode.current);
    props.window.addEventListener("beforeunload", props.closeCallback);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [props.window]);

  useEffect(() => {
    setScreenshot(viewState.terria.currentViewer.captureScreenshot());
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [props.window]);

  useEffect(() => {
    if (canShorten(viewState.terria)) {
      buildShortShareLink(viewState.terria, viewState, {
        includeStories: false
      })
        .then((url) => {
          setShareLink(url);
        })
        .catch(() =>
          buildShareLink(viewState.terria, viewState, {
            includeStories: false
          })
        );
    } else {
      setShareLink(
        buildShareLink(viewState.terria, viewState, {
          includeStories: false
        })
      );
    }
  }, [viewState.terria, viewState]);

  return ReactDOM.createPortal(
    <StyleSheetManager target={props.window.document.head}>
      <ThemeProvider theme={terriaTheme}>
        <PrintViewButtons window={props.window} screenshot={screenshot} />
        <section className="mapSection">
          <div className="datasets">
            <PrintWorkbench workbench={viewState.terria.workbench} />
          </div>
          <div className="map">
            {screenshot ? (
              <PrintViewMap screenshot={screenshot}>
                <DistanceLegend
                  scale={getScale(
                    viewState.terria.currentViewer.getContainer()
                  )}
                  isPrintMode
                />
              </PrintViewMap>
            ) : (
              <div>Loading...</div>
            )}
          </div>
        </section>
        <section className="PrintView__source">
          {shareLink && <PrintSource link={shareLink} />}
        </section>
        <section>
          <h2>Datasets</h2>
          <PrintDatasets items={viewState.terria.workbench.items} />
        </section>
      </ThemeProvider>
    </StyleSheetManager>,
    rootNode.current
  );
};

export default PrintView;
