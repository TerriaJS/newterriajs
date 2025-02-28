import classNames from "classnames";
import { action, makeObservable, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import { Component } from "react";
import { WithTranslation, withTranslation, TFunction } from "react-i18next";
import styled, { useTheme } from "styled-components";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import ChartableMixin from "../../../ModelMixins/ChartableMixin";
import hasTraits from "../../../Models/Definition/hasTraits";
import Terria from "../../../Models/Terria";
import { Button, StyledButton } from "../../../Styled/Button";
import Icon, { StyledIcon } from "../../../Styled/Icon";
import UrlTraits from "../../../Traits/TraitsClasses/UrlTraits";
import Styles from "./chart-expand-and-download-buttons.scss";
import Dropdown from "../../Generic/Dropdown";

interface PropsType extends WithTranslation {
  terria: Terria;
  sourceItems: Promise<ChartableMixin.Instance | undefined>[]; // Array of items or Promise returning item
  sourceNames?: string[];
  canDownload: boolean;
  downloads?: string[];
  downloadNames?: string[];
  raiseToTitle: boolean;
  t: TFunction;
}

@observer
class ChartExpandAndDownloadButtons extends Component<PropsType> {
  @observable sourceItems: ChartableMixin.Instance[] = [];

  constructor(props: PropsType) {
    super(props);
    makeObservable(this);
  }

  @action.bound
  private expandButton() {
    this.expandItem(this.sourceItems.length - 1);
  }

  @action.bound
  private expandDropdown(_selected: unknown, sourceIndex: number) {
    this.expandItem(sourceIndex);
  }

  /**
   * Expand sourceIndex item by adding it to the workbench.
   *
   * We also remove any existing sourceItems from workbench so that only one
   * source is shown at any time.
   */
  private expandItem(sourceIndex: number) {
    const terria = this.props.terria;

    runInAction(async () => {
      const sourceItems = this.sourceItems;
      const itemToExpand = sourceItems[sourceIndex];
      const workbench = terria.workbench;
      if (!itemToExpand) {
        return;
      }

      // We want to show only one source item at a time, so remove any
      // existing source items from the workbench
      sourceItems.forEach((sourceItem) => {
        workbench.items.forEach((workbenchItem) => {
          if (sourceItem.uniqueId === workbenchItem.uniqueId) {
            workbench.remove(workbenchItem);
          }
        });
      });

      try {
        terria.addModel(itemToExpand);
      } catch {}
      (await workbench.add(itemToExpand)).raiseError(terria, undefined, true);
    });
  }

  resolveSourceItems() {
    Promise.all(
      this.props.sourceItems.map((sourceItem) => Promise.resolve(sourceItem))
    ).then(
      action((results) => {
        this.sourceItems = filterOutUndefined(results);
      })
    );
  }

  componentDidMount() {
    this.resolveSourceItems();
  }

  componentDidUpdate(prevProps: PropsType) {
    if (this.props.sourceItems !== prevProps.sourceItems) {
      this.resolveSourceItems();
    }
  }

  render() {
    if (this.sourceItems.length === 0) {
      return null;
    }

    // The downloads and download names default to the sources and source names if not defined.
    const downloads: string[] = filterOutUndefined(
      this.props.downloads ||
        this.sourceItems.map((item) =>
          hasTraits(item, UrlTraits, "url") ? item.url : undefined
        )
    );

    const { sourceNames, canDownload, raiseToTitle, t } = this.props;
    if (sourceNames && sourceNames.length > 0) {
      const downloadNames = this.props.downloadNames || sourceNames;
      return (
        <ExpandAndDownloadDropdowns
          sourceNames={sourceNames}
          canDownload={canDownload}
          downloads={downloadNames.map((name, i) => ({
            name,
            href: downloads[i]
          }))}
          onExpand={this.expandDropdown}
          raiseToTitle={raiseToTitle}
          t={t}
        />
      );
    }

    return (
      <ExpandAndDownloadButtons
        onExpand={this.expandButton}
        downloadUrl={
          canDownload && downloads.length > 0 ? downloads[0] : undefined
        }
        t={t}
      />
    );
  }
}

const ExpandAndDownloadDropdowns = function (props: {
  sourceNames: string[];
  canDownload: boolean;
  downloads: { name: string; href: string }[];
  onExpand: (_: unknown, selectedIndex: number) => void;
  raiseToTitle: boolean;
  t: TFunction;
}) {
  const expandDropdownTheme = {
    dropdown: Styles.dropdown,
    list: Styles.dropdownList,
    button: Styles.dropdownBtn,
    btnOption: Styles.dropdownBtnOption
  };

  const downloadDropdownTheme = {
    ...expandDropdownTheme,
    button: classNames(Styles.btnSmall, Styles.btnDownload)
  };

  return (
    <ExpandAndDownloadContainer raiseToTitle={props.raiseToTitle}>
      <Dropdown
        selectOption={props.onExpand}
        options={props.sourceNames.map((name) => ({ name }))}
        theme={expandDropdownTheme}
      >
        {props.t("chart.expand") + " ▾"}
      </Dropdown>
      {props.canDownload && (
        <Dropdown options={props.downloads} theme={downloadDropdownTheme}>
          {props.t("chart.download") + " ▾"}
        </Dropdown>
      )}
    </ExpandAndDownloadContainer>
  );
};

const ExpandAndDownloadButtons = function (props: {
  onExpand: () => void;
  downloadUrl?: string;
  t: TFunction;
}) {
  const theme = useTheme();
  return (
    <ExpandAndDownloadContainer>
      <ButtonChartExpand type="button" onClick={props.onExpand}>
        {props.t("chart.expand")}
      </ButtonChartExpand>
      {props.downloadUrl && (
        <DownloadLink download href={props.downloadUrl}>
          <StyledIcon
            fillColor={theme.textLight}
            glyph={Icon.GLYPHS.download}
          />
        </DownloadLink>
      )}
    </ExpandAndDownloadContainer>
  );
};

const ExpandAndDownloadContainer = styled.div<{ raiseToTitle?: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;

  ${(props) => props.raiseToTitle && `margin-top: -21px;`}
`;

const ButtonChartExpand = styled(Button).attrs({ primary: true })`
  border-radius: 3px;
  padding: 1px 8px;
  min-height: unset;
  margin-right: 5px;
`;

const DownloadLink = styled(StyledButton).attrs(() => ({
  as: "a",
  primary: true
}))`
  text-decoration: none;
  border-radius: 2px;
  padding: 1px 8px;
  min-height: unset;

  svg {
    height: 20px;
    width: 20px;
  }
`;

export default withTranslation()(ChartExpandAndDownloadButtons);
