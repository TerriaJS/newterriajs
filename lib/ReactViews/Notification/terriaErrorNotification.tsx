import i18next from "i18next";
import { runInAction } from "mobx";
import React from "react";
import TerriaError from "../../Core/TerriaError";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import { Text } from "../../Styled/Text";
import Collapsible from "../Custom/Collapsible/Collapsible";
import FeedbackLinkCustomComponent, {
  FeedbackLink
} from "../Custom/FeedbackLinkCustomComponent";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";

const ErrorsBox = (props: {
  errors: (Error | TerriaError)[];
  viewState: ViewState;
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
            <TerriaErrorBox error={error} viewState={props.viewState} />
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

const TerriaErrorBox = (props: {
  error: TerriaError;
  viewState: ViewState;
}) => {
  return (
    <>
      <Text
        css={`
          p {
            margin: 5px 0px;
          }
        `}
        textLight
      >
        {parseCustomMarkdownToReact(props.error.message, {
          viewState: props.viewState,
          terria: props.viewState.terria
        })}
      </Text>

      <Spacing bottom={1} />

      {Array.isArray(props.error.originalError) &&
      props.error.originalError.length > 0 ? (
        <ErrorsBox
          errors={props.error.originalError}
          viewState={props.viewState}
        />
      ) : null}
    </>
  );
};

export const terriaErrorNotification = (error: TerriaError) =>
  function TerriaErrorNotification(viewState: ViewState) {
    // Get "detailed" errors - these can be expanded if the user wants to see more "detail"

    let detailedErrors: (Error | TerriaError)[] | undefined;

    // If the top level error is the highestImportanceError, then don't show it in detailedErrors (as it will just duplicate the top level error message)
    if (error.message !== error.highestImportanceError.message) {
      detailedErrors = [error];
    } else if (error.originalError) {
      detailedErrors = Array.isArray(error.originalError)
        ? error.originalError
        : [error.originalError];
    }

    // We only show FeedbackLink if the error message doesn't include the <feedbacklink> custom component (so we don't get duplicates)
    const includesFeedbackLink = error.highestImportanceError.message.includes(
      `<${FeedbackLinkCustomComponent.componentName}`
    );

    return (
      <>
        <Text
          css={`
            p {
              margin: 5px 0px;
            }
            // Fix feedback button color
            button {
              color: ${(p: any) => p.theme.textLight};
            }
          `}
          textLight
        >
          {parseCustomMarkdownToReact(error.highestImportanceError.message, {
            viewState: viewState,
            terria: viewState.terria
          })}
        </Text>
        {/* Show error details if there are more errors to show */}
        {detailedErrors ? (
          <>
            <Spacing bottom={2} />
            <Collapsible
              btnRight
              title={i18next.t("models.raiseError.developerDetails")}
              titleTextProps={{ large: true }}
              bodyBoxProps={{ padded: true }}
              isOpen={error.showDetails}
              onToggle={(show) => {
                runInAction(() => (error.showDetails = show));
                return false;
              }}
            >
              <ErrorsBox errors={detailedErrors} viewState={viewState} />
            </Collapsible>
          </>
        ) : null}
        {!includesFeedbackLink ? <FeedbackLink viewState={viewState} /> : null}
      </>
    );
  };
