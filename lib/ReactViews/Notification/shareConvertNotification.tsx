import i18next from "i18next";
import { runInAction } from "mobx";
import { Fragment } from "react";
import isDefined from "../../Core/isDefined";
import ViewState from "../../ReactViewModels/ViewState";
import Collapsible from "../Custom/Collapsible/Collapsible";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import Text, { TextSpan } from "../../Styled/Text";
import { RawButton } from "../../Styled/Button";
import Spacing from "../../Styled/Spacing";

export const shareConvertNotification = (
  messages: import("catalog-converter").ShareResult["messages"]
) => (viewState: ViewState) => {
  const messagesForPath: { [path: string]: string[] } = {};
  messages?.forEach((message: any) => {
    let pathString = message.path?.join(": ");
    if (!pathString || pathString === null || pathString === "")
      pathString = "root";
    isDefined(messagesForPath[pathString])
      ? messagesForPath[pathString].push(message.message)
      : (messagesForPath[pathString] = [message.message]);
  });

  const rootMessages = messagesForPath["root"];
  delete messagesForPath["root"];

  const showHelp = () => {
    viewState.showHelpPanel();
    viewState.selectHelpMenuItem("storymigration");
    viewState.terria.notificationState.dismissCurrentNotification();
  };

  const showFeedback = () => {
    runInAction(() => {
      viewState.feedbackFormIsVisible = true;
    });
    viewState.terria.notificationState.dismissCurrentNotification();
  };

  return (
    <Fragment>
      <Text>
        {parseCustomMarkdownToReact(
          i18next.t("share.convertNotificationMessage")
        )}
      </Text>

      <RawButton
        fullWidth
        onClick={showHelp}
        css={`
          text-align: left;
        `}
      >
        <TextSpan textLight bold medium>
          {parseCustomMarkdownToReact(
            i18next.t("share.convertNotificationHelp")
          )}
        </TextSpan>
      </RawButton>

      <RawButton
        fullWidth
        onClick={showFeedback}
        css={`
          text-align: left;
        `}
      >
        <TextSpan textLight bold medium>
          {parseCustomMarkdownToReact(
            i18next.t("share.convertNotificationFeedback")
          )}
        </TextSpan>
      </RawButton>

      <Spacing bottom={2} />

      <Collapsible
        btnRight={true}
        title={i18next.t("share.convertNotificationWarningsTitle")}
        titleTextProps={{ large: true }}
        bodyBoxProps={{ padded: true }}
      >
        {rootMessages && (
          <Fragment>
            <ul>
              {rootMessages.map(message => (
                <li>{message}</li>
              ))}
            </ul>
            <Spacing bottom={1} />
          </Fragment>
        )}

        {Object.entries(messagesForPath).map(([path, messages]) => (
          <Fragment>
            <Spacing bottom={1} />
            <Collapsible
              btnRight={true}
              title={
                path && path !== ""
                  ? path
                  : i18next.t("share.convertNotificationWarningsTitle")
              }
            >
              <ul>
                {messages.map(message => (
                  <li>{message}</li>
                ))}
              </ul>
            </Collapsible>
          </Fragment>
        ))}
      </Collapsible>
    </Fragment>
  );
};
