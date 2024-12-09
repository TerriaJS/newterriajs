import styled from "styled-components";
import Box from "../../Styled/Box";
import { TOUR_WIDTH } from "./tour-helpers";
// TODO: make relative to app z-index
export const TourExplanationBoxZIndex = 10000;

export const TourExplanationBox = styled(Box)<{ longer?: boolean }>`
  position: absolute;
  width: ${(p) => (p.longer ? `${TOUR_WIDTH + 55}` : `${TOUR_WIDTH}`)}px;
  // background-color: $modal-bg;
  z-index: ${TourExplanationBoxZIndex};
  background: white;
  // color: ${(p) => p.theme.textDarker};

  min-height: 136px;
  border-radius: 4px;

  box-shadow:
    0 6px 6px 0 rgba(0, 0, 0, 0.12),
    0 10px 20px 0 rgba(0, 0, 0, 0.05);

  // extend parseCustomMarkdownToReact() to inject our <Text /> with relevant props to cut down on # of styles?
  // Force styling from markdown?
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    padding: 0;
  }
  h1,
  h2,
  h3 {
    margin-bottom: ${(p) => (p.theme.spacing as any) * 3}px;
    font-size: 16px;
    font-weight: bold;
  }
  h4,
  h5,
  h6 {
    font-size: 15px;
  }

  p {
    margin: 0;
    margin-bottom: ${(p) => p.theme.spacing}px;
  }
  p:last-child {
    margin-bottom: 0;
  }
`;

export default TourExplanationBox;
