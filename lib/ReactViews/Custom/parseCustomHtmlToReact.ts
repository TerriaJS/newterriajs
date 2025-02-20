import DOMPurify from "dompurify";
import React, {
  AnchorHTMLAttributes,
  createElement,
  DetailedReactHTMLElement,
  ReactElement
} from "react";
import combine from "terriajs-cesium/Source/Core/combine";
import defined from "terriajs-cesium/Source/Core/defined";
import CustomComponent, {
  DomElement,
  ProcessNodeContext
} from "./CustomComponent";
import { ExternalLinkIcon, ExternalLinkWithWarning } from "./ExternalLink";
import { Parser, ProcessNodeDefinitions } from "html-to-react";
import { createElement as htmlCreateElement } from "html-to-react/lib/utils";

const htmlToReactParser = Parser({
  decodeEntities: true
});
const processNodeDefinitions = ProcessNodeDefinitions();

const isValidNode = function () {
  return true;
};

const shouldProcessEveryNodeExceptWhiteSpace = function (node: DomElement) {
  // Use this to avoid white space between table elements, eg.
  //     <table> <tbody> <tr>\n<td>x</td> <td>3</td> </tr> </tbody> </table>
  // being rendered as empty <span> elements, and causing React errors.
  return node.type !== "text" || node.data.trim();
};

let keyIndex = 0;

function shouldAppendExternalLinkIcon(
  url: string | undefined,
  context: ParseCustomHtmlToReactContext
) {
  if (!url) return false;
  const tmp = document.createElement("a");
  tmp.href = url;
  const isExternalLink = tmp.host !== window.location.host;
  return context.disableExternalLinkIcon !== true && isExternalLink;
}

/**
 * @private
 */
function getProcessingInstructions(context: ParseCustomHtmlToReactContext) {
  // Process custom nodes specially.
  const processingInstructions: {
    shouldProcessNode: (node: DomElement) => boolean;
    processNode: (
      node: DomElement,
      children: ReactElement[],
      index: number
    ) => void;
  }[] = [];
  const customComponents = CustomComponent.values;
  for (let i = 0; i < customComponents.length; i++) {
    const customComponent = customComponents[i];
    processingInstructions.push({
      shouldProcessNode: customComponent.shouldProcessNode.bind(
        customComponent,
        context
      ),
      processNode: customComponent.processNode.bind(customComponent, context)
    });
  }

  /** Process anchor elements:
   * - Make sure any <a href> tags open in a new window
   * - Add ExternalLinkIcon
   * - Replace anchor with ExternalLinkWithWarning if `context.showExternalLinkWarning`
   */
  processingInstructions.push({
    shouldProcessNode: (node: DomElement) => node.name === "a",
    processNode: function (node: DomElement, children, index) {
      // Make sure any <a href> tags open in a new window
      const elementProps = {
        key: "anchor-" + keyIndex++,
        target: "_blank",
        rel: "noreferrer noopener"
      };
      node.attribs = combine(node.attribs, elementProps);

      // If applicable - append ExternalLinkIcon
      const appendExternalLink = shouldAppendExternalLinkIcon(
        node?.attribs?.href,
        context
      );
      if (appendExternalLink) {
        const externalIcon = React.createElement(ExternalLinkIcon, {});
        children.push(externalIcon);
      }

      // Create new Anchor element
      const aElement = htmlCreateElement(
        node,
        index,
        node.data,
        children
      ) as DetailedReactHTMLElement<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        HTMLAnchorElement
      >;

      // If external link and showExternalLinkWarning is true - replace with ExternalLinkWithWarning
      if (appendExternalLink && context.showExternalLinkWarning) {
        /* TODO: Fix types */
        /* eslint-disable-next-line react/no-children-prop */
        return createElement(ExternalLinkWithWarning, {
          attributes: aElement.props,
          children: aElement.props.children
        });
      }

      return aElement;
    }
  });

  // Process all other nodes as normal.
  processingInstructions.push({
    shouldProcessNode: shouldProcessEveryNodeExceptWhiteSpace,
    processNode: processNodeDefinitions.processDefaultNode
  });
  return processingInstructions;
}

export type ParseCustomHtmlToReactContext = ProcessNodeContext & {
  disableExternalLinkIcon?: boolean;
  /** Show warning prompt for external links */
  showExternalLinkWarning?: boolean;
};

/**
 * Return html as a React Element.
 * HTML is purified by default. Custom components are not supported by default
 * Set domPurifyOptions to specify supported custom components - for example
 * - eg. {ADD_TAGS: ['component1', 'component2']} (https://github.com/cure53/DOMPurify).
 */
function parseCustomHtmlToReact(
  html: string,
  context?: ParseCustomHtmlToReactContext,
  allowUnsafeHtml: boolean = false,
  domPurifyOptions: object = {}
) {
  if (!defined(html) || html.length === 0) {
    return html;
  }

  if (!allowUnsafeHtml) {
    html = DOMPurify.sanitize(html, domPurifyOptions);
  }

  return htmlToReactParser.parseWithInstructions(
    html,
    isValidNode,
    getProcessingInstructions(context ?? {})
  );
}

export default parseCustomHtmlToReact;
