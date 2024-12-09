import React from "react";
import { Story } from "../Story";
import parseCustomHtmlToReact from "../../Custom/parseCustomHtmlToReact";
import styled from "styled-components";
import Box from "../../../Styled/Box";
import Text from "../../../Styled/Text";

const StoryContainer = styled(Box).attrs((props: { isCollapsed: boolean }) => ({
  paddedVertically: props.isCollapsed ? 0 : 2,
  scroll: true
}))<{ isCollapsed: boolean }>`
  padding-top: 0;
  max-height: ${(props) => (props.isCollapsed ? 0 : "100px")};
  @media (min-height: 700px) {
    max-height: ${(props) => (props.isCollapsed ? 0 : "200px")};
  }
  @media (min-height: 900px) {
    max-height: ${(props) => (props.isCollapsed ? 0 : "400px")};
  }

  overflow-y: auto;

  transition:
    max-height 0.2s,
    padding 0.2s;

  img {
    max-width: 100%;
  }
  * {
    max-width: 100%;
    //These are technically the same, but use both
    overflow-wrap: break-word;
    word-wrap: break-word;

    -ms-word-break: break-all;
    // This is the dangerous one in WebKit, as it breaks things wherever
    word-break: break-all;
    // Instead use this non-standard one:
    word-break: break-word;

    // Adds a hyphen where the word breaks, if supported (No Blink)
    -ms-hyphens: auto;
    -moz-hyphens: auto;
    -webkit-hyphens: auto;
    hyphens: auto;
  }
`;

function shouldAddIframeTag(story: Story) {
  const parser = new DOMParser();
  const parsedDocument = parser.parseFromString(story.text, "text/html");
  const iframes = parsedDocument.getElementsByTagName("iframe");
  if (iframes.length < 1) return false;
  let result = true;
  for (const iframe of iframes) {
    if (
      !(
        iframe.src?.startsWith("https://www.youtube.com/embed/") ||
        iframe.src?.startsWith("https://www.youtube-nocookie.com/embed/") ||
        iframe.src?.startsWith("https://player.vimeo.com/video/")
      )
    ) {
      result = false;
      break;
    }
  }
  return result;
}

function sourceBasedParse(story: Story) {
  if (shouldAddIframeTag(story)) {
    return parseCustomHtmlToReact(
      story.text,
      { showExternalLinkWarning: true },
      false,
      {
        ADD_TAGS: ["iframe"]
      }
    );
  } else {
    return parseCustomHtmlToReact(
      story.text,
      { showExternalLinkWarning: true },
      false,
      {}
    );
  }
}

const StoryBody = ({
  isCollapsed,
  story
}: {
  isCollapsed: boolean;
  story: Story;
}) =>
  story.text && story.text !== "" ? (
    <StoryContainer isCollapsed={isCollapsed} column>
      <Text
        css={`
          display: flex;
          flex-direction: column;
          gap: 5px;
        `}
        medium
      >
        {sourceBasedParse(story)}
      </Text>
    </StoryContainer>
  ) : null;

export default StoryBody;
