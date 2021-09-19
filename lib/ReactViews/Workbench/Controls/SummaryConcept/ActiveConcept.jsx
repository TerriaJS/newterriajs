"use strict";
import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import Icon from "../../../../Styled/Icon";
import Concept from "../Concept";
import Styles from "./summary-concept.scss";

/*
 * ActiveConcept takes a root concept and a single parent's active leaf nodes,
 * and displays a single panel which either:
 * a) lists only the active child nodes (if the parent is closed), or
 * b) shows a more traditional list of checkboxes with concept names (if parent is open).
 * It has a header with the parent name, and edit & remove controls.
 * When it is clicked, parent.isOpen is set to True.
 * (The condition can only be "removed" if rootConcept.allowMultiple is true.)
 */
const ActiveConcept = createReactClass({
  displayName: "ActiveConcept",

  propTypes: {
    activeLeafNodesWithParent: PropTypes.object.isRequired,
    rootConcept: PropTypes.object.isRequired,
    isLoading: PropTypes.bool,
    t: PropTypes.func.isRequired
  },

  open() {
    // Close all others.
    this.props.rootConcept.closeDescendants();
    // And open this one's parent.
    this.props.activeLeafNodesWithParent.parent.isOpen = true;
  },

  close(event) {
    event.stopPropagation();
    this.props.activeLeafNodesWithParent.parent.isOpen = false;
  },

  remove(event) {
    event.stopPropagation();
    const activeLeafNodesWithParent = this.props.activeLeafNodesWithParent;
    // The parent must be a DisplayVariablesConcept or subclass, so it has a toggleActiveItem method.
    // This method de-activates all items other than the one passed in. We pass null here, so it deactivates all its items.
    // TODO: this triggers a change in active items - and hence a load - for each one. Urg!
    activeLeafNodesWithParent.parent.toggleActiveItem(null);
  },

  render() {
    const activeLeafNodesWithParent = this.props.activeLeafNodesWithParent;
    const { t } = this.props;
    return (
      <div className={Styles.section}>
        <div
          className={classNames({
            [Styles.btnOpen]: !activeLeafNodesWithParent.parent.isOpen,
            [Styles.isLoading]: this.props.isLoading
          })}
          onClick={this.open}
        >
          <div className={Styles.controls}>
            <If condition={!activeLeafNodesWithParent.parent.isOpen}>
              <button
                className={Styles.btnEdit}
                title={t("concept.active.edit")}
              >
                <Icon glyph={Icon.GLYPHS.settings} />
              </button>
              <If condition={this.props.rootConcept.allowMultiple}>
                <button
                  className={Styles.btnRemove}
                  onClick={this.remove}
                  title={t("concept.active.remove")}
                >
                  <Icon glyph={Icon.GLYPHS.close} />
                </button>
              </If>
            </If>
            <If condition={activeLeafNodesWithParent.parent.isOpen}>
              <button className={Styles.btnClose} onClick={this.close}>
                {t("general.close")}
              </button>
            </If>
          </div>
          <div className={Styles.heading}>
            {activeLeafNodesWithParent.parent.name}
          </div>
          <If condition={!activeLeafNodesWithParent.parent.isOpen}>
            <For each="child" index="j" of={activeLeafNodesWithParent.children}>
              <div className={Styles.condition} key={j}>
                {child.name}
              </div>
            </For>
          </If>
          <If condition={activeLeafNodesWithParent.parent.isOpen}>
            <ul className={Styles.childrenList}>
              <Concept
                hideName={true}
                concept={activeLeafNodesWithParent.parent}
                isLoading={this.props.isLoading}
              />
            </ul>
          </If>
        </div>
      </div>
    );
  }
});

module.exports = withTranslation()(ActiveConcept);
