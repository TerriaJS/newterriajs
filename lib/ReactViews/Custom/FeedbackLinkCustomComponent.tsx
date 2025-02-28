import i18next from "i18next";
import { runInAction } from "mobx";
import { ReactElement } from "react";
import ViewState from "../../ReactViewModels/ViewState";
import { RawButton } from "../../Styled/Button";
import Text from "../../Styled/Text";
import CustomComponent, {
  DomElement,
  ProcessNodeContext
} from "./CustomComponent";
import parseCustomMarkdownToReact from "./parseCustomMarkdownToReact";

function showFeedback(viewState: ViewState) {
  runInAction(() => {
    viewState.feedbackFormIsVisible = true;
    viewState.terria.notificationState.dismissCurrentNotification();
  });
}

export const FeedbackLink = (props: {
  viewState: ViewState;
  /** Override for feedback message */
  feedbackMessage?: string;
  /** Override for email message - this will be shown if feedback isn't available. NOTE: email will be supportEmail to this string automatically */
  emailMessage?: string;
}) =>
  // If we have feedbackUrl = show button to open feedback dialog
  props.viewState.terria.configParameters.feedbackUrl ? (
    <RawButton
      fullWidth
      onClick={() => showFeedback(props.viewState)}
      css={`
        text-align: left;
      `}
    >
      <Text bold>
        {parseCustomMarkdownToReact(
          props.feedbackMessage
            ? props.feedbackMessage
            : i18next.t("models.raiseError.notificationFeedback")
        )}
      </Text>
    </RawButton>
  ) : (
    // If we only have supportEmail - show message and the email address
    <>
      {parseCustomMarkdownToReact(
        props.emailMessage
          ? `${props.emailMessage} ${props.viewState.terria.supportEmail}`
          : i18next.t("models.raiseError.notificationFeedbackEmail", {
              email: props.viewState.terria.supportEmail
            })
      )}
    </>
  );

/**
 * A `<feedbacklink>` custom component, which displays a feedback button (if the feature is enabled), or an email address.
 */
export default class FeedbackLinkCustomComponent extends CustomComponent {
  static componentName = "feedbacklink";

  get name(): string {
    return FeedbackLinkCustomComponent.componentName;
  }

  get attributes(): string[] {
    return ["email-message", "feedback-message"];
  }

  processNode(
    context: ProcessNodeContext,
    node: DomElement,
    _children: ReactElement[]
  ) {
    if (!context.viewState) return undefined;

    return (
      <FeedbackLink
        viewState={context.viewState}
        emailMessage={node.attribs?.["email-message"]}
        feedbackMessage={node.attribs?.["feedback-message"]}
      />
    );
  }
}
