import { observer } from "mobx-react";
import React, { FC } from "react";

import { useTranslation } from "react-i18next";

import SearchHeader from "../Search/SearchHeader";
import { DataCatalogMember } from "./DataCatalogMember";

import isDefined from "../../Core/isDefined";
import { BaseModel } from "../../Models/Definition/Model";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import Ul from "../../Styled/List";
import Text from "../../Styled/Text";

interface IDataCatalogProps {
  terria: Terria;
  viewState: ViewState;
  items: readonly BaseModel[];
  onActionButtonClicked?: (item: any) => void;
  removable: boolean;
}

// Displays the data catalog.
export const DataCatalog: FC<IDataCatalogProps> = observer(
  ({ viewState, terria, items, onActionButtonClicked, removable }) => {
    const { t } = useTranslation();

    const searchState = viewState.searchState;
    const isSearching = searchState.catalogSearchText.length > 0;
    const catalogSearchProvider = searchState.catalogSearchProvider;
    const unfilteredItems =
      isSearching &&
      catalogSearchProvider &&
      searchState.catalogSearchResults?.results
        ? searchState.catalogSearchResults.results.map(
            (result) => result.catalogItem!
          )
        : items;
    const filteredItems = unfilteredItems.filter(
      (item) => isDefined(item) && item !== terria.catalog.userAddedDataGroup
    );

    return (
      <Ul
        column
        fullWidth
        scroll
        overflowY="auto"
        overflowX="hidden"
        css={`
          padding-inline: 0;
        `}
      >
        {isSearching && catalogSearchProvider ? (
          <>
            <Box paddedRatio={1.6}>
              <Text small>{t("search.resultsLabel")}</Text>
            </Box>
            <SearchHeader
              searchResults={catalogSearchProvider}
              isWaitingForSearchToStart={
                searchState.isWaitingToStartCatalogSearch
              }
            />
          </>
        ) : null}
        {filteredItems.map((item) => (
          <DataCatalogMember
            viewState={viewState}
            member={item as any}
            // manage group `isOpen` flag locally if searching through models dynamically (i.e. not using catalog index)
            // This must be false if resultsAreReferences - so group references open correctly in the search
            manageIsOpenLocally={
              isSearching && !catalogSearchProvider?.resultsAreReferences
            }
            key={item.uniqueId}
            onActionButtonClicked={onActionButtonClicked}
            removable={removable}
            terria={terria}
            isTopLevel={true}
          />
        ))}
      </Ul>
    );
  }
);
