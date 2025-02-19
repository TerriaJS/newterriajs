import styled from "styled-components";
import { RawButton } from "../../Styled/Button";

const TourIndicator = styled(RawButton)`
  position: absolute;
  top: -10px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: ${(p) => p.theme.colorPrimary};
`;

export default TourIndicator;
