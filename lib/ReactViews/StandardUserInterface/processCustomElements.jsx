import { Children, cloneElement } from "react";
import {
  Nav,
  Menu,
  MenuLeft,
  ExperimentalMenu,
  Feedback
} from "./customizable/Groups";

const GROUP_ELEMENT_TO_KEY_MAPPING = {
  menu: Menu,
  menuLeft: MenuLeft,
  nav: Nav,
  experimentalMenu: ExperimentalMenu,
  feedback: Feedback
};

const groupElementKeys = Object.keys(GROUP_ELEMENT_TO_KEY_MAPPING);

/**
 * Processes custom elements that are specified as the children of StandardUserInterface.
 *
 * @param isSmallScreen Whether to display components for large or small screens - this will be passed to child components
 *      as a "smallScreen" prop if it's defined in the child component's propTypes. This is mainly used with the
 *      {@link ResponsiveSwitch} HOC.
 * @param customUI {React.ReactNode} An array of elements - these should be grouping elements like <Nav> and <Menu> that in turn
 *      have other elements specified as children.
 * @returns {Object<Array<Element>>} An index of arrays of custom elements against where they should go - e.g. an array
 *      for "menu", an array for "nav" etc.
 */
export default function processCustomElements(isSmallScreen, customUI) {
  const groupElements = Children.toArray(customUI);

  return groupElements.reduce((soFar, groupElement) => {
    const key = findKeyForGroupElement(groupElement);
    soFar[key] = soFar[key].concat(
      getGroupChildren(isSmallScreen, groupElement)
    );

    return soFar;
  }, buildEmptyAccumulator());
}

/** Builds an empty accumulator object - each location for custom elements will have an empty array in the return object */
function buildEmptyAccumulator() {
  return groupElementKeys.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});
}

/** Finds the associated key string for the grouping element provided - e.g. a <Nav> element will resolve to 'nav' */
function findKeyForGroupElement(groupElement) {
  return groupElementKeys.filter(
    (key) => groupElement.type === GROUP_ELEMENT_TO_KEY_MAPPING[key]
  )[0];
}

/**
 * Gets the children out of a grouping element and sanitises them - e.g. plain strings are converted to <span>s and
 * elements that need to know about whether we're in small screen configuration are provided with that prop.
 *
 * @param isSmallScreen {boolean} Is the screen small?
 * @param groupElement {Element} a grouping element to get children from.
 * @returns {Array<Element>} a collection of processed children.
 */
function getGroupChildren(isSmallScreen, groupElement) {
  return Children.map(groupElement.props.children, (child) => {
    if (typeof child === "string") {
      return <span>{child}</span>;
    } else if (
      child &&
      child.type.propTypes &&
      child.type.propTypes.smallScreen
    ) {
      return cloneElement(child, {
        smallScreen: isSmallScreen
      });
    } else {
      return child;
    }
  });
}
