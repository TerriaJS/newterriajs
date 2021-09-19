const create: any = require("react-test-renderer").create;
import { act } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface/StandardTheme";
import Clipboard from "../../lib/ReactViews/Clipboard";
import Input from "../../lib/ReactViews/Styled/Input/Input";
import Button from "../../lib/Styled/Button";

describe("Clipboard", function() {
  let testRenderer: any;

  describe("with basic props", function() {
    it("renders a button", function() {
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <Clipboard source={<Input />} theme="dark" id="test-id" />
          </ThemeProvider>
        );
      });

      const button = testRenderer.root.findByType(Button);
      expect(button).toBeDefined();
      expect(button.props["data-clipboard-target"]).toBe("#test-id");
    });
  });
});
