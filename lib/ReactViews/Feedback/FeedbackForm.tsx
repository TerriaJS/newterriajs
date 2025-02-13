import { runInAction } from "mobx";
import { observer } from "mobx-react";
import {
  ChangeEvent,
  FormEvent,
  FC,
  ReactNode,
  Component,
  Children,
  isValidElement,
  cloneElement,
  useEffect,
  useRef
} from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { useUID } from "react-uid";
import styled, { DefaultTheme, withTheme } from "styled-components";
import sendFeedback from "../../Models/sendFeedback";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import Button, { RawButton } from "../../Styled/Button";
import Checkbox from "../../Styled/Checkbox";
import { GLYPHS, StyledIcon } from "../../Styled/Icon";
import Input, { StyledTextArea } from "../../Styled/Input";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import parseCustomMarkdownToReact, {
  parseCustomMarkdownToReactWithOptions
} from "../Custom/parseCustomMarkdownToReact";
import { WithViewState, withViewState } from "../Context";
import { applyTranslationIfExists } from "../../Language/languageHelpers";

interface IProps extends WithTranslation, WithViewState {
  theme: DefaultTheme;
}

interface IState {
  name: string;
  email: string;
  comment: string;
  isSending: boolean;
  sendShareURL: boolean;
  commentIsValid: boolean;
}

@observer
class FeedbackForm extends Component<IProps, IState> {
  static displayName = "FeedbackForm";

  state: IState = {
    isSending: false,
    sendShareURL: true,
    name: "",
    email: "",
    comment: "",
    commentIsValid: false
  };
  escKeyListener: (e: any) => void;

  constructor(props: IProps) {
    super(props);
    this.escKeyListener = (e) => {
      if (e.keyCode === 27) {
        this.onDismiss();
      }
    };
    this.onDismiss = this.onDismiss.bind(this);
    this.updateName = this.updateName.bind(this);
    this.updateEmail = this.updateEmail.bind(this);
    this.updateComment = this.updateComment.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.changeSendShareUrl = this.changeSendShareUrl.bind(this);
  }

  getInitialState() {
    return {
      isSending: false,
      sendShareURL: true,
      name: "",
      email: "",
      comment: ""
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.escKeyListener, true);
    this.setState({
      commentIsValid:
        this.props.viewState.terria.configParameters.feedbackMinLength === 0
    });
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.escKeyListener, true);
  }

  resetState() {
    this.setState(this.getInitialState());
  }

  onDismiss() {
    runInAction(() => {
      this.props.viewState.feedbackFormIsVisible = false;
    });
    this.resetState();
  }

  updateName(e: ChangeEvent<HTMLInputElement>) {
    this.setState({
      name: e.target.value
    });
  }

  updateEmail(e: ChangeEvent<HTMLInputElement>) {
    this.setState({
      email: e.target.value
    });
  }

  updateComment(e: ChangeEvent<HTMLTextAreaElement>) {
    this.setState({
      comment: e.target.value
    });
    if (
      this.state.comment.replace(/\s+/g, " ").length >=
      this.props.viewState.terria.configParameters.feedbackMinLength!
    ) {
      this.setState({
        commentIsValid: true
      });
    } else {
      this.setState({
        commentIsValid: false
      });
    }
  }

  changeSendShareUrl(_e: ChangeEvent<HTMLInputElement>) {
    this.setState((prevState: IState) => ({
      sendShareURL: !prevState.sendShareURL
    }));
  }

  onSubmit(e: FormEvent<HTMLFormElement | HTMLDivElement>) {
    e.preventDefault();

    if (
      this.state.comment.length >=
      this.props.viewState.terria.configParameters.feedbackMinLength!
    ) {
      this.setState({
        isSending: true
      });
      sendFeedback({
        terria: this.props.viewState.terria,
        name: this.state.name,
        email: this.state.email,
        sendShareURL: this.state.sendShareURL,
        comment: this.state.comment
      })!.then((succeeded: boolean) => {
        if (succeeded) {
          this.setState({
            isSending: false,
            comment: ""
          });
          runInAction(() => {
            this.props.viewState.feedbackFormIsVisible = false;
          });
        } else {
          this.setState({
            isSending: false
          });
        }
      });
    }
  }

  render() {
    const { t, i18n, viewState, theme } = this.props;
    const preamble = parseCustomMarkdownToReact(
      applyTranslationIfExists(
        viewState.terria.configParameters.feedbackPreamble ||
          "translate#feedback.feedbackPreamble",
        i18n
      )
    );
    const postamble = viewState.terria.configParameters.feedbackPostamble
      ? parseCustomMarkdownToReact(
          applyTranslationIfExists(
            viewState.terria.configParameters.feedbackPostamble,
            i18n
          )
        )
      : undefined;
    return (
      <FormWrapper>
        <Box backgroundColor={theme.darkLighter} paddedRatio={2}>
          <Text
            textLight
            textAlignCenter
            semiBold
            as="h4"
            fullWidth
            css={`
              margin: 0;
            `}
          >
            {t("feedback.title")}
          </Text>
          <RawButton onClick={this.onDismiss} title={t("feedback.close")}>
            <StyledIcon styledWidth={"15px"} light glyph={GLYPHS.close} />
          </RawButton>
        </Box>
        <Form paddedRatio={2} onSubmit={this.onSubmit.bind(this)} column>
          <Text textDarker>{preamble}</Text>
          <StyledLabel
            viewState={viewState}
            textProps={{
              textDarker: true
            }}
            label={t("feedback.yourName")}
            spacingBottom
          >
            <Input
              styledHeight={"34px"}
              white
              fieldBorder={theme.greyLighter}
              border
              id="name"
              type="text"
              name="name"
              value={this.state.name}
              onChange={this.updateName}
              autoComplete="off"
            />
          </StyledLabel>
          <StyledLabel
            viewState={viewState}
            textProps={{
              textDarker: true
            }}
            label={t("feedback.email")}
            spacingBottom
          >
            <Input
              styledHeight={"34px"}
              white
              fieldBorder={theme.greyLighter}
              border
              id="email"
              type="text"
              name="email"
              value={this.state.email}
              onChange={this.updateEmail}
              autoComplete="off"
            />
          </StyledLabel>
          <StyledLabel
            viewState={viewState}
            textProps={{
              textDarker: true
            }}
            label={t("feedback.commentQuestion")}
            spacingBottom
          >
            <TextArea
              lineHeight={"22px"}
              styledMinHeight={"56px"}
              styledMaxHeight={"120px"}
              white
              fieldBorder={theme.greyLighter}
              border
              name="comment"
              value={this.state.comment}
              valueIsValid={this.state.commentIsValid}
              onChange={this.updateComment}
              autoComplete="off"
            />
            {!this.state.commentIsValid && (
              <WarningText>
                {t("feedback.minLength", {
                  minLength: viewState.terria.configParameters.feedbackMinLength
                })}
              </WarningText>
            )}
          </StyledLabel>
          <Checkbox
            isChecked={this.state.sendShareURL}
            value="sendShareUrl"
            onChange={this.changeSendShareUrl}
          >
            <Text>
              {
                t("feedback.shareWithDevelopers", {
                  appName: this.props.viewState.terria.appName
                })!
              }
            </Text>
          </Checkbox>
          <Spacing bottom={2} />
          {postamble ? <Text textDarker>{postamble}</Text> : null}
          <Box right>
            <Button
              type="button"
              denyButton
              rounded
              shortMinHeight
              styledMinWidth={"80px"}
              onClick={this.onDismiss}
            >
              {t("feedback.cancel")}
            </Button>
            <Spacing right={1} />
            <Button
              type="submit"
              primary
              shortMinHeight
              styledMinWidth={"80px"}
              disabled={
                this.state.comment.length <
                  viewState.terria.configParameters.feedbackMinLength! ||
                this.state.isSending
              }
            >
              {this.state.isSending
                ? t("feedback.sending")
                : t("feedback.send")}
            </Button>
          </Box>
        </Form>
      </FormWrapper>
    );
  }
}

