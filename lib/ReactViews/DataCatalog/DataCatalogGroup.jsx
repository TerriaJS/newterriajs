import createReactClass from "create-react-class";
import { comparer, reaction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import addedByUser from "../../Core/addedByUser";
import getPath from "../../Core/getPath";
import removeUserAddedData from "../../Models/Catalog/removeUserAddedData";
import CatalogGroup from "./CatalogGroup";
import DataCatalogMember from "./DataCatalogMember";

const DataCatalogGroup = observer(
  createReactClass({
    displayName: "DataCatalogGroup",

    propTypes: {
      group: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      /** Overrides whether to get the open state of the group from the group model or manage it internally */
      manageIsOpenLocally: PropTypes.bool,
      userData: PropTypes.bool,
      overrideState: PropTypes.string,
      onActionButtonClicked: PropTypes.func,
      removable: PropTypes.bool,
      terria: PropTypes.object,
      t: PropTypes.func.isRequired,
      isTopLevel: PropTypes.bool
    },

    getDefaultProps() {
      return {
        manageIsOpenLocally: false,
        userData: false
      };
    },

    getInitialState() {
      return {
        /** Only used if manageIsOpenLocally === true */
        isOpen: false
      };
    },

    isOpen() {
      if (this.props.manageIsOpenLocally) {
        return this.state.isOpen;
      }
      return this.props.group.isOpen;
    },

    async clickGroup() {
      if (this.props.manageIsOpenLocally) {
        this.setState({
          isOpen: !this.state.isOpen
        });
      }
      this.props.viewState.viewCatalogMember(
        this.props.group,
        !this.props.group.isOpen
      );
    },

    isSelected() {
      return addedByUser(this.props.group)
        ? this.props.viewState.userDataPreviewedItem === this.props.group
        : this.props.viewState.previewedItem === this.props.group;
    },

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
    },

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
    },

    componentWillUnmount() {
      this._cleanupLoadMembersReaction();
    },

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
          onClick={this.clickGroup}
          removable={this.props.removable}
          removeUserAddedData={removeUserAddedData.bind(
            this,
            this.props.terria,
            this.props.group
          )}
          selected={this.isSelected()}
        >
          <If condition={this.isOpen()}>
            <For each="item" of={group.memberModels}>
              <DataCatalogMember
                key={item.uniqueId}
                member={item}
                terria={this.props.terria}
                viewState={this.props.viewState}
                userData={this.props.userData}
                overrideOpen={this.props.manageIsOpenLocally}
                overrideState={this.props.overrideState}
                onActionButtonClicked={this.props.onActionButtonClicked}
              />
            </For>
          </If>
        </CatalogGroup>
      );
    }
  })
);

module.exports = withTranslation()(DataCatalogGroup);
