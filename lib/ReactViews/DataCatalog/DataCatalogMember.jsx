import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import GroupMixin from "../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import DataCatalogGroup from "./DataCatalogGroup";
import DataCatalogItem from "./DataCatalogItem";
import DataCatalogReference from "./DataCatalogReference";

/**
 * Component that is either a {@link CatalogItem} or a {@link DataCatalogMember} and encapsulated this choosing logic.
 */
@observer
class DataCatalogMember extends Component {
  static propTypes = {
    member: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    manageIsOpenLocally: PropTypes.bool,
    onActionButtonClicked: PropTypes.func,
    removable: PropTypes.bool,
    terria: PropTypes.object,
    isTopLevel: PropTypes.bool
  };

  render() {
    const member =
      ReferenceMixin.isMixedInto(this.props.member) &&
      this.props.member.nestedTarget !== undefined
        ? this.props.member.nestedTarget
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
          onActionButtonClicked={this.props.onActionButtonClicked}
          removable={this.props.removable}
          terria={this.props.terria}
        />
      );
    }
  }
}

export default DataCatalogMember;
