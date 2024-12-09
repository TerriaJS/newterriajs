import { observer } from "mobx-react";
import Mustache from "mustache";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useVirtual } from "react-virtual";
import styled from "styled-components";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import { ItemSearchResult } from "../../../Models/ItemSearchProviders/ItemSearchProvider";
import Box from "../../../Styled/Box";
import Button from "../../../Styled/Button";
import parseCustomMarkdownToReact from "../../Custom/parseCustomMarkdownToReact";
import MapEffects, { MapEffect } from "./MapEffects";

export interface SearchResultsProps {
  item: SearchableItemMixin.Instance;
  results: ItemSearchResult[];
  template?: string;
}

type ResultClickHandler = (result: ItemSearchResult) => void;

const SearchResults: React.FC<SearchResultsProps> = (props) => {
  const { item, results } = props;
  const [currentMapEffect, setCurrentMapEffect] = useState<MapEffect>({
    is: "highlightAll"
  });
  const selectedResult =
    currentMapEffect.is === "highlightSingleResult"
      ? currentMapEffect.result
      : undefined;
  const parentRef = useRef<HTMLDivElement>(null);
  const list = useVirtual({
    size: results.length,
    parentRef,
    estimateSize: React.useCallback(() => 50, [])
  });
  const [t] = useTranslation();

  const toggleSelection = (newSelection: MapEffect) => {
    currentMapEffect.is === newSelection.is &&
    (currentMapEffect as any).result === (newSelection as any).result
      ? setCurrentMapEffect({ is: "none" })
      : setCurrentMapEffect(newSelection);
  };

  return (
    <Wrapper>
      <ResultsCount count={results.length} />
      <ActionMenu>
        <ActionButton
          selected={currentMapEffect.is === "highlightAll"}
          onClick={() => toggleSelection({ is: "highlightAll" })}
        >
          {t("itemSearchTool.actions.highlightAll")}
        </ActionButton>
        <ActionButton
          selected={currentMapEffect.is === "showMatchingOnly"}
          onClick={() => toggleSelection({ is: "showMatchingOnly" })}
        >
          {t("itemSearchTool.actions.showMatchingOnly")}
        </ActionButton>
      </ActionMenu>
      <List ref={parentRef} height={`250px`}>
        <ListInner height={`${list.totalSize}px`}>
          {list.virtualItems.map(({ index, ...row }) => (
            <Result
              key={results[index].id}
              result={results[index]}
              isSelected={results[index].id === selectedResult?.id}
              isEven={index % 2 === 0}
              onClick={() =>
                toggleSelection({
                  is: "highlightSingleResult",
                  result: results[index]
                })
              }
              template={props.template}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${row.size}px`,
                transform: `translateY(${row.start}px)`
              }}
            />
          ))}
        </ListInner>
      </List>
      <MapEffects effect={currentMapEffect} item={item} results={results} />
    </Wrapper>
  );
};

type ResultProps = {
  result: ItemSearchResult;
  isSelected: boolean;
  isEven: boolean;
  onClick: ResultClickHandler;
  template?: string;
  style: any;
};

export const Result: React.FC<ResultProps> = observer((props) => {
  const { result, template, isEven, isSelected, style } = props;
  const content = template
    ? parseCustomMarkdownToReact(Mustache.render(template, result.properties))
    : result.id;
  const onClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    try {
      props.onClick(result);
    } finally {
      e.preventDefault();
    }
  };
  return (
    <ClickableItem
      role="button"
      isEven={isEven}
      isSelected={isSelected}
      onClick={onClick}
      style={style}
    >
      {content}
    </ClickableItem>
  );
});

const ClickableItem = styled.a<{ isEven: boolean; isSelected: boolean }>`
  display: block;
  box-sizing: border-box;
  padding: 5px 10px;
  cursor: pointer;
  ${(p) =>
    `background-color: ${
      p.isSelected
        ? p.theme.toolPrimaryColor
        : p.isEven
          ? p.theme.dark
          : p.theme.darkLighter
    };`}
`;

const List = styled.div<{ height: string }>`
  ${(p) => `height: ${p.height}`};
  width: 100%;
  overflow: auto;
`;

const ListInner = styled.div<{ height: string }>`
  ${(p) => `height: ${p.height}`};
  width: 100%;
  position: relative;
`;

const Wrapper = styled(Box).attrs({ column: true, flex: 1 })`
  > :only-child {
    flex: 1;
    align-self: center;
    align-items: center;
  }
`;

export const ResultsCount: React.FC<{ count: number }> = ({ count }) => {
  const [t] = useTranslation();
  return (
    <Box
      css={`
        margin-bottom: 1em;
        ${count === 0 ? "align-self: center;" : ""}
      `}
    >
      {t(`itemSearchTool.resultsCount`, { count })}
    </Box>
  );
};

const ActionButton = styled(Button).attrs((props: { selected: boolean }) => ({
  primary: props.selected,
  secondary: !props.selected,
  textProps: { medium: true }
}))<{ selected: boolean }>`
  min-height: 20px;
  padding: 1em;
  padding-top: 2px;
  padding-bottom: 2px;
  border: 0px;
  border-radius: 5px;
`;

const ActionMenu = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.5em;
  background-color: ${(p) => p.theme.charcoalGrey};

  border-top-left-radius: 5px;
  border-top-right-radius: 5px;

  > ${ActionButton}:first-child {
    margin-right: 1em;
  }
`;

export default SearchResults;
