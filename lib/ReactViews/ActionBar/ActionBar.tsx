import { FC, useEffect } from "react";
import styled from "styled-components";
import Box from "../../Styled/Box";
import { PortalChild } from "../StandardUserInterface/Portal";
import { useViewState } from "../Context";
import { ActionBarPortalId } from "./ActionBarPortal";

/**
 * Creates a floating menu at the bottom of the map.
 *
 * {@link ActionButton} can be used as a themed button for the action bar
 * {@link ActionButtonGroup} can be used for grouping elements inside an action bar
 */
export const ActionBar: FC<React.PropsWithChildren<object>> = (props) => {
  const viewState = useViewState();

  useEffect(function setVisibility() {
    viewState.setActionBarVisible(true);
    return () => {
      viewState.setActionBarVisible(false);
    };
  });

  return viewState.useSmallScreenInterface ? null : (
    <PortalChild viewState={viewState} portalId={ActionBarPortalId}>
      <ActionBarInner>{props.children}</ActionBarInner>
    </PortalChild>
  );
};

const ActionBarInner = styled(Box).attrs({
  centered: true,
  fullHeight: true
})`
  margin: auto;
  background-color: ${(props) => props.theme.dark};
  border-radius: 6px;
`;
