import React from "react";
import type { TFunction } from "react-i18next";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";

interface SearchInDataCatalogPropsType {
  viewState: ViewState;
  handleClick: () => void;
}

export declare const SearchInDataCatalog: React.FC<
  React.PropsWithChildren<SearchInDataCatalogPropsType>
>;

interface PropsType {
  viewState: ViewState;
  terria: Terria;
  t?: TFunction;
  placeholder?: string;
}

declare class SearchBoxAndResults extends React.Component<PropsType> {}

export default SearchBoxAndResults;
