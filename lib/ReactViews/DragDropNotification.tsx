import classNames from "classnames";
import { reaction } from "mobx";
import { observer } from "mobx-react";
import { FC, useEffect, useState, useCallback, useRef } from "react";
import Icon from "../Styled/Icon";
import Styles from "./drag-drop-notification.scss";
import { useViewState } from "./Context";

const DragDropNotification: FC = observer(() => {
  const viewState = useViewState();
  const [showNotification, setShowNotification] = useState(false);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    const disposer = reaction(
      () => viewState.lastUploadedFiles,
      () => {
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        // show notification, restart timer
        setShowNotification(true);
        // initialise new time out
        notificationTimeoutRef.current = setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    );

    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      disposer();
    };
  }, [viewState.lastUploadedFiles]);

  const handleHover = () => {
    // reset timer on hover
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    notificationTimeoutRef.current = setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  const handleClick = () => {
    viewState.openUserData();
  };

  const fileNames = viewState.lastUploadedFiles.join(",");

  return (
    <button
      className={classNames(Styles.notification, {
        [Styles.isActive]: showNotification && fileNames.length > 0
      })}
      onMouseEnter={handleHover}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
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
        {viewState.lastUploadedFiles.length > 1 ? "have" : "has"} been added to{" "}
        <span className={Styles.action}>My data</span>
      </div>
    </button>
  );
});

export default DragDropNotification;
