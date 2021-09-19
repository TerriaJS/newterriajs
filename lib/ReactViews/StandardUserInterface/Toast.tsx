import { ReactNode, FC } from "react";
import styled from "styled-components";

export type ToastProps = {
  children: ReactNode;
};

/**
 * A toast component that positions its children bottom center of the map
 */
const Toast: FC<ToastProps> = ({ children }) => {
  return <Container>{children}</Container>;
};

const Container = styled.div`
  position: absolute;
  bottom: 40px;
  left: 20px; // on mobile
  @media (min-width: ${props => props.theme.sm}px) {
    left: 45%; // on larger screens
  }

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0 7px;

  border-radius: 16px;
  min-height: 32px;
  background: ${p => p.theme.textLight};
`;

export default Toast;
