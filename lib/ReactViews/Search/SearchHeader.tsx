import { observer } from "mobx-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import SearchProviderResults from "../../Models/SearchProviders/SearchProviderResults";
import { BoxSpan } from "../../Styled/Box";
import Text from "../../Styled/Text";
import Loader from "../Loader";

interface SearchHeaderProps {
  searchResults: SearchProviderResults;
  isWaitingForSearchToStart: boolean;
}

const SearchHeader: FC<SearchHeaderProps> = observer(
  (props: SearchHeaderProps) => {
    const { i18n } = useTranslation();

    if (props.searchResults.isSearching || props.isWaitingForSearchToStart) {
      return (
        <div key="loader">
          <Loader boxProps={{ padded: true }} />
        </div>
      );
    } else if (props.searchResults.message) {
      return (
        <BoxSpan paddedRatio={2}>
          <Text key="message">
            {applyTranslationIfExists(
              props.searchResults.message.content,
              i18n,
              props.searchResults.message.params
            )}
          </Text>
        </BoxSpan>
      );
    } else {
      return null;
    }
  }
);

export default SearchHeader;
