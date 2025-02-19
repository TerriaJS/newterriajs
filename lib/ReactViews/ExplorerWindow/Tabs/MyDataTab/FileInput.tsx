import React, { ChangeEvent } from "react";
import { makeObservable } from "mobx";
import classNames from "classnames";
import { type TFunction, withTranslation } from "react-i18next";
import Styles from "./file-input.scss";

interface FileInputProps {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  accept: string;
  t: TFunction;
}

interface FileInputState {
  value: string | undefined;
  hovered: boolean;
}

// When uploading a file
// use an button element to have consistent stylying
class FileInput extends React.Component<FileInputProps, FileInputState> {
  constructor(props: FileInputProps) {
    super(props);
    makeObservable(this);
  }

  getInitialState() {
    const { t } = this.props;
    return {
      value: t("addData.browse"),
      hovered: false
    };
  }

  handleChange(e: ChangeEvent<HTMLInputElement>) {
    this.setState({
      value: e.target.value.split(/(\\|\/)/g).pop()
    });
    if (this.props.onChange) {
      this.props.onChange(e);
    }
  }

  render() {
    const { t } = this.props;
    return (
      <form
        className={Styles.fileInput}
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
      >
        <input
          type="file"
          onChange={this.handleChange}
          accept={this.props.accept}
          className={Styles.input}
        />
        <label
          className={classNames(Styles.btn, {
            [Styles.btnHover]: this.state.hovered
          })}
        >
          {this.state.value ? this.state.value : t("addData.browse")}
        </label>
      </form>
    );
  }
}

export default withTranslation()(FileInput);
