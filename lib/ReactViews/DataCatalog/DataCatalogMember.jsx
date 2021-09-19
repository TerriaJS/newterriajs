"use strict";
import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import GroupMixin from "../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import DataCatalogGroup from "./DataCatalogGroup";
import DataCatalogItem from "./DataCatalogItem";
import DataCatalogReference from "./DataCatalogReference";

/**
 * Component that is either a {@link CatalogItem} or a {@link DataCatalogMember} and encapsulated this choosing logic.
 */
export default observer(
  createReactClass({
    displayName: "DataCatalogMember",

    propTypes: {
      member: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      manageIsOpenLocally: PropTypes.bool,
      overrideState: PropTypes.string,
      onActionButtonClicked: PropTypes.func,
      removable: PropTypes.bool,
      terria: PropTypes.object,
      isTopLevel: PropTypes.bool
    },

    render() {
      const member =
        ReferenceMixin.isMixedInto(this.props.member) &&
        this.props.member.target !== undefined
          ? this.props.member.target
          : this.props.member;

      if (ReferenceMixin.isMixedInto(member)) {
        return (
          <DataCatalogReference
            reference={member}
            viewState={this.props.viewState}
            terria={this.props.terria}
            onActionButtonClicked={this.props.onActionButtonClicked}
            isTopLevel={this.props.isTopLevel}
          />
        );
      } else if (GroupMixin.isMixedInto(member)) {
        return (
          <DataCatalogGroup
            group={member}
            viewState={this.props.viewState}
            manageIsOpenLocally={this.props.manageIsOpenLocally}
            overrideState={this.props.overrideState}
            onActionButtonClicked={this.props.onActionButtonClicked}
            removable={this.props.removable}
            terria={this.props.terria}
            isTopLevel={this.props.isTopLevel}
          />
        );
      } else {
        return (
          <DataCatalogItem
            item={member}
            viewState={this.props.viewState}
            overrideState={this.props.overrideState}
            onActionButtonClicked={this.props.onActionButtonClicked}
            removable={this.props.removable}
            terria={this.props.terria}
          />
        );
      }
    }
  })
);
