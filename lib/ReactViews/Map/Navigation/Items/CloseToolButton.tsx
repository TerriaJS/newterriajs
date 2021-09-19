import { withTranslation, WithTranslation } from "react-i18next";
import ViewState from "../../../../ReactViewModels/ViewState";
import Icon from "../../../../Styled/Icon";
import MapIconButton from "../../../MapIconButton/MapIconButton";

interface PropsType extends WithTranslation {
  viewState: ViewState;
  t: any;
}

function CloseToolButton({ viewState, t }: PropsType) {
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
}

export default withTranslation()(CloseToolButton);