const WarningText = styled(Text)`
  color: red;
`;

interface TextAreaProps {
  value: string;
  valueIsValid: boolean;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  styledMinHeight: string;
  styledMaxHeight?: string;
  [spread: string]: any;
}

const TextArea: FC<TextAreaProps> = (props: TextAreaProps) => {
  const {
    value,
    onChange,
    styledMaxHeight,
    styledMinHeight,
    valueIsValid,
    ...rest
  } = props;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current!.style.setProperty(
      "height",
      `${textAreaRef.current!.scrollHeight + 2}px`
    );
  }, [value]);

  return (
    <StyledTextArea
      {...rest}
      ref={textAreaRef}
      rows={1}
      styledHeight={styledMinHeight}
      styledMinHeight={styledMinHeight}
      styledMaxHeight={styledMaxHeight}
      onChange={(event) => {
        textAreaRef.current!.style.setProperty("height", "auto");

        if (props.onChange) {
          props.onChange(event);
        }
      }}
      invalidValue={!valueIsValid}
    />
  );
};

interface StyledLabelProps {
  viewState: ViewState;
  label: string;
  textProps?: any;
  children: ReactNode;
  spacingBottom?: boolean;
}

const StyledLabel: FC<StyledLabelProps> = (props: StyledLabelProps) => {
  const { viewState, label, textProps } = props;
  const id = useUID();
  const childrenWithId = Children.map(props.children, (child) => {
    // checking isValidElement is the safe way and avoids a typescript error too
    if (isValidElement(child)) {
      return cloneElement(child, { id: id } as any);
    }
    return child;
  });

  return (
    <Box column>
      {label && (
        <Text as={"label"} htmlFor={id} css={"p {margin: 0;}"} {...textProps}>
          {parseCustomMarkdownToReactWithOptions(`${label}:`, {
            injectTermsAsTooltips: true,
            tooltipTerms: viewState.terria.configParameters.helpContentTerms
          })}
        </Text>
      )}
      {childrenWithId}
      {props.spacingBottom && <Spacing bottom={2} />}
    </Box>
  );
};

const Form = styled(Box).attrs({
  overflowY: "auto",
  scroll: true,
  as: "form"
})``;

const FormWrapper = styled(Box).attrs((props) => ({
  column: true,
  position: "absolute",
  styledMaxHeight: "60vh",
  styledMaxWidth: "400px",
  styledWidth: "350px",
  backgroundColor: props.theme.textLight
}))`
  z-index: ${(props) => props.theme.notificationWindowZIndex};
  border-radius: 5px;
  @media (min-width: ${(props) => props.theme.sm}px) {
    bottom: 75px;
    right: 20px;
    //max-height: 60vh;
  }
  @media (max-width: ${(props) => props.theme.sm}px) {
    right: 0;
    top: 50px;
    left: 0;
    max-height: calc(100vh - 50px);
    min-width: 100%;
  }
`;

export default withTranslation()(withViewState(withTheme(FeedbackForm)));
