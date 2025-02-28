import { FC, useEffect } from "react";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import { ItemSearchResult } from "../../../Models/ItemSearchProviders/ItemSearchProvider";

export type MapEffect =
  | { is: "none" }
  | { is: "highlightAll" }
  | { is: "showMatchingOnly" }
  | { is: "highlightSingleResult"; result: ItemSearchResult };

export type MapEffectsProps = {
  effect: MapEffect;
  item: SearchableItemMixin.Instance;
  results: ItemSearchResult[];
};

/**
 * A component that applies some effect on the map.
 *
 */
const MapEffects: FC<MapEffectsProps> = ({ item, results, effect }) => {
  switch (effect.is) {
    case "highlightAll":
      return <HighlightResults item={item} results={results} />;
    case "highlightSingleResult":
      return <HighlightResults item={item} results={effect.result} />;
    case "showMatchingOnly":
      return <HideAllResults item={item} results={results} />;
    case "none":
      return null;
  }
};

export default MapEffects;

export type HideAllResultsProps = {
  item: SearchableItemMixin.Instance;
  results: ItemSearchResult[];
};

export const HideAllResults: FC<HideAllResultsProps> = (props) => {
  const { item, results } = props;
  useEffect(() => {
    const disposer = item.hideFeaturesNotInItemSearchResults(results);
    return disposer;
  }, [item, results]);
  return null;
};

export type HighlightResultsProps = {
  item: SearchableItemMixin.Instance;
  results: ItemSearchResult | ItemSearchResult[];
};

export const HighlightResults: FC<HighlightResultsProps> = (props) => {
  useEffect(() => {
    const item = props.item;
    const results = Array.isArray(props.results)
      ? props.results
      : [props.results];
    if (results.length === 1) zoomToResult(item, results[0]);
    const disposer = item.highlightFeaturesFromItemSearchResults(results);
    return disposer;
  }, [props.item, props.results]);

  return null;
};

function zoomToResult(
  item: SearchableItemMixin.Instance,
  result: ItemSearchResult
): void {
  item.zoomToItemSearchResult(result);
}
