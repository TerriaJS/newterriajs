import { autorun } from "mobx";
import { observer } from "mobx-react";
import { FC, useEffect, useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import ItemSearchProvider, {
  ItemSearchParameter,
  ItemSearchParameterType,
  ItemSearchResult
} from "../../../Models/ItemSearchProviders/ItemSearchProvider";
import ViewState from "../../../ReactViewModels/ViewState";
import Box from "../../../Styled/Box";
import { Frame, Main } from "../ToolModal";
import BackButton from "./BackButton";
import ErrorComponent from "./ErrorComponent";
import Loading from "./Loading";
import SearchForm from "./SearchForm";
import SearchResults from "./SearchResults";

export interface PropsType extends WithTranslation {
  item: SearchableItemMixin.Instance;
  itemSearchProvider: ItemSearchProvider;
  viewState: ViewState;
  afterLoad?: () => void;
}

type State =
  | { is: "loadingParameters" }
  | { is: "error"; error: Error }
  | { is: "search" }
  | { is: "results"; results: ItemSearchResults };

export type ItemSearchQuery = Record<
  string,
  { type: ItemSearchParameterType; value: any }
>;
export type ItemSearchResults = ItemSearchResult[];
export type ActiveSelectionDisposer = () => void | undefined;

const ItemSearchTool: FC<PropsType> = observer((props) => {
  const { viewState, item, itemSearchProvider, t } = props;
  const itemName = CatalogMemberMixin.isMixedInto(item) ? item.name : "Item";

  const [state, setState] = useState<State>({ is: "loadingParameters" });
  const [parameters, setParameters] = useState<ItemSearchParameter[]>([]);
  const [query, setQuery] = useState<ItemSearchQuery>({});

  useEffect(
    function loadParameters() {
      itemSearchProvider
        .initialize()
        .then(() =>
          itemSearchProvider.describeParameters().then((parameters) => {
            setState({ is: "search" });
            setParameters(parameters);
            setQuery({});
          })
        )
        .catch((error: Error) => {
          console.warn(error);
          setState({
            is: "error",
            error
          });
        })
        .finally(() => props.afterLoad?.());
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [itemSearchProvider]
  );

  useEffect(
    function closeSearchTool() {
      // Close item search tool if the parent item is disabled or removed from
      // the workbench
      const disposeListener = onItemDisabledOrRemovedFromWorkbench(item, () =>
        viewState.closeTool()
      );
      return disposeListener;
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [item]
  );

  const setResults = (query: ItemSearchQuery, results: ItemSearchResults) => {
    setQuery(query);
    setState({ is: "results", results });
  };

  const searchAgain = () => setState({ is: "search" });
  const loadIndexForParameter =
    itemSearchProvider.loadParameterHint?.bind(itemSearchProvider);

  return (
    <Frame
      viewState={viewState}
      title={t("itemSearchTool.title", { itemName })}
    >
      <Main textLight light>
        <Box
          centered
          css={`
            text-align: center;
          `}
        >
          {state.is === "loadingParameters" && (
            <Loading>{t("itemSearchTool.loading")}</Loading>
          )}
          {state.is === "error" && (
            <ErrorComponent>{t("itemSearchTool.loadError")}</ErrorComponent>
          )}
          {state.is === "search" && parameters.length === 0 && (
            <ErrorComponent>{t("itemSearchTool.noParameters")}</ErrorComponent>
          )}
        </Box>
        {state.is === "search" && parameters.length > 0 && (
          <SearchForm
            itemSearchProvider={itemSearchProvider}
            parameters={parameters}
            query={query}
            onResults={setResults}
            onValueChange={loadIndexForParameter}
          />
        )}
        {state.is === "results" && (
          <SearchResults
            item={item}
            results={state.results}
            template={item.search.resultTemplate}
          />
        )}
        {state.is === "results" && (
          <BackButton onClick={searchAgain}>
            {t("itemSearchTool.backBtnText")}
          </BackButton>
        )}
      </Main>
    </Frame>
  );
});

/**
 * Callback when the given item is disabled or removed from the workbench.
 *
 * @param item The item to watch
 * @param callback The function to call when the event happens
 * @return A function to dispose the listener
 */
function onItemDisabledOrRemovedFromWorkbench(
  item: SearchableItemMixin.Instance,
  callback: () => void
): () => void {
  const disposer = autorun(() => {
    if (item.show === false || item.terria.workbench.contains(item) === false)
      callback();
  });
  return disposer;
}

export default withTranslation()(ItemSearchTool);
