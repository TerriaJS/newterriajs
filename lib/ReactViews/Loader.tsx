import { TFunction } from "i18next";
import { FC } from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import Box from "../Styled/Box";
import { TextSpan } from "../Styled/Text";
import AnimatedSpinnerIcon from "../Styled/AnimatedSpinnerIcon";

interface PropsType extends WithTranslation {
  message?: string;
  boxProps?: any;
  textProps?: any;
  t: TFunction;
  [spread: string]: any;
}
const Loader: FC<PropsType> = (props: PropsType) => {
  const { message, t, boxProps, textProps, ...rest }: PropsType = props;
  return (
    <Box fullWidth centered {...boxProps}>
      <AnimatedSpinnerIcon styledWidth={"15px"} css={"margin: 5px"} {...rest} />
      <TextSpan {...textProps}>
        {message || t("loader.loadingMessage")}
      </TextSpan>
    </Box>
  );
};

export default withTranslation()(Loader);
