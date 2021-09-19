import Loader from "../Loader";
import { observer } from "mobx-react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Styles from "./search-header.scss";

/** Renders either a loader or a message based off search state. */
export default observer(
  createReactClass({
    displayName: "SearchHeader",

    propTypes: {
      searchResults: PropTypes.object.isRequired,
      isWaitingForSearchToStart: PropTypes.bool
    },

    render() {
      if (
        this.props.searchResults.isSearching ||
        this.props.isWaitingForSearchToStart
      ) {
        return (
          <div key="loader" className={Styles.loader}>
            <Loader />
          </div>
        );
      } else if (this.props.searchResults.message) {
        return (
          <div key="message" className={Styles.noResults}>
            {this.props.searchResults.message}
          </div>
        );
      } else {
        return null;
      }
    }
  })
);
