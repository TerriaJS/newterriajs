/**
 * The elements specified in this aren't actually ever rendered directly, rather they serve to provide a nice way
 * to define a customised StandardUserInterface - elements are defined in these groups as the children of
 * StandardUserInterface, and StandardUserInterface then looks for the children of these elements, scoops them out
 * and puts them in the correct place.
 */

import { ReactElement } from "react";

/** No-op grouping element for elements that should be added to the menu */
export function Menu({ children }: { children: ReactElement | null }) {
  return children;
}
/** No-op grouping element for elements that should be added to the left menu */
export function MenuLeft({ children }: { children: ReactElement | null }) {
  return children;
}
/** No-op grouping element for elements that should be added to the nav*/
export function Nav({ children }: { children: ReactElement | null }) {
  return children;
}
/** No-op grouping element for elements that should be added to the experimental features*/
export function ExperimentalMenu({ children }: { children: ReactElement | null }) {
  return children;
}
/** No-op grouping element for elements that should be added to the Feedback*/
export function Feedback({ children }: { children: ReactElement | null }) {
  return children;
}
