import { useEffect, useState } from "react";
import styled from "styled-components";
import Button from "../../../../../Styled/Button";
import { downloadImg } from "./PrintView";

interface Props {
  window: Window;
  screenshot: Promise<string> | null;
}

const ButtonBar = styled.section`
  display: flex;
  justify-content: flex-end;
`;

const PrintViewButtons = (props: Props) => {
  const [isDisabled, setDisabled] = useState(true);

  useEffect(() => {
    props.screenshot?.then(() => setDisabled(false));
  }, [props.screenshot]);

  return (
    <ButtonBar>
      <Button
        primary
        disabled={isDisabled}
        onClick={(evt: MouseEvent) => {
          evt.preventDefault();
          props.screenshot?.then(downloadImg);
        }}
      >
        Download map
      </Button>
      <Button
        primary
        disabled={isDisabled}
        marginLeft={1}
        onClick={(evt: MouseEvent) => {
          evt.preventDefault();
          props.window.print();
        }}
      >
        Print
      </Button>
    </ButtonBar>
  );
};

export default PrintViewButtons;
