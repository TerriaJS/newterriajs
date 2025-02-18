import {
  ReactNode,
  FC,
  MouseEvent,
  AnchorHTMLAttributes,
  default as React
} from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useViewState } from "../Context";
import Icon, { StyledIcon } from "../../Styled/Icon";

interface Props {
  attributes: AnchorHTMLAttributes<HTMLAnchorElement>;
  children: ReactNode;
}

export const ExternalLinkWithWarning: FC<
  React.PropsWithChildren<Props>
> = (props: {
  attributes: AnchorHTMLAttributes<HTMLAnchorElement>;
  children: ReactNode;
}) => {
  const viewState = useViewState();
  const { t } = useTranslation();

  const onClick = (evt: MouseEvent) => {
    evt.stopPropagation();
    evt.preventDefault();
    viewState.terria.notificationState.addNotificationToQueue({
      title: t("core.unverifiedExternalLink.title"),
      message: t("core.unverifiedExternalLink.message", {
        url: props.attributes.href
      }),
      confirmText: t("core.unverifiedExternalLink.confirmText"),
      denyText: t("core.unverifiedExternalLink.denyText"),
      confirmAction: () => window.open(props.attributes.href, "_blank")?.focus()
    });
  };

  if (!props.attributes.href) {
    return <a {...props.attributes}>{props.children}</a>;
  }

  return (
    <a {...props.attributes} onClick={onClick}>
      {props.children}
    </a>
  );
};

export const ExternalLinkIcon = styled(StyledIcon).attrs({
  glyph: Icon.GLYPHS.externalLink,
  styledWidth: "10px",
  styledHeight: "10px",
  displayInline: true
})`
  margin-left: 5px;
  fill: currentColor;
`;
