import { makeObservable, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import Loader from "../Loader";
import WarningBox from "../Preview/WarningBox";
import Styles from "./invoke-function.scss";
import ParameterEditor from "./ParameterEditor";

class FunctionViewModel {
  constructor(catalogFunction) {
    this.catalogFunction = catalogFunction;
    this._parameters = {};
  }

  getParameter(parameter) {
    let result = this._parameters[parameter.id];
    if (!result || result.parameter !== parameter) {
      result = this._parameters[parameter.id] = new ParameterViewModel(
        parameter
      );
    }
    return result;
  }
}

class ParameterViewModel {
  parameter;

  @observable
  userValue = undefined;
  @observable
  isValueValid = true;
  @observable
  wasEverBlurredWhileInvalid = false;

  constructor(parameter) {
    makeObservable(this);
    this.parameter = parameter;
  }
}

@observer
class InvokeFunction extends Component {
  static propTypes = {
    terria: PropTypes.object,
    previewed: PropTypes.object,
    viewState: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  UNSAFE_componentWillMount() {
    this.parametersViewModel = new FunctionViewModel(this.props.previewed);
  }

  UNSAFE_componentWillUpdate(nextProps, _nextState) {
    if (nextProps.previewed !== this.parametersViewModel.catalogFunction) {
      // Clear previous parameters view model, because this is a different catalog function.
      this.parametersViewModel = new FunctionViewModel(nextProps.previewed);
    }
  }

  submit() {
    this.props.previewed.submitJob().catch((e) => {
      this.props.terria.raiseErrorToUser(e);
    });

    runInAction(() => {
      // Close modal window
      this.props.viewState.explorerPanelIsVisible = false;
      // mobile switch to nowvewing
      this.props.viewState.switchMobileView(
        this.props.viewState.mobileViewOptions.preview
      );
    });
  }

  getParams() {
    // Key should include the previewed item identifier so that
    // components are refreshed when different previewed items are
    // displayed
    return this.props.previewed.functionParameters.map((param, _i) => (
      <ParameterEditor
        key={param.id + this.props.previewed.uniqueId}
        parameter={param}
        viewState={this.props.viewState}
        previewed={this.props.previewed}
        parameterViewModel={this.parametersViewModel.getParameter(param)}
      />
    ));
  }

  validateParameter(parameter) {
    if (
      !parameter.isValid ||
      !this.parametersViewModel.getParameter(parameter).isValueValid
    ) {
      // Editor says it's not valid, so it's not valid.
      return false;
    }

    // Verify that required parameters have a value.
    if (parameter.isRequired && !defined(parameter.value)) {
      return false;
    }

    return true;
  }

  render() {
    if (this.props.previewed.isLoading) {
      return <Loader />;
    }

    const invalidParameters = this.props.previewed.functionParameters.some(
      (param) => this.validateParameter(param) !== true
    );

    const { t } = this.props;
    return (
      <div className={Styles.invokeFunction}>
        <div className={Styles.content}>
          <h3>{this.props.previewed.name}</h3>
          {this.props.previewed.loadMetadataResult?.error && (
            <WarningBox
              error={this.props.previewed.loadMetadataResult?.error}
              viewState={this.props.viewState}
            />
          )}
          <div className={Styles.description}>
            {parseCustomMarkdownToReact(this.props.previewed.description, {
              catalogItem: this.props.previewed
            })}
          </div>
          {this.getParams()}
        </div>
        <div className={Styles.footer}>
          <button
            type="button"
            className={Styles.btn}
            onClick={() => this.submit()}
            disabled={invalidParameters}
          >
            {t("analytics.runAnalysis")}
          </button>
        </div>
      </div>
    );
  }
}

export default withTranslation()(InvokeFunction);
