import { FC } from "react";
import { useTranslation } from "react-i18next";
import Icon from "../../../../Styled/Icon";
import { useViewState } from "../../../Context";
import MapIconButton from "../../../MapIconButton/MapIconButton";

export const CloseToolButton: FC<React.PropsWithChildren<unknown>> = () => {
  const { t } = useTranslation();
  const viewState = useViewState();
  const closeText = t("tool.closeButtonTitle", {
    toolName: viewState.currentTool?.toolName
  });
  const toolIsDifference = viewState.currentTool?.toolName === "Difference";
  return (
    <MapIconButton
      css={`
        svg {
          width: 13px;
          height: 13px;
        }
      `}
      title={closeText}
      splitter={toolIsDifference}
      expandInPlace
      iconElement={() => <Icon glyph={Icon.GLYPHS.closeLight} />}
      onClick={() => viewState.closeTool()}
    >
      {closeText}
    </MapIconButton>
  );
};
