import classNames from "classnames";
import { reaction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import Icon from "../Styled/Icon";
import Styles from "./drag-drop-notification.scss";
import { withViewState } from "./Context";

@observer
class DragDropNotification extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showNotification: false
    };
  }

  static propTypes = {
    viewState: PropTypes.object
  };

  notificationTimeout = null;
  lastUploadedFilesReaction = null;

  componentDidMount() {
    this.lastUploadedFilesReaction = reaction(
      () => this.props.viewState.lastUploadedFiles,
      () => {
        clearTimeout(this.notificationTimeout);
        // show notification, restart timer
        this.setState({
          showNotification: true
        });
        // initialise new time out
        this.notificationTimeout = setTimeout(() => {
          this.setState({
            showNotification: false
          });
        }, 5000);
      }
    );
  }

  componentWillUnmount() {
    clearTimeout(this.notificationTimeout);
    this.lastUploadedFilesReaction();
  }

  handleHover() {
    // reset timer on hover
    clearTimeout(this.notificationTimeout);
  }

  handleMouseLeave() {
    this.notificationTimeout = setTimeout(() => {
      this.setState({
        showNotification: false
      });
    }, 4000);
  }

  handleClick() {
    this.props.viewState.openUserData();
  }

  render() {
    const fileNames = this.props.viewState.lastUploadedFiles.join(",");
    return (
      <button
        className={classNames(Styles.notification, {
          [Styles.isActive]: this.state.showNotification && fileNames.length > 0
        })}
        onMouseEnter={this.handleHover.bind(this)}
        onMouseLeave={this.handleMouseLeave.bind(this)}
        onClick={this.handleClick.bind(this)}
      >
        <div className={Styles.icon}>
          <Icon glyph={Icon.GLYPHS.upload} />
        </div>
        <div className={Styles.info}>
          <span className={Styles.filename}>
            {'"'}
            {fileNames}
            {'"'}
          </span>{" "}
          {this.props.viewState.lastUploadedFiles.length > 1 ? "have" : "has"}{" "}
          been added to <span className={Styles.action}>My data</span>
        </div>
      </button>
    );
  }
}

export default withViewState(DragDropNotification);
