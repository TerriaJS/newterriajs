import { observer } from "mobx-react";
import triggerResize from "../../Core/triggerResize";
import { useViewState } from "../Context";
import NotificationWindow from "./NotificationWindow";

const Notification = observer(() => {
  const viewState = useViewState();
  const notificationState = viewState?.terria.notificationState;
  const notification = notificationState?.currentNotification;

  if (
    viewState === undefined ||
    notificationState === undefined ||
    notification === undefined
  ) {
    return null;
  }

  const close = () => {
    // Force refresh once the notification is dispatched if .hideUi is set since once all the .hideUi's
    // have been dispatched the UI will no longer be suppressed causing a change in the view state.
    if (notification.hideUi) {
      triggerResize();
    }

    notificationState.dismissCurrentNotification();
  };
  const confirm = () => {
    if (notification.confirmAction !== undefined) {
      notification.confirmAction();
    }
    close();
  };
  const deny = () => {
    if (notification.denyAction !== undefined) {
      notification.denyAction();
    }
    close();
  };

  return (
    <NotificationWindow
      viewState={viewState}
      title={notification.title}
      message={notification.message}
      confirmText={notification.confirmText}
      denyText={notification.denyText}
      onConfirm={confirm}
      onDeny={deny}
      type={notification.type ?? "notification"}
      width={notification.width}
      height={notification.height}
    />
  );
});

export default Notification;
