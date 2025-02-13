import { observer } from "mobx-react";
import { FC, RefObject, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import MouseCoords from "../../../ReactViewModels/MouseCoords";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";

interface ILocationBarProps {
  mouseCoords: MouseCoords;
}

const Section = styled(Box).attrs({
  paddedHorizontally: true
})``;

const StyledText = styled.span`
  font-family: ${(props) => props.theme.fontMono};
  color: ${(props) => props.theme.textLight};
  white-space: nowrap;
  font-size: 0.7rem;
  padding: 0 5px 0 5px;
`;

const setInnerText = (ref: RefObject<HTMLElement>, value: string) => {
  if (ref.current) ref.current.innerText = value;
};

export const LocationBar: FC<ILocationBarProps> = observer(
  ({ mouseCoords }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const elevationRef = useRef<HTMLElement>(null);
    const longitudeRef = useRef<HTMLElement>(null);
    const latitudeRef = useRef<HTMLElement>(null);
    const utmZoneRef = useRef<HTMLElement>(null);
    const eastRef = useRef<HTMLElement>(null);
    const northRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const disposer = mouseCoords.updateEvent.addEventListener(() => {
        setInnerText(elevationRef, mouseCoords.elevation ?? "");
        setInnerText(longitudeRef, mouseCoords.longitude ?? "");
        setInnerText(latitudeRef, mouseCoords.latitude ?? "");
        setInnerText(utmZoneRef, mouseCoords.utmZone ?? "");
        setInnerText(eastRef, mouseCoords.east ?? "");
        setInnerText(northRef, mouseCoords.north ?? "");
      });
      return disposer;
    });

    return (
      <Box
        styledHeight="30px"
        col
        verticalCenter
        css={`
          padding-top: 3px;
          padding-bottom: 3px;
        `}
      >
        <RawButton
          css={`
            display: flex;
            align-items: center;
            height: 100%;
            &:hover {
              background: ${theme.colorPrimary};
            }
          `}
          onClick={mouseCoords.toggleUseProjection}
        >
          {!mouseCoords.useProjection ? (
            <>
              <Section centered>
                <StyledText>{t("legend.lat")}</StyledText>
                <StyledText ref={latitudeRef}>
                  {mouseCoords.latitude}
                </StyledText>
              </Section>
              <Section centered>
                <StyledText>{t("legend.lon")}</StyledText>
                <StyledText ref={longitudeRef}>
                  {mouseCoords.longitude}
                </StyledText>
              </Section>
            </>
          ) : (
            <>
              <Section>
                <StyledText>{t("legend.zone")}</StyledText>
                <StyledText ref={utmZoneRef}>{mouseCoords.utmZone}</StyledText>
              </Section>
              <Section>
                <StyledText>{t("legend.e")}</StyledText>
                <StyledText ref={eastRef}>{mouseCoords.east}</StyledText>
              </Section>
              <Section>
                <StyledText>{t("legend.n")}</StyledText>
                <StyledText ref={northRef}>{mouseCoords.north}</StyledText>
              </Section>
            </>
          )}
          <Section>
            <StyledText>{t("legend.elev")}</StyledText>
            <StyledText ref={elevationRef}>{mouseCoords.elevation}</StyledText>
          </Section>
        </RawButton>
      </Box>
    );
  }
);
