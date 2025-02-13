import { createElement, ReactElement } from "react";
import Collapsible from "./Collapsible/Collapsible";
import CustomComponent, {
  DomElement,
  ProcessNodeContext
} from "./CustomComponent";

/**
 * A `<collapsible>` custom component, which displays a collapsible section
 * around its child components. It has the following attributes:
 *
 *   * `title` - (Required) The title of the section.
 *   * `open` - (Optional) True if the section is initially open.
 */
export default class CollapsibleCustomComponent extends CustomComponent {
  get name(): string {
    return "collapsible";
  }

  get attributes(): string[] {
    return ["title", "open", "rightbtn", "btnstyle"];
  }

  processNode(
    _context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[]
  ): ReactElement {
    const title =
      node.attribs && node.attribs.title ? node.attribs.title : "Collapsible";
    const isOpen = node.attribs ? Boolean(node.attribs.open) : false;
    const btnRight = Boolean(node.attribs?.rightbtn);
    const btnStyle = node.attribs?.btnstyle;

    return createElement(
      Collapsible,
      {
        key: title,
        title,
        isOpen,
        btnRight,
        btnStyle: btnStyle === "plus" ? "plus" : undefined
      },
      children
    );
  }
}
