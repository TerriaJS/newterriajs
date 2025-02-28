import i18next from "i18next";
import { runInAction } from "mobx";
import isDefined from "../../Core/isDefined";
import ViewState from "../../ReactViewModels/ViewState";
import Collapsible from "../Custom/Collapsible/Collapsible";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import Text, { TextSpan } from "../../Styled/Text";
import { RawButton } from "../../Styled/Button";
import Spacing from "../../Styled/Spacing";

export const shareConvertNotification = (
  messages: import("catalog-converter").ShareResult["messages"]
) =>
  function shareConvertNotification(viewState: ViewState) {
    const messagesForPath: { [path: string]: string[] } = {};
    messages?.forEach((message: any) => {
      let pathString = message.path?.join(": ");
      if (!pathString || pathString === null || pathString === "")
        pathString = "root";
      if (isDefined(messagesForPath[pathString])) {
        messagesForPath[pathString].push(message.message);
      } else {
        messagesForPath[pathString] = [message.message];
      }
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
      <>
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
          btnRight
          title={i18next.t("share.convertNotificationWarningsTitle")}
          titleTextProps={{ large: true }}
          bodyBoxProps={{ padded: true }}
        >
          {rootMessages && (
            <>
              <ul>
                {rootMessages.map((message, i) => (
                  <li key={i}>{message}</li>
                ))}
              </ul>
              <Spacing bottom={1} />
            </>
          )}

          {Object.entries(messagesForPath).map(([path, messages]) => (
            <>
              <Spacing bottom={1} />
              <Collapsible
                btnRight
                title={
                  path && path !== ""
                    ? path
                    : i18next.t("share.convertNotificationWarningsTitle")
                }
              >
                <ul>
                  {messages.map((message, i) => (
                    <li key={i}>{message}</li>
                  ))}
                </ul>
              </Collapsible>
            </>
          ))}
        </Collapsible>
      </>
    );
  };
