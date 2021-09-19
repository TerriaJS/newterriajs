import { PureComponent } from "react";
import { init, exec } from "pell";
import PropTypes from "prop-types";

export default class Editor extends PureComponent {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.editor = init({
      element: this.node,
      onChange: this.props.onChange,
      actions: this.props.actions
    });
    this.editor.content.innerHTML = this.props.html;
  }

  componentWillUnmount() {
    this.editor = undefined;
  }
  render() {
    return <div ref={node => (this.node = node)} />;
  }
}

Editor.propTypes = {
  html: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  actions: PropTypes.array
};

Editor.defaultProps = {
  actions: [
    "bold",
    "italic",
    "underline",
    "heading1",
    "heading2",
    "olist",
    "ulist",
    "image",
    {
      name: "link",
      result: () => {
        /* eslint-disable-next-line no-alert */
        const url = window.prompt("Enter the link URL", "http://");
        if (url) {
          exec("createLink", url);
        }
      }
    }
  ]
};
