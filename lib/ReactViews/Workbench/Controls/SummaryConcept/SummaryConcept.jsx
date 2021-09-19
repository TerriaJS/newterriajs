"use strict";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import flattenNested from "../../../../Core/flattenNested";
import Icon from "../../../../Styled/Icon";
import ActiveConcept from "./ActiveConcept";
import OpenInactiveConcept from "./OpenInactiveConcept";
import Styles from "./summary-concept.scss";

/*
 * SummaryConcept displays all the active and open nodes under a given
 * SummaryConcept.
 * It has two "modes":
 *   When summaryConcept.allowMultiple is false, it can be substituted directly for
 *   a regular displayVariableConcept (or array of concepts). Each child can have
 *   zero, one or more items selected or not selected (depending on their allowMultiple setting).
 *   When summaryConcept.allowMultiple is true, it treats the child concepts as
 *   "conditions", any number of which can be added or removed.
 *
 * Parents containing 1 or more active nodes are shown via <./ActiveConcept>.
 *    (They may be open or closed, and ActiveConcept handles the difference.)
 * Open nodes not containing any active nodes are shown via <./OpenInactiveConcept>.
 *    (This is typically the case when a user has pressed the AddButton but yet to
 *    activate any leaf nodes.)
 *    (If summaryConcept.allowMultiple is false, you cannot 'cancel' or 'go back' on this.)
 * If summaryConcept.allowMultiple is true, then an <./AddButton> is also shown,
 *    which simply opens the root concept, at which point OpenInactiveConcept takes over.
 *
 * This design would need revision to handle concepts whose direct children are a mix of
 * both leaf nodes and parent nodes.
 */
const SummaryConcept = createReactClass({
  displayName: "SummaryConcept",

  propTypes: {
    concept: PropTypes.object.isRequired, // Must be a SummaryConcept.
    isLoading: PropTypes.bool,
    t: PropTypes.func.isRequired
  },

  render() {
    const concept = this.props.concept;
    // Leaf nodes have either an undefined or a 0-length `items` array.
    const isLeafNode = concept => !concept.items || concept.items.length === 0;
    const activeLeafNodes = concept
      .getNodes(isLeafNode)
      .filter(concept => concept.isActive);
    const activeLeafNodesByParent = groupByParentId(
      activeLeafNodes,
      parent => parent.id
    );
    const openDescendantsWithoutActiveChildren = getOpenDescendantsWithoutActiveChildren(
      concept
    );
    const isLoading = this.props.isLoading;
    const { t } = this.props;
    return (
      <div className={Styles.root}>
        <div className={Styles.title}>{concept.name}:</div>
        <For each="group" index="i" of={activeLeafNodesByParent}>
          <ActiveConcept
            key={i}
            rootConcept={concept}
            activeLeafNodesWithParent={group}
            isLoading={isLoading}
          />
        </For>
        <If
          condition={
            activeLeafNodesByParent.length === 0 &&
            openDescendantsWithoutActiveChildren.length === 0
          }
        >
          <div className={Styles.noConditions}>None</div>
        </If>
        <If
          condition={
            openDescendantsWithoutActiveChildren.length > 0 && !isLoading
          }
        >
          <OpenInactiveConcept
            rootConcept={concept}
            openInactiveConcept={openDescendantsWithoutActiveChildren[0]}
          />
        </If>
        <If
          condition={
            concept.allowMultiple &&
            openDescendantsWithoutActiveChildren.length === 0
          }
        >
          <AddButton
            rootConcept={concept}
            numberOfExisting={activeLeafNodesByParent.length}
            t={t}
          />
        </If>
      </div>
    );
  }
});

/**
 * We only want to show an <OpenInactiveConcept> if there is an open item without any active items in it.
 * This will return a flat array of any such concepts.
 * @param  {Concept} concept [description]
 * @return {Array} A nested array of open concepts.
 */
function getOpenDescendantsWithoutActiveChildren(concept) {
  const openDescendants = getOpenDescendants(concept);
  const flattenedOpenDescendants = flattenNested(openDescendants);
  return flattenedOpenDescendants.filter(hasNoActiveChildren);
}

/**
 * Returns a nested array of the open descendants of this concept (including itself).
 * If an open concept itself has open descendants, they are ignored.
 * @param  {Concept} concept [description]
 * @return {Array} A nested array of open concepts.
 */
function getOpenDescendants(concept) {
  if (concept.isOpen) {
    return [concept];
  }
  if (!concept.items) {
    return [];
  }
  return concept.items.map(child => getOpenDescendants(child));
}

/**
 * @param  {Concept} concept.
 * @return {Boolean} Does this concept have no active children?
 */
function hasNoActiveChildren(concept) {
  return !concept.items || concept.items.every(child => !child.isActive);
}

/**
 * Returns an array which groups all the nodes with the same parent id into separate sub-arrays.
 * @param  {Object[]} nodes An array of objects with a 'parent' property.
 * @param  {groupByParentId~idFunction} idFunction A function which gets the id of a parent.
 * @return {Object[]} An array of objects with keys parent, children.
 * @private
 */
function groupByParentId(nodes, idFunction) {
  const results = {};
  nodes.forEach(node => {
    const id = idFunction(node.parent);
    if (!results[id]) {
      results[id] = { parent: node.parent, children: [] };
    }
    results[id].children.push(node);
  });
  return Object.keys(results).map(key => results[key]);
}

/**
 * Function that is called to find the id of a parent.
 * Eg. parent => parent.id.
 * @callback groupByParentId~idFunction
 * @param  {Object} parent A parent.
 * @return {String} The parent id.
 */

const AddButton = createReactClass({
  displayName: "AddButton",

  propTypes: {
    rootConcept: PropTypes.object.isRequired,
    numberOfExisting: PropTypes.number,
    t: PropTypes.func.isRequired
  },

  addNew() {
    this.props.rootConcept.closeDescendants();
    this.props.rootConcept.isOpen = true;
  },

  render() {
    const { t } = this.props;
    const addText =
      this.props.numberOfExisting > 0
        ? t("concept.summary.addMoreText")
        : t("concept.summary.addFirstText");
    return (
      <div className={Styles.section}>
        <button onClick={this.addNew} className={Styles.btnAddNew}>
          <Icon glyph={Icon.GLYPHS.add} />
          <span className={Styles.text}>{addText}</span>
        </button>
      </div>
    );
  }
});

module.exports = withTranslation()(SummaryConcept);
