import i18next from "i18next";
import { runInAction } from "mobx";
import TerriaError from "../../Core/TerriaError";
import ViewState from "../../ReactViewModels/ViewState";
import Collapsible from "../Custom/Collapsible/Collapsible";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";

import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import { RawButton } from "../../Styled/Button";
import { Text, TextSpan } from "../../Styled/Text";

const ErrorsBox = (props: {
  errors: (Error | TerriaError)[];
  depth: number;
}) => {
  return (
    <>
      {props.errors.map((error, idx) => (
        <Box
          displayInlineBlock
          css={{
            paddingLeft: "6px",
            borderLeft: "solid 1px rgba(255,255,255,.1)"
          }}
          key={idx}
        >
          {error instanceof TerriaError ? (
            <TerriaErrorBox
              error={error}
              depth={props.depth + 1}
            ></TerriaErrorBox>
          ) : (
            // Show error.message (as well as error.stack) if error.stack is defined
            <div>
              {error.stack ? <pre>{error.message}</pre> : null}
              <pre>{error.stack ?? error.message ?? error.toString()}</pre>
            </div>
          )}
        </Box>
      ))}
    </>
  );
};

const TerriaErrorBox = (props: { error: TerriaError; depth: number }) => {
  return (
    <>
      <Text
        css={`
          p {
            margin: 5px 0px;
          }
        `}
      >
        {parseCustomMarkdownToReact(props.error.message)}
      </Text>

      <Spacing bottom={1} />

      {Array.isArray(props.error.originalError) &&
      props.error.originalError.length > 0 ? (
        props.depth === 0 ? (
          <>
            <Spacing bottom={2} />
            <Collapsible
              btnRight={true}
              title={i18next.t("models.raiseError.developerDetails")}
              titleTextProps={{ large: true }}
              bodyBoxProps={{ padded: true }}
              isOpen={props.error.showDetails}
              onToggle={show => () =>
                runInAction(() => (props.error.showDetails = show))}
            >
              <ErrorsBox
                errors={props.error.originalError}
                depth={props.depth}
              ></ErrorsBox>
            </Collapsible>
          </>
        ) : (
          <ErrorsBox
            errors={props.error.originalError}
            depth={props.depth}
          ></ErrorsBox>
        )
      ) : null}
    </>
  );
};

export const terriaErrorNotification = (error: TerriaError) => (
  viewState: ViewState
) => {
  const showFeedback = () => {
    runInAction(() => {
      viewState.feedbackFormIsVisible = true;
      viewState.terria.notificationState.dismissCurrentNotification();
    });
  };

  return (
    <>
      <TerriaErrorBox error={error} depth={0}></TerriaErrorBox>

      {viewState.terria.configParameters.feedbackUrl ? (
        <RawButton
          fullWidth
          onClick={showFeedback}
          css={`
            text-align: left;
          `}
        >
          <TextSpan textLight bold medium>
            {parseCustomMarkdownToReact(
              i18next.t("models.raiseError.notificationFeedback")
            )}
          </TextSpan>
        </RawButton>
      ) : (
        <Text>
          Please report it by sending an email to{" "}
          {viewState.terria.supportEmail}
        </Text>
      )}
    </>
  );
};
