"use strict";

import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import Styles from "./notification-window.scss";
import Button from "../../Styled/Button";
import { withTheme } from "styled-components";

const NotificationWindow = createReactClass({
  displayName: "NotificationWindow",

  propTypes: {
    viewState: PropTypes.object,
    title: PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.func.isRequired
    ]),
    message: PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.func.isRequired
    ]),
    confirmText: PropTypes.string,
    denyText: PropTypes.string,
    onConfirm: PropTypes.func.isRequired,
    onDeny: PropTypes.func.isRequired,
    type: PropTypes.string,
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    theme: PropTypes.object
  },

  confirm(e) {
    e.stopPropagation();
    if (this.props.onConfirm) {
      this.props.onConfirm();
    }
  },

  deny(e) {
    e.stopPropagation();
    if (this.props.onDeny) {
      this.props.onDeny();
    }
  },

  render() {
    const title =
      typeof this.props.title === "function"
        ? this.props.title(this.props.viewState)
        : this.props.title ?? "";

    let message =
      typeof this.props.message === "function"
        ? this.props.message(this.props.viewState)
        : this.props.message;

    if (typeof message === "string") {
      message = parseCustomMarkdownToReact(message);
    }

    const confirmText = this.props.confirmText || "OK";
    const denyText = this.props.denyText;
    const type = this.props.type;

    const divStyle = {
      height: defined(this.props.height) ? this.props.height : "auto",
      width: defined(this.props.width) ? this.props.width : "500px"
    };

    return (
      <div className={classNames(Styles.wrapper, `${type}`)}>
        <div
          className={Styles.notification}
          // eslint-disable-next-line react/no-unknown-property
          isStory={isStory}
          css={`
            background: ${(p) => p.theme.dark};
            a,
            a:visited {
              color: ${(p) => p.theme.primary};
            }
          `}
        >
          <div className={Styles.inner} style={divStyle}>
            <h3 className="title">{title}</h3>
            {window.location.host === "localhost:3001" &&
              title.toLowerCase().indexOf("error") >= 0 && (
                <div>
                  <img src="./build/TerriaJS/images/feature.gif" />
                </div>
              )}
            <div className={Styles.body}>{message}</div>
          </div>
          <div className={Styles.footer}>
            {denyText && (
              <Button
                css={{
                  backgroundColor: this.props.theme.darkLighter,
                  border: "none",
                  color: "white"
                }}
                onClick={this.deny}
                textProps={{
                  medium: true
                }}
              >
                {denyText}
              </Button>
            )}
            <Button
              primary
              transparent
              onClick={this.confirm}
              textProps={{
                medium: true
              }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    );
  }
});

export default withTheme(NotificationWindow);
