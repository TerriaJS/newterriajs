declare namespace VariablesExportScssNamespace {
  export interface IVariablesExportScss {
    blur: string;
    charcoalGrey: string;
    colorPrimary: string;
    colorSecondary: string;
    compassWidth: string;
    dark: string;
    darkLighter: string;
    darkMid: string;
    darkWithOverlay: string;
    font: string;
    fontBase: string;
    fontFeatureInfo: string;
    fontMono: string;
    fontPop: string;
    frontComponentZIndex: string;
    grey: string;
    greyLighter: string;
    greyLighter2: string;
    greyLightest: string;
    inputHeight: string;
    inputHeightLarge: string;
    lg: string;
    logoHeight: string;
    logoPaddingHorizontal: string;
    logoPaddingVertical: string;
    logoSmallHeight: string;
    logoSmallPaddingHorizontal: string;
    logoSmallPaddingVertical: string;
    mapButtonColor: string;
    mapButtonTop: string;
    mapNavigationTop: string;
    md: string;
    mobile: string;
    modalBg: string;
    modalHighlight: string;
    modalText: string;
    notificationWindowZIndex: string;
    overlay: string;
    overlayInvert: string;
    panelRadius: string;
    radius40Button: string;
    radiusLarge: string;
    radiusSmall: string;
    radiusXL: string;
    radiusXl: string;
    ringWidth: string;
    scrollbarColor: string;
    scrollbarTrackColor: string;
    sm: string;
    spacing: string;
    textBlack: string;
    textDark: string;
    textDarker: string;
    textLight: string;
    textLightDimmed: string;
    textLightTranslucent: string;
    toolPrimaryColor: string;
    trainerHeight: string;
    transparentDark: string;
    turquoiseBlue: string;
    workbenchMargin: string;
    workbenchWidth: string;
    workflowPanelWidth: string;
  }
}

declare const VariablesExportScssModule: VariablesExportScssNamespace.IVariablesExportScss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: VariablesExportScssNamespace.IVariablesExportScss;
};

export = VariablesExportScssModule;
