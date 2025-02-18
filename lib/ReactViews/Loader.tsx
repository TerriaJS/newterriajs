import { FC } from "react";
import { withTranslation, WithTranslation, TFunction } from "react-i18next";
import Box from "../Styled/Box";
import { TextSpan } from "../Styled/Text";
import AnimatedSpinnerIcon from "../Styled/AnimatedSpinnerIcon";

interface PropsType extends WithTranslation {
  message?: string;
  boxProps?: any;
  textProps?: any;
  hideMessage?: boolean;
  t: TFunction;
  [spread: string]: any;
}
const Loader: FC<React.PropsWithChildren<PropsType>> = (props: PropsType) => {
  const { message, t, boxProps, textProps, hideMessage, ...rest }: PropsType =
    props;
  return (
    <Box fullWidth centered {...boxProps}>
      <AnimatedSpinnerIcon styledWidth={"15px"} css={"margin: 5px"} {...rest} />
      <TextSpan {...textProps}>
        {!hideMessage && (message || t("loader.loadingMessage"))}
      </TextSpan>
    </Box>
  );
};

export default withTranslation()(Loader);
