import { reaction, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { useEffect, useRef, type FC } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { addMarker, removeMarker } from "../../Models/LocationMarkerUtils";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import { useViewState } from "../Context";
import LocationSearchResults from "./LocationSearchResults";
import SearchBox from "./SearchBox";

export function SearchInDataCatalog({
  handleClick
}: {
  handleClick: () => void;
}) {
  const viewState = useViewState();
  const locationSearchText = viewState.searchState.locationSearchText;
  const { t } = useTranslation();
  return (
    <RawButton
      fullWidth
      onClick={() => {
        const { searchState } = viewState;
        // Set text here as a separate action so that it doesn't get batched up and the catalog
        // search text has a chance to set isWaitingToStartCatalogSearch
        searchState.setCatalogSearchText(searchState.locationSearchText);

        viewState.searchInCatalog(searchState.locationSearchText);
        if (handleClick) {
          handleClick();
        }
      }}
    >
      <Box paddedRatio={2} rounded charcoalGreyBg>
        <StyledIcon styledWidth={"14px"} glyph={Icon.GLYPHS["dataCatalog"]} />
        <Spacing right={2} />
        <Text textAlignLeft textLight large fullWidth>
          {t("search.searchInDataCatalog", {
            locationSearchText: locationSearchText
          })}
        </Text>
        <StyledIcon glyph={Icon.GLYPHS.right2} styledWidth={"14px"} light />
      </Box>
    </RawButton>
  );
}

SearchInDataCatalog.propTypes = {
  handleClick: PropTypes.func.isRequired,
  viewState: PropTypes.object.isRequired
};

const PresentationBox = styled(Box).attrs({
  fullWidth: true
})<{ highlightBottom: boolean }>`
  ${(props) =>
    props.highlightBottom &&
    `
      // styled-components doesn't seem to prefix linear-gradient.. soo
      background-image: linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -o-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -moz-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -webkit-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -ms-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
    `}
`;

export const LOCATION_SEARCH_INPUT_NAME = "LocationSearchInput";

interface SearchBoxAndResultsProps {
  placeholder?: string;
}

export const SearchBoxAndResults: FC<SearchBoxAndResultsProps> = observer(
  ({ placeholder }) => {
    const locationSearchRef = useRef(null);

    const viewState = useViewState();
    const theme = useTheme();

    useEffect(() => {
      viewState.updateAppRef(LOCATION_SEARCH_INPUT_NAME, locationSearchRef);

      // TODO(wing): why is this a reaction here and not in viewState itself?
      // Close the search results when the Now Viewing changes (so that it's visible).
      const disposeReaction = reaction(
        () => viewState.terria.workbench.items,
        () => {
          viewState.searchState.showLocationSearchResults = false;
        }
      );

      return disposeReaction;
    }, [viewState]);

    const toggleShowLocationSearchResults = (bool: boolean) => {
      runInAction(() => {
        viewState.searchState.showLocationSearchResults = bool;
      });
    };

    const changeSearchText = (newText: string) => {
      runInAction(() => {
        viewState.searchState.locationSearchText = newText;
      });

      if (newText.length === 0) {
        removeMarker(viewState.terria);
        runInAction(() => {
          toggleShowLocationSearchResults(false);
        });
      }
      if (
        newText.length > 0 &&
        !viewState.searchState.showLocationSearchResults
      ) {
        runInAction(() => {
          toggleShowLocationSearchResults(true);
        });
      }
    };

    const search = () => {
      viewState.searchState.searchLocations();
    };

    const startLocationSearch = () => {
      toggleShowLocationSearchResults(true);
    };

    const searchState = viewState.searchState;
    const locationSearchText = searchState.locationSearchText;

    const shouldShowResults =
      searchState.locationSearchText.length > 0 &&
      searchState.showLocationSearchResults;

    return (
      <Text textDarker>
        <Box fullWidth>
          <PresentationBox highlightBottom={shouldShowResults}>
            <SearchBox
              ref={locationSearchRef}
              onSearchTextChanged={changeSearchText.bind(this)}
              onDoSearch={search.bind(this)}
              onFocus={startLocationSearch.bind(this)}
              searchText={searchState.locationSearchText}
              placeholder={placeholder}
            />
          </PresentationBox>
          {/* Results */}
          {shouldShowResults && (
            <Box
              position="absolute"
              fullWidth
              column
              css={`
                top: 100%;
                background-color: ${theme.greyLightest};
                max-height: calc(100vh - 120px);
                border-radius: 0 0 ${theme.radius40Button}px
                  ${theme.radius40Button}px;
              `}
            >
              {/* search {searchterm} in data catalog */}
              {/* ~TODO: Put this back once we add a MobX DataCatalogSearch Provider~ */}
              {/* TODO2: Implement a more generic MobX DataCatalogSearch */}
              {viewState.terria.searchBarModel.showSearchInCatalog &&
                searchState.catalogSearchProvider && (
                  <Box column paddedRatio={2}>
                    <SearchInDataCatalog
                      viewState={viewState}
                      handleClick={() => {
                        toggleShowLocationSearchResults(false);
                      }}
                    />
                  </Box>
                )}
              <Box
                column
                css={`
                  overflow-y: auto;
                `}
              >
                {searchState.locationSearchResults.map((search) => (
                  <LocationSearchResults
                    theme={theme}
                    key={search.searchProvider.uniqueId}
                    terria={viewState.terria}
                    viewState={viewState}
                    search={search}
                    locationSearchText={locationSearchText}
                    onLocationClick={(result) => {
                      if (!result.location) return;
                      addMarker(viewState.terria, {
                        name: result.name,
                        location: result.location
                      });
                      result.clickAction?.();
                      runInAction(() => {
                        searchState.showLocationSearchResults = false;
                      });
                    }}
                    isWaitingForSearchToStart={
                      searchState.isWaitingToStartLocationSearch
                    }
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Text>
    );
  }
);

SearchBoxAndResults.displayName = "SearchBoxAndResults";

export default SearchBoxAndResults;
