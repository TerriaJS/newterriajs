/**
 * base tooltipwrapperraw repurposed from magda, with some a11y modifications
 */
import { ReactNode, FC, createRef, Component } from "react";
import ReactDOM from "react-dom";
import { withTheme, DefaultTheme } from "styled-components";
import { useUID } from "react-uid";
import { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import { TextSpan } from "../../Styled/Text";

type Props = {
  theme: DefaultTheme;

  /** Invoked when the tooltip is dismissed by the user - not called if the tooltip disappears automatically  */
  onDismiss?: () => void;
  /**
   * When dismiss/launch actions are handled within render prop, use this to disable default listeners
   * if using this, ensure you handle the dismiss case externally otherwise the tooltip can get stuck on open
   */
  disableEventListeners?: boolean;
  /** Whether the tooltip should start in an open state */
  startOpen?: boolean;
  /** Whether the tooltip should show up above or below the element it wraps */
  orientation?: "below" | "above";
  /**
   * A function that returns a component that should launch the tooltip. If startOpen is false then it will show
   * the tooltip when hovered over. Accepts an "open" callback that can be used to force-launch the tooltip (e.g. on click) */
  launcher?: (launchObj: {
    state: State;
    launch: () => void;
    forceSetState: (bool?: boolean) => void;
  }) => ReactNode;
  /** Styles to apply to the  actual tooltip */
  innerElementStyles?: object;
  /** The tooltip content itself, as higher-order function that provides a function to dismiss the tooltip */
  children: (applyAriaId: boolean, dismiss: () => void) => ReactNode;
};

type State = {
  offset: number;
  open: boolean;
};

/**
 * @description Return a information tooltip, on hover show calculation method.
 */
class TooltipWrapperRaw extends Component<Props, State> {
  rootRef = createRef<HTMLDivElement>();
  tooltipTextElementRef = createRef<HTMLSpanElement>();
  state = {
    offset: 0,
    open: !!this.props.startOpen
  };

  componentDidMount() {
    if (!this.props.disableEventListeners) {
      document.addEventListener("mousedown", this.dismiss);
      document.addEventListener("touchstart", this.dismiss);
    }

    this.adjustOffset();
  }

  componentDidUpdate() {
    this.adjustOffset();
  }

  componentWillUnmount() {
    if (!this.props.disableEventListeners) {
      document.removeEventListener("mousedown", this.dismiss);
      document.removeEventListener("touchstart", this.dismiss);
    }
  }

  dismiss = () => {
    if (this.props.onDismiss) {
      this.props.onDismiss();
    }
    this.setState({ open: false });
  };

  /**
   * Adjust the offset margin of the tooltiptext so it's at the centre of the launcher.
   */
  adjustOffset() {
    const tooltipTextElement = this.tooltipTextElementRef.current;
    const rootElement = this.rootRef.current;

    // Why .firstChild? Because we can't attach a ref to a render prop unless whatever's passed in passes the ref through to its first dom element
    const launcherElement = rootElement?.firstChild;
    if (!launcherElement || !tooltipTextElement) {
      return;
    }

    const launcherElementStyle =
      (launcherElement as any).currentStyle ||
      window.getComputedStyle(launcherElement as Element);

    const tooltipWidth = tooltipTextElement!.offsetWidth;
    const offset =
      (tooltipWidth +
        parseFloat(launcherElementStyle.marginLeft) +
        parseFloat(launcherElementStyle.marginRight) -
        parseFloat(launcherElementStyle.paddingRight) -
        parseFloat(launcherElementStyle.paddingLeft)) /
      2;
    // only update if the difference is big enough to prevent indefinite loop caused by browser sub pixel error
    // FIXME: this test however passes in safari mobile each time resulting in a inifinite render loop
    if (Math.abs(this.state.offset - offset) > 5) {
      this.setState({
        offset: offset
      });
    }
  }

  /**
   * get live-render-time values of tooltip ref - should already offset adjusted
   * by the time its rendered
   */
  getTooltipCoords = () => {
    const tooltipTextElement = this.tooltipTextElementRef.current;
    if (!tooltipTextElement) {
      return { x: 0, y: 0 };
    }
    const { x, y, width, height } = tooltipTextElement.getBoundingClientRect();
    const maxX = document.documentElement.clientWidth - width;
    const maxY = document.documentElement.clientHeight - height;
    // make sure the tooltip doesn't get clipped by the browser edges
    const adjustedX = x < 10 ? 10 : x > maxX ? maxX - 10 : x;
    const adjustedY = y < 10 ? 10 : y > maxY ? maxY - 10 : y;
    return { x: adjustedX, y: adjustedY };
  };

  forceSetState = (bool: boolean = true) => {
    this.setState({
      open: bool
    });
  };

  render() {
    const { orientation, theme, innerElementStyles } = this.props;
    const orientationBelow = orientation === "below";
    // default to above
    const orientationAbove =
      orientation === "above" || orientation === undefined;

    return (
      <span
        ref={this.rootRef}
        css={`
          position: relative;
          display: inline-block;
        `}
      >
        {/* Caution: if this is ever not the first element be sure to fix adjustOffset */}
        {this.props.launcher &&
          this.props.launcher({
            state: this.state,
            launch: () => this.forceSetState(true),
            forceSetState: this.forceSetState
          })}
        {this.state.open &&
          ReactDOM.createPortal(
            <BoxSpan
              paddedRatio={3}
              position="absolute"
              rounded
              style={{
                ...innerElementStyles
              }}
              css={`
                // TODO: find offending z-index - likely still in scss
                z-index: ${theme.frontComponentZIndex + 999999 + 2};
                background-color: ${theme.textDark};
                color: ${theme.textLight};
                text-align: left;
                top: ${this.getTooltipCoords().y}px;
                left: ${this.getTooltipCoords().x}px;
              `}
            >
              {this.props.children(true, this.dismiss)}
            </BoxSpan>,
            document.body
          )}
        {/* Render this always so that the ref exists for calculations */}
        <BoxSpan
          paddedRatio={3}
          position="absolute"
          css={`
            visibility: hidden;
            left: 50%;

            ${orientationAbove && `bottom: calc(100% + 10px);`}
            ${orientationBelow && `top: calc(100% + 10px);`}
          `}
          ref={this.tooltipTextElementRef}
          style={{
            marginLeft: "-" + this.state.offset + "px",
            ...innerElementStyles
          }}
          /**
           caret styles if we need them again
          &::after {
              content: "";
              position: absolute;
              left: 50%;
              margin-left: -10px;
              border-width: 10px;
              border-style: solid;
            }
            ${orientationBelow &&
              `&::after {
                bottom: 100%;
                border-color: transparent transparent ${theme.textDark} transparent;
            `}
            ${orientationAbove &&
              `&::after {
                top: 100%;
                border-color: ${theme.textDark} transparent transparent transparent;
            `}
           */
        >
          {/* Unfortunately we MUST render children here so that we can correctly calculate offsets */}
          {this.props.children(false, this.dismiss)}
        </BoxSpan>
      </span>
    );
  }
}
export const TooltipWrapper = withTheme(TooltipWrapperRaw);

type ButtonLauncherProps = {
  launcherComponent: () => ReactNode;
  children: (idForAria: string) => ReactNode;
  dismissOnLeave?: boolean;
  orientation?: "below" | "above";
  [spread: string]: any;
};

export const TooltipWithButtonLauncher: FC<ButtonLauncherProps> = (props) => {
  const { launcherComponent, children, dismissOnLeave, orientation, ...rest } =
    props;

  const idForAria = `ButtonLauncher-${useUID()}`;
  const idForChildAria = `ButtonLauncher-child-${useUID()}`;

  return (
    <TooltipWrapper
      innerElementStyles={{
        width: "350px"
      }}
      orientation={orientation || "below"}
      {...rest}
      disableEventListeners
      launcher={(launchObj) => {
        const handleClose = () => {
          if (launchObj.state.open) {
            launchObj.forceSetState(false);
          }
        };
        const restButtonProps = dismissOnLeave
          ? {
              onMouseLeave: () => handleClose(),
              onBlur: () => handleClose()
            }
          : {};
        return (
          <RawButton
            css={"text-decoration: underline dashed;"}
            aria-expanded={launchObj.state.open}
            aria-describedby={`${idForAria} ${idForChildAria}`}
            onClick={() => launchObj.forceSetState(!launchObj.state.open)}
            onFocus={launchObj.launch}
            onMouseOver={() => {
              if (!launchObj.state.open) {
                launchObj.launch();
              }
            }}
            {...restButtonProps}
          >
            {launcherComponent()}
          </RawButton>
        );
      }}
    >
      {(applyAriaId) => (
        <TextSpan
          // provide some base text styles as a textspan,
          // as this will be rendered outside the tree
          large
          semiBold
          {...{
            id: (applyAriaId && idForAria) || undefined
          }}
        >
          {children((applyAriaId && idForChildAria) || "")}
        </TextSpan>
      )}
    </TooltipWrapper>
  );
};

export default TooltipWrapper;
