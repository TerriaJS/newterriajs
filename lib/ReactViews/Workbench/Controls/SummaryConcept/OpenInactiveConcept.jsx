"use strict";
import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import Icon from "../../../../Styled/Icon";
import Concept from "../Concept";
import Styles from "./summary-concept.scss";

const OpenInactiveConcept = createReactClass({
  displayName: "OpenInactiveConcept",

  propTypes: {
    rootConcept: PropTypes.object.isRequired,
    openInactiveConcept: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  cancel() {
    this.props.openInactiveConcept.isOpen = false;
  },

  back() {
    this.props.openInactiveConcept.isOpen = false;
    this.props.openInactiveConcept.parent.isOpen = true;
  },

  render() {
    const showControls = this.props.rootConcept.allowMultiple;
    const { t } = this.props;
    return (
      <div className={Styles.section}>
        <div className={Styles.controls}>
          <If condition={showControls}>
            <button className={Styles.btnClose} onClick={this.cancel}>
              {t("concept.inactive.cancel")}
            </button>
          </If>
        </div>
        <div className={Styles.heading}>
          <If
            condition={
              this.props.rootConcept !== this.props.openInactiveConcept
            }
          >
            <If condition={showControls}>
              <button className={Styles.btnBack} onClick={this.back}>
                <Icon glyph={Icon.GLYPHS.left} />
              </button>
            </If>
            <div className={classNames({ [Styles.indented]: showControls })}>
              {this.props.openInactiveConcept.name}
            </div>
          </If>
          <If
            condition={
              this.props.rootConcept === this.props.openInactiveConcept
            }
          >
            {t("concept.inactive.newText")}
          </If>
        </div>
        <ul className={Styles.childrenList}>
          <For each="child" index="i" of={this.props.openInactiveConcept.items}>
            <If condition={child.items && child.items.length > 0}>
              <ConceptParent concept={child} key={i} />
            </If>
            <If condition={!child.items || child.items.length === 0}>
              <li className={Styles.items}>
                <ul className={Styles.listReset}>
                  <Concept concept={child} key={i} />
                </ul>
              </li>
            </If>
          </For>
        </ul>
      </div>
    );
  }
});

const ConceptParent = createReactClass({
  displayName: "ConceptParent",

  propTypes: {
    concept: PropTypes.object.isRequired
  },

  open() {
    this.props.concept.isOpen = true;
    this.props.concept.parent.isOpen = false;
  },

  render() {
    return (
      <li>
        <div className={Styles.btnAddOpen} onClick={this.open}>
          <div className={Styles.controls}>
            <Icon glyph={Icon.GLYPHS.closed} />
          </div>
          <div className={Styles.condition}>{this.props.concept.name}</div>
        </div>
      </li>
    );
  }
});

module.exports = withTranslation()(OpenInactiveConcept);
