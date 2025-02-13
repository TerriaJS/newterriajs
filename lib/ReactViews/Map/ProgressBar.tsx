import { observer } from "mobx-react";
import { VFC, useCallback, useEffect, useState } from "react";
import styled, { css, keyframes, useTheme } from "styled-components";
import EventHelper from "terriajs-cesium/Source/Core/EventHelper";
import { useViewState } from "../Context";

export const ProgressBar: VFC = observer(() => {
  const [loadPercentage, setLoadPercentage] = useState(0);
  const [indeterminateLoading, setIndeterminateLoading] = useState<any>();

  const theme = useTheme();
  const { terria } = useViewState();

  const setProgress = useCallback((remaining: number, max: number) => {
    const rawPercentage = (1 - remaining / max) * 100;
    const sanitisedPercentage = Math.floor(remaining > 0 ? rawPercentage : 100);
    setLoadPercentage(sanitisedPercentage);
  }, []);

  const setMode = (mode: boolean) => {
    setIndeterminateLoading(mode);
  };

  useEffect(() => {
    const eventHelper = new EventHelper();

    eventHelper.add(terria.tileLoadProgressEvent, setProgress);

    eventHelper.add(terria.indeterminateTileLoadProgressEvent, setMode);

    return () => {
      eventHelper.removeAll();
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const backgroundColor =
    terria.baseMapContrastColor === "#ffffff" ? "#ffffff" : theme.colorPrimary;

  const allComplete = loadPercentage === 100 && !indeterminateLoading;

  return (
    <StyledProgressBar
      complete={allComplete}
      indeterminate={indeterminateLoading}
      backgroundColor={backgroundColor}
      loadPercentage={`${loadPercentage}%`}
    />
  );
});

interface IStyledProgressBarProps {
  loadPercentage: string;
  complete: boolean;
  indeterminate: boolean;
  backgroundColor: string;
}

const StyledProgressBar = styled.div<IStyledProgressBarProps>`
  height: 5px;
  overflow: hidden;
  transition: opacity 200ms linear, width 200ms linear, visibility 400ms linear;
  background-color: ${(props) => props.backgroundColor};
  width: ${(props) => props.loadPercentage};

  ${(props) => props.complete && `visibility: hidden;`}

  ${(props) =>
    props.indeterminate &&
    css`
      width: 100%;
      animation: ${indeterminateAnimation} 1.2s infinite linear;
      transform-origin: 0% 50%;
    `}
`;

const indeterminateAnimation = keyframes`
  0% {
    transform: translateX(0) scaleX(0);
  }
  40% {
    transform: translateX(0) scaleX(0.4);
  }
  100% {
    transform: translateX(100%) scaleX(0.5);
  }
}`;
