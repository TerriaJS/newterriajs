import i18next from "i18next";
import { runInAction } from "mobx";
import { FC } from "react";
import TerriaError from "../../Core/TerriaError";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Spacing from "../../Styled/Spacing";
import { TextSpan } from "../../Styled/Text";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";

// Hard code colour for now
const warningColor = "#f69900";

const showFeedback = (viewState: ViewState) => {
  runInAction(() => {
    viewState.feedbackFormIsVisible = true;
    viewState.terria.notificationState.dismissCurrentNotification();
  });
};

const showErrorNotification = (viewState: ViewState, error: TerriaError) => {
  runInAction(() => {
    error.showDetails = true;
  });
  viewState.terria.raiseErrorToUser(error, undefined, true);
};

const WarningBox: FC<{
  error?: TerriaError;
  viewState?: ViewState;
}> = props => (
  <Box backgroundColor={warningColor} rounded padded>
    <Spacing right={1} />
    <WarningIcon />
    <Spacing right={2} />
    <Box backgroundColor="#ffffff" rounded fullWidth paddedRatio={3}>
      {props.error ? (
        <div>
          {parseCustomMarkdownToReact(`### ${props.error.title}`)}
          {parseCustomMarkdownToReact(props.error.message)}

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
          <RawButton
            activeStyles
            onClick={() => showFeedback(props.viewState!)}
          >
            <TextSpan primary>
              {parseCustomMarkdownToReact(
                i18next.t("models.raiseError.notificationFeedback")
              )}
            </TextSpan>
          </RawButton>
        </div>
      ) : (
        props.children
      )}
    </Box>
  </Box>
);

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
