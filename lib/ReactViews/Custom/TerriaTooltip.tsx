import { createElement, ReactElement } from "react";
import { TooltipWithButtonLauncher } from "../Generic/TooltipWrapper";
import CustomComponent, {
  DomElement,
  ProcessNodeContext
} from "./CustomComponent";

/**
 * A `<terriatooltip>` custom component, taking a title and content
 * around its child components. It has the following attributes:
 *
 *   * `title` - (Required) The text to use as the "tooltip launcher"
 */
export default class TerriaTooltipCustomComponent extends CustomComponent {
  get name(): string {
    return "terriatooltip";
  }

  get attributes(): string[] {
    return ["title"];
  }

  processNode(
    _context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[]
  ): ReactElement {
    /* eslint-disable-next-line react/no-children-prop */
    return createElement(TooltipWithButtonLauncher, {
      dismissOnLeave: true,
      launcherComponent: () => node.attribs?.title,
      children: () => children
    });
  }
}
