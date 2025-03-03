declare namespace FullScreenButtonScssNamespace {
  export interface IFullScreenButtonScss {
    btn: string;
    enter: string;
    exit: string;
    "full-screen": string;
    fullScreen: string;
    fullScreenWrapper: string;
    isActive: string;
    minified: string;
    minifiedFullscreenBtnWrapper: string;
    toggleWorkbench: string;
    trainerBarVisible: string;
  }
}

declare const FullScreenButtonScssModule: FullScreenButtonScssNamespace.IFullScreenButtonScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: FullScreenButtonScssNamespace.IFullScreenButtonScss;
};

export = FullScreenButtonScssModule;
