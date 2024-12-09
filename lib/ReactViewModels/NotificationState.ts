import { action, computed, observable, makeObservable } from "mobx";
import { ReactNode } from "react";
import ViewState from "./ViewState";

export interface Notification {
  title: string | (() => string);
  message: string | ((viewState: ViewState) => ReactNode);
  confirmText?: string;
  denyText?: string;
  confirmAction?: () => void;
  denyAction?: () => void;
  hideUi?: boolean;
  type?: string;
  width?: number | string;
  height?: number | string;
  key?: string;
  /** If notification should not be shown to the user */
  ignore?: boolean | (() => boolean);
  /** Called when notification is dismissed, this will also be triggered for confirm/deny actions */
  onDismiss?: () => void;
}

/**
 * Tracks pending notifications, and provides and interface for adding and removing them.
 * Notification queue is first-in, first-out.
 * Notifications with the same key will only be added once.
 */
export default class NotificationState {
  @observable protected notifications: Notification[] = [];
  protected alreadyNotifiedKeys: Set<string> = new Set();

  constructor() {
    makeObservable(this);
  }

  @action
  addNotificationToQueue(notification: Notification): void {
    const alreadyQueued =
      this.notifications.filter(
        (item) =>
          item.title === notification.title &&
          item.message === notification.message
      ).length !== 0;
    const keyNotSeenBefore =
      notification.key === undefined ||
      !this.alreadyNotifiedKeys.has(notification.key);

    if (!alreadyQueued && keyNotSeenBefore) {
      const ignore =
        typeof notification.ignore === "function"
          ? notification.ignore()
          : (notification.ignore ?? false);
      if (!ignore) this.notifications.push(notification);
    }

    if (notification.key !== undefined) {
      this.alreadyNotifiedKeys.add(notification.key);
    }
  }

  @action
  dismissCurrentNotification(): Notification | undefined {
    const removed = this.notifications.shift();
    removed?.onDismiss && removed.onDismiss();
    // Remove all ignored notifications
    // This is needed here as the action of dismissing the current notification may change "ignore" status of notifications in stack
    this.notifications = this.notifications.filter(
      (n) =>
        !(typeof n.ignore === "function" ? n.ignore() : (n.ignore ?? false))
    );
    return removed;
  }

  @computed
  get currentNotification(): Notification | undefined {
    return this.notifications.length > 0 ? this.notifications[0] : undefined;
  }
}
