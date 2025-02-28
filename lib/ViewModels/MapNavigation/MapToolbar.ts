import { action, computed, makeObservable } from "mobx";
import { ComponentType } from "react";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import TerriaError from "../../Core/TerriaError";
import ViewerMode from "../../Models/ViewerMode";
import ViewState from "../../ReactViewModels/ViewState";
import { IconGlyph } from "../../Styled/Icon";
import MapNavigationItemController from "./MapNavigationItemController";
import { NavigationItemLocation } from "./MapNavigationModel";

export interface ToolConfig {
  /**
   * Optional `id` for the tool. If no `id` is passed we generate a random
   * one and return it as the result of the `addTool()` call.
   *
   * `id` is required for other operations on the tool like opening, closing or
   * removing it from the toolbar.
   */
  id?: string;

  /**
   * A human readable name for the tool.
   */
  name: string;

  /**
   * A loader function returning the react component module to mount when user activates the tool.
   *
   * example: ```
   *  {
   *    toolComponentLoader: () => import("./MyToolModule.tsx"),
   *  }
   * ```
   */
  toolComponentLoader: () => Promise<{ default: ComponentType<any> }>;

  /**
   * The tool button configuration
   */
  toolButton: ToolButton;

  /**
   * Shows the tool button only for the specified map viewer mode. Defaults to
   * showing the tool button in both Cesium (3D) and Leaflet (2D) modes.
   *
   * eg: Setting this to `ViewerMode.Cesium` will result in the tool button
   * being shown only when the map is in Cesium 3D mode.
   */
  viewerMode?: ViewerMode;
}

export interface ToolButton {
  /**
   * Tool button text
   */
  text: string;

  /**
   * Tool button icon
   */
  icon: IconGlyph;

  /**
   * Tooltip to show when hovering over the tool button
   */
  tooltip?: string;

  /**
   * The toolBarSection to place the tool button. Defaults to `TOP`.
   *
   * The toolbar has 2 sections - TOP and BOTTOM
   *   TOP - contains the compass and other buttons
   *   BOTTOM - contains the feedback button
   */
  section?: ToolbarSection;

  /**
   * A number used to determine the order of the button in the toolbar
   */
  order?: number;
}

export type ToolbarSection = NavigationItemLocation;

export { default as ViewerMode } from "../../Models/ViewerMode";

/**
 * Adds a new tool to the map toolbar
 *
 * @param viewState The {@link ViewState} instance
 * @param config The tool configuration
 * @returns `id` of the tool. This will be the same as `config.id` if it was set. Otherwise, a random `id` is generated and returned.
 *
 * Example:
 * const toolId = addTool(viewState, {
 *   name: "X Tool",
 *   toolComponentLoader: () => import("./XTool.tsx"),
 *   toolButton: {
 *        text: "Open X tool",
 *        tooltip: "X Tool",
 *        icon: X_ICON
 *   }
 * })
 */
export function addTool(viewState: ViewState, config: ToolConfig): string {
  const id = config.id ?? createGuid();
  const controller = new ToolController(viewState, id, config);
  const terria = viewState.terria;
  terria.mapNavigationModel.addItem({
    id,
    name: config.toolButton.text,
    title: config.toolButton.tooltip,
    location: config.toolButton.section ?? "TOP",
    order: config.toolButton.order,
    controller
  });
  return id;
}

/**
 * Function to programatically open the tool with given ID.
 *
 * Note that in normal operation, a tool will be opened when user clicks the
 * tool button in the map toolbar. This function is useful in situations where
 * the tool needs to be opened through other means - like clicking a workbench
 * viewing-controls button.
 *
 * If no tool exists with the given `toolId` then this function does nothing
 * and returns `false`.  The caller can also check if the call was successful
 * by checking the result of {@link isToolOpen()}.
 *
 * @param viewState The `ViewState` instance.
 * @param toolId ID of the tool to open. See {@link addTool}.
 * @param props Optional props to pass to the Tool component when activating it.
 * @returns `true` if the tool was successfully opened.
 */
export function openTool(viewState: ViewState, toolId: string, props?: any) {
  const controller = findToolController(viewState, toolId);
  controller?.openTool(props);
  return controller?.isToolOpen === true;
}

/**
 * Closes the tool with given id.
 *
 * @param viewState The `ViewState` instance.
 * @param toolId ID of the tool to close.
 */
export function closeTool(viewState: ViewState, toolId: string) {
  findToolController(viewState, toolId)?.closeTool();
}

/**
 * Check if tool with given `id` is currently open.
 *
 * @param viewState The `ViewState` instance.
 * @param toolId ID of the tool to check.
 * @returns `true` if the tool is currently open, otherwise returns `false`.
 */
export function isToolOpen(viewState: ViewState, toolId: string): boolean {
  return findToolController(viewState, toolId)?.active === true;
}

/**
 * Removes the tool with the given id from the toolbar.
 *
 * @param viewState The `ViewState` instance.
 * @param toolId ID of the tool to close.
 */
export function removeTool(viewState: ViewState, toolId: string) {
  viewState.terria.mapNavigationModel.remove(toolId);
}

/**
 * Find `ToolController` by id.
 */
function findToolController(
  viewState: ViewState,
  toolId: string
): ToolController | undefined {
  const navItem = viewState.terria.mapNavigationModel.items.find(
    (it) => it.id === toolId
  );
  return navItem?.controller instanceof ToolController
    ? navItem.controller
    : undefined;
}

export class ToolController extends MapNavigationItemController {
  constructor(
    readonly viewState: ViewState,
    readonly toolId: string,
    readonly toolConfig: ToolConfig
  ) {
    super();
    makeObservable(this);
  }

  get glyph(): { id: string } {
    return this.toolConfig.toolButton.icon;
  }

  get viewerMode(): ViewerMode | undefined {
    return this.toolConfig.viewerMode;
  }

  @computed
  get isToolOpen() {
    return this.viewState.currentTool?.toolName === this.toolConfig.name;
  }

  @computed
  get active(): boolean {
    return super.active && this.isToolOpen;
  }

  openTool(props: any = {}) {
    const toolConfig = this.toolConfig;
    const toolId = this.toolId;
    try {
      this.viewState.openTool({
        toolName: toolConfig.name,
        getToolComponent: () =>
          toolConfig.toolComponentLoader().then((m) => m.default),
        params: {
          ...props,
          // Pass toolId as an extra prop to the component.
          // TODO: Maybe we should use react contexts to do this instead of a magic prop?
          toolId
        },
        showCloseButton: true
      });
    } catch (err) {
      this.viewState.terria.raiseErrorToUser(TerriaError.from(err));
    }
    super.activate();
  }

  activate() {
    this.openTool();
  }

  deactivate() {
    this.closeTool();
  }

  @action
  closeTool() {
    if (this.isToolOpen) this.viewState.closeTool();
    super.deactivate();
  }
}
