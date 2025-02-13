import { observer } from "mobx-react";
import { FC } from "react";
import Box from "../../../../Styled/Box";
import Icon from "../../../../Styled/Icon";
import MapIconButton from "../../../MapIconButton/MapIconButton";
import { ToolButtonController } from "../../../Tools/Tool";

interface ToolButtonProps {
  controller: ToolButtonController;
}

const ToolButton: FC<ToolButtonProps> = observer((props: ToolButtonProps) => {
  const { controller } = props;

  return (
    <Box displayInlineBlock>
      <MapIconButton
        primary={controller.active}
        expandInPlace
        title={controller.title}
        onClick={() => controller.handleClick()}
        iconElement={() => <Icon glyph={controller.glyph} />}
        closeIconElement={() => <Icon glyph={Icon.GLYPHS.closeTool} />}
      >
        {controller.title}
      </MapIconButton>
    </Box>
  );
});

export default ToolButton;
