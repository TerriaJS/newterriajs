import type { ReactElement } from "react";
import { createRenderer } from "react-test-renderer/shallow";
import { findAll } from "react-shallow-testutils";

export function getRenderedRenderer(jsx: ReactElement) {
  const renderer = createRenderer();
  renderer.render(jsx);
  return renderer;
}

export function getShallowRenderedOutput(jsx: ReactElement) {
  const renderer = getRenderedRenderer(jsx);
  return renderer.getRenderOutput();
}

export function getMountedInstance(jsx: ReactElement) {
  const renderer = getRenderedRenderer(jsx);
  return renderer.getMountedInstance();
}

export function findAllEqualTo(reactElement: ReactElement, text: ReactElement) {
  return findAll(
    reactElement,
    (element: ReactElement) => element && element === text
  );
}

export function findAllWithPropsChildEqualTo(
  reactElement: ReactElement,
  text: ReactElement
) {
  // Returns elements with element.props.children[i] or element.props.children[i][j] equal to text, for any i or j.
  return findAll(reactElement, (element: ReactElement) => {
    if (!(element && element.props && element.props.children)) {
      return;
    }
    return (
      (element.props.children.indexOf &&
        element.props.children.indexOf(text) >= 0) ||
      (element.props.children.some &&
        element.props.children.some(
          (x: any) => x && x.length && x.indexOf(text) >= 0
        ))
    );
  });
}
