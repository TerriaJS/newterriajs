import { create } from "react-test-renderer";
import { act } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface";
import WarningBox from "../../lib/ReactViews/Preview/WarningBox";
import Box from "../../lib/Styled/Box";

describe("WarningBox", function () {
  let testRenderer: ReturnType<typeof create>;
  beforeEach(function () {
    // terria = new Terria({ baseUrl: "./" });
  });

  it("renders", function () {
    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <WarningBox>Test text</WarningBox>
        </ThemeProvider>
      );
    });
    const boxes = testRenderer.root.findAllByType(Box);
    expect(
      boxes.some((box) => box.props.children === "Test text")
    ).toBeTruthy();
  });
});
