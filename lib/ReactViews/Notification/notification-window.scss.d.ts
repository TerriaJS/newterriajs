declare namespace NotificationWindowScssNamespace {
  export interface INotificationWindowScss {
    body: string;
    footer: string;
    inner: string;
    notification: string;
    title: string;
    wrapper: string;
  }
}

declare const NotificationWindowScssModule: NotificationWindowScssNamespace.INotificationWindowScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: NotificationWindowScssNamespace.INotificationWindowScss;
};

export = NotificationWindowScssModule;
