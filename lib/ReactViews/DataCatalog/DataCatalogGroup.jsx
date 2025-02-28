import { comparer, reaction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import addedByUser from "../../Core/addedByUser";
import getPath from "../../Core/getPath";
import removeUserAddedData from "../../Models/Catalog/removeUserAddedData";
import CatalogGroup from "./CatalogGroup";
import DataCatalogMember from "./DataCatalogMember";
import {
  addRemoveButtonClicked,
  allMappableMembersInWorkbench
} from "./DisplayGroupHelper";

@observer
class DataCatalogGroup extends Component {
  static propTypes = {
    group: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    /** Overrides whether to get the open state of the group from the group model or manage it internally */
    manageIsOpenLocally: PropTypes.bool,
    userData: PropTypes.bool,
    onActionButtonClicked: PropTypes.func,
    removable: PropTypes.bool,
    terria: PropTypes.object,
    t: PropTypes.func.isRequired,
    isTopLevel: PropTypes.bool
  };

  static defaultProps = {
    manageIsOpenLocally: false,
    userData: false
  };

  constructor(props) {
    super(props);
    this.state = {
      /** Only used if manageIsOpenLocally === true */
      isOpen: false
    };
  }

  isOpen() {
    if (this.props.manageIsOpenLocally) {
      return this.state.isOpen;
    }
    return this.props.group.isOpen;
  }

  async clickGroup() {
    if (this.props.manageIsOpenLocally) {
      this.setState({
        isOpen: !this.state.isOpen
      });
    }

    (
      await this.props.viewState.viewCatalogMember(
        this.props.group,
        !this.props.group.isOpen
      )
    ).raiseError(this.props.viewState.terria);
  }

  isSelected() {
    return addedByUser(this.props.group)
      ? this.props.viewState.userDataPreviewedItem === this.props.group
      : this.props.viewState.previewedItem === this.props.group;
  }

  getNameOrPrettyUrl() {
    // Grab a name via nameInCatalog, if it's a blank string, try and generate one from the url
    const group = this.props.group;
    const nameInCatalog = group.nameInCatalog || "";
    if (nameInCatalog !== "") {
      return nameInCatalog;
    }

    const url = group.url || "";
    // strip protocol
    return url.replace(/^https?:\/\//, "");
  }

  componentDidMount() {
    this._cleanupLoadMembersReaction = reaction(
      () => [this.props.group, this.isOpen()],
      ([group, isOpen]) => {
        if (isOpen) {
          group.loadMembers();
        }
      },
      { equals: comparer.shallow, fireImmediately: true }
    );
  }

  componentWillUnmount() {
    this._cleanupLoadMembersReaction();
  }

  render() {
    const group = this.props.group;
    const { t } = this.props;

    return (
      <CatalogGroup
        text={this.getNameOrPrettyUrl()}
        isPrivate={group.isPrivate}
        title={getPath(this.props.group, " → ")}
        topLevel={this.props.isTopLevel}
        open={this.isOpen()}
        loading={group.isLoading || group.isLoadingMembers}
        emptyMessage={t("dataCatalog.groupEmpty")}
        onClick={() => this.clickGroup()}
        removable={this.props.removable}
        removeUserAddedData={removeUserAddedData.bind(
          this,
          this.props.terria,
          this.props.group
        )}
        selected={this.isSelected()}
        // Pass these next three props down to deal with displayGroup functionality
        displayGroup={group.displayGroup}
        addRemoveButtonFunction={(event) => {
          addRemoveButtonClicked(
            this.props.group,
            this.props.viewState,
            this.props.terria,
            event.shiftKey || event.ctrlKey
          );
        }}
        allItemsLoaded={allMappableMembersInWorkbench(
          this.props.group.members,
          this.props.terria
        )}
      >
        {this.isOpen()
          ? group.memberModels.map((item) => (
              <DataCatalogMember
                key={item.uniqueId}
                member={item}
                terria={this.props.terria}
                viewState={this.props.viewState}
                userData={this.props.userData}
                overrideOpen={this.props.manageIsOpenLocally}
                onActionButtonClicked={this.props.onActionButtonClicked}
              />
            ))
          : null}
      </CatalogGroup>
    );
  }
}

export default withTranslation()(DataCatalogGroup);
