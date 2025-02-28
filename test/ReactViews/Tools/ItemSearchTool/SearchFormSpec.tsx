import { act, create, ReactTestRenderer } from "react-test-renderer";
import timeout from "../../../../lib/Core/timeout";
import ItemSearchProvider, {
  ItemSearchResult
} from "../../../../lib/Models/ItemSearchProviders/ItemSearchProvider";
import SearchForm, {
  SearchFormProps
} from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchForm";

class TestItemSearchProvider extends ItemSearchProvider {
  async initialize() {}
  describeParameters() {
    return Promise.resolve([]);
  }
  search(): Promise<ItemSearchResult[]> {
    return Promise.resolve([
      {
        id: "1",
        idPropertyName: "building-id",
        featureCoordinate: {
          latitudeDegrees: 10,
          longitudeDegrees: 130,
          featureHeight: 42
        },
        properties: { foo: "bar" }
      }
    ]);
  }
}

describe("SearchForm", function () {
  it("calls `onResults` after searching", async function () {
    const itemSearchProvider = new TestItemSearchProvider({}, []);
    const onResults = jasmine.createSpy("onResults");
    const { root } = render({
      itemSearchProvider,
      onResults,
      parameters: [
        {
          type: "numeric",
          id: "height",
          name: "Building height",
          range: { min: 10, max: 200 }
        }
      ],
      query: {}
    });
    const form = root.findByType("form");
    form.props.onSubmit({ preventDefault: () => {} });
    // This is a bit hacky! Search is asynchronous, so we need to yield here for it to complete
    await timeout(1);
    expect(onResults).toHaveBeenCalled();
    const [_, results] = onResults.calls.mostRecent().args;
    expect(results).toEqual(
      jasmine.arrayContaining([jasmine.objectContaining({ id: "1" })])
    );
  });
});

function render(
  props: Omit<SearchFormProps, "i18n" | "t" | "tReady">
): ReactTestRenderer {
  let rendered: ReactTestRenderer;
  act(() => {
    rendered = create(<SearchForm {...props} />);
  });
  // @ts-expect-error assigned in callback
  return rendered;
}
