import Constructor from "../../Core/Constructor";
import IndexedItemSearchProvider from "./IndexedItemSearchProvider";
import ItemSearchProvider from "./ItemSearchProvider";

export const ItemSearchProviders: Map<
  string,
  Constructor<ItemSearchProvider>
> = new Map([["indexed", IndexedItemSearchProvider]]);

export function registerItemSearchProvider(
  type: string,
  providerClass: Constructor<ItemSearchProvider>
) {
  ItemSearchProviders.set(type, providerClass);
}
