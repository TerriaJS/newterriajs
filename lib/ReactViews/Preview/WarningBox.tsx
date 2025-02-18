import { runInAction } from "mobx";
import { FC } from "react";
import TerriaError from "../../Core/TerriaError";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Spacing from "../../Styled/Spacing";
import { TextSpan } from "../../Styled/Text";
import FeedbackLinkCustomComponent, {
  FeedbackLink
} from "../Custom/FeedbackLinkCustomComponent";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";

// Hard code colour for now
const warningColor = "#f69900";

const showErrorNotification = (viewState: ViewState, error: TerriaError) => {
  runInAction(() => {
    error.showDetails = true;
  });
  viewState.terria.raiseErrorToUser(error, undefined, true);
};

const WarningBox: FC<
  React.PropsWithChildren<{
    error?: TerriaError;
    viewState?: ViewState;
  }>
> = (props) => {
  // We only show FeedbankLink if the error message doesn't include the <feedbacklink> custom component (so we don't get duplicates)
  const includesFeedbackLink =
    props.error?.highestImportanceError.message.includes(
      `<${FeedbackLinkCustomComponent.componentName}`
    );

  return (
    <Box backgroundColor={warningColor} rounded padded>
      <Spacing right={1} />
      <WarningIcon />
      <Spacing right={2} />
      <Box backgroundColor="#ffffff" rounded fullWidth paddedRatio={3}>
        {props.error ? (
          <div>
            {parseCustomMarkdownToReact(
              `### ${props.error?.highestImportanceError?.title}`
            )}
            {parseCustomMarkdownToReact(
              props.error?.highestImportanceError?.message,
              { viewState: props.viewState, terria: props.viewState?.terria }
            )}

            {props.viewState && !includesFeedbackLink ? (
              <FeedbackLink viewState={props.viewState} />
            ) : null}

            {/* Add "show details" button if there are nested errors */}
            {props.viewState &&
            Array.isArray(props.error!.originalError) &&
            props.error!.originalError.length > 0 ? (
              <div>
                <RawButton
                  activeStyles
                  onClick={() =>
                    showErrorNotification(props.viewState!, props.error!)
                  }
                >
                  <TextSpan primary>See details</TextSpan>
                </RawButton>
              </div>
            ) : null}
          </div>
        ) : (
          props.children
        )}
      </Box>
    </Box>
  );
};

// Equilateral triangle
const WarningIcon = () => (
  <p
    css={`
      width: 0px;
      height: 0px;
      text-indent: -2px;
      border-left: 12px solid transparent;
      border-right: 12px solid transparent;
      border-bottom: 20px solid white;
      font-weight: bold;
      line-height: 25px;
      user-select: none;
    `}
  >
    !
  </p>
);

export default WarningBox;
