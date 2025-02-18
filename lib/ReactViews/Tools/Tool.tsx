import i18next, { WithT } from "i18next";
import { computed, makeObservable } from "mobx";
import {
  ComponentType,
  FC,
  lazy,
  Component,
  Suspense,
  useEffect,
  useState
} from "react";
import { useTranslation } from "react-i18next";
import TerriaError from "../../Core/TerriaError";
import {
  applyTranslationIfExists,
  TRANSLATE_KEY_PREFIX
} from "../../Language/languageHelpers";
import Terria from "../../Models/Terria";
import ViewerMode from "../../Models/ViewerMode";
import ViewState from "../../ReactViewModels/ViewState";
import MapNavigationItemController from "../../ViewModels/MapNavigation/MapNavigationItemController";
import { useViewState } from "../Context";

interface ToolProps {
  toolName: string;
  getToolComponent: () =>
    | ComponentType<React.PropsWithChildren<unknown>>
    | Promise<ComponentType<React.PropsWithChildren<unknown>>>;
  params?: any;
}

/**
 * Loads the given tool component.
 *
 * Has an associated {@link CloseToolButton} displayed in the map menu.
 * The prop toolComponent can be an immediate React Component or a promise to
 * module that exports a default React Component. The promise is useful for
 * lazy-loading the tool.
 */
const Tool: FC<React.PropsWithChildren<ToolProps>> = (props) => {
  const { getToolComponent, params, toolName } = props;
  const viewState = useViewState();
  const [t] = useTranslation();

  // Track the tool component & props together so that we always
  // pass the right props to the right tool.
  const [toolAndProps, setToolAndProps] = useState<any>(undefined);
  useEffect(() => {
    setToolAndProps([
      lazy(() =>
        Promise.resolve(getToolComponent()).then((c) => ({ default: c }))
      ),
      params
    ]);
  }, [getToolComponent, params]);

  let ToolComponent;
  let toolProps;
  if (toolAndProps !== undefined) [ToolComponent, toolProps] = toolAndProps;
  return (
    <ToolErrorBoundary t={t} toolName={toolName} terria={viewState.terria}>
      <Suspense fallback={<div>Loading...</div>}>
        {ToolComponent !== undefined ? (
          <ToolComponent {...toolProps} viewState={viewState} />
        ) : null}
      </Suspense>
    </ToolErrorBoundary>
  );
};

interface ToolButtonProps extends ToolProps {
  icon: { id: string };
  viewState: ViewState;
}

export class ToolButtonController extends MapNavigationItemController {
  constructor(private props: ToolButtonProps) {
    super();
    makeObservable(this);
  }
  get glyph() {
    return this.props.icon;
  }
  get viewerMode() {
    return ViewerMode.Cesium;
  }

  get name() {
    return applyTranslationIfExists(this.props.toolName, i18next);
  }

  // TODO: do not use the global i18next instead get i18n from react-i18next
  // @computed
  get title() {
    const buttonState = this.active ? "open" : "closed";
    return applyTranslationIfExists(
      `${TRANSLATE_KEY_PREFIX}tool.button.${buttonState}`,
      i18next,
      {
        toolName: this.name,
        toolNameLowerCase: this.name.toLowerCase()
      }
    );
  }

  @computed
  get active() {
    const currentTool = this.props.viewState.currentTool;
    return (
      super.active ||
      (currentTool && currentTool.toolName === this.props.toolName) ||
      false
    );
  }

  activate() {
    this.props.viewState.openTool({
      toolName: this.props.toolName,
      getToolComponent: this.props.getToolComponent,
      params: this.props.params,
      showCloseButton: false
    });
    super.activate();
  }

  deactivate() {
    this.props.viewState.closeTool();
    super.deactivate();
  }
}

interface ToolErrorBoundaryProps extends WithT {
  terria: Terria;
  toolName: string;
  children: any;
}

class ToolErrorBoundary extends Component<
  ToolErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    const { terria, toolName, t } = this.props;
    terria.raiseErrorToUser(
      new TerriaError({
        title: t("tool.loadingError.title", { toolName }),
        message: t("tool.loadingError.message")
      })
    );
    this.setState({ hasError: true });
  }

  render() {
    return this.state.hasError === true ? null : this.props.children;
  }
}

export default Tool;
