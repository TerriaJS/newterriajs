import clipboard from "clipboard";
import { ReactElement, FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "../Styled/Box";
import Button from "../Styled/Button";
import { verticalAlign } from "../Styled/mixins";
import Spacing from "../Styled/Spacing";
import Icon, { StyledIcon } from "../Styled/Icon";

enum CopyStatus {
  Success,
  Error,
  NotCopiedOrWaiting // Copy button hasn't been clicked or clipboard.js hasn't copied the data yet
}

interface ClipboardProps {
  id: string;
  source: ReactElement;
  theme: "dark" | "light";
  rounded?: boolean;
  text?: string;
  onCopy?: (contents: string) => void;
}

const Clipboard: FC<ClipboardProps> = (props) => {
  const { id, source, theme, rounded } = props;
  const { t } = useTranslation();
  const [status, setStatus] = useState<CopyStatus>(
    CopyStatus.NotCopiedOrWaiting
  );
  useEffect(() => {
    // Setup clipboard.js and show a tooltip on copy success or error for 3s
    const clipboardBtn = new clipboard(`.btn-copy-${id}`);
    let timerId: ReturnType<typeof setTimeout> | null = null;
    function removeTimeout() {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    }
    function resetTooltipLater() {
      removeTimeout();
      timerId = setTimeout(() => {
        setStatus(CopyStatus.NotCopiedOrWaiting);
      }, 3000);
    }
    clipboardBtn.on("success", (evt) => {
      props.onCopy?.(evt.text);
      setStatus(CopyStatus.Success);
      resetTooltipLater();
    });
    clipboardBtn.on("error", () => {
      setStatus(CopyStatus.Error);
      resetTooltipLater();
    });
    return function cleanup() {
      removeTimeout();
      clipboardBtn.destroy();
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id]);

  const isLightTheme = theme === "light";
  return (
    <ClipboardDiv>
      <Box>
        {source}
        <Button
          primary
          css={`
            width: 80px;
            border-radius: 2px;
            ${rounded && `border-radius:  0 32px 32px 0;`}
          `}
          className={`btn-copy-${id}`}
          data-clipboard-target={`#${id}`}
          textProps={{ large: true }}
        >
          {t("clipboard.copy")}
        </Button>
      </Box>
      {status !== CopyStatus.NotCopiedOrWaiting && (
        <>
          <Spacing bottom={2} />
          <Box
            css={`
              line-height: 10px;
            `}
          >
            <StyledIcon
              light={!isLightTheme}
              realDark={isLightTheme}
              glyph={
                status === CopyStatus.Success
                  ? Icon.GLYPHS.selected
                  : Icon.GLYPHS.close
              }
              styledWidth="20px"
              css={`
                margin: 8px;
                margin-left: 0;
                display: inline-block;
              `}
            />
            <TooltipText>
              {status === CopyStatus.Success
                ? t("clipboard.success")
                : t("clipboard.unsuccessful")}
            </TooltipText>
          </Box>
        </>
      )}
    </ClipboardDiv>
  );
};

export default Clipboard;

const ClipboardDiv = styled.div`
  position: relative;
`;

const TooltipText = styled.span`
  ${verticalAlign("absolute")}
  left: 30px;
`;
