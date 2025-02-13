"use strict";

import createReactClass from "create-react-class";
import PropTypes from "prop-types";

const SplitPoint = createReactClass({
  propTypes: {
    loadComponent: PropTypes.func.isRequired,
    loadingProgress: PropTypes.node
  },
  getInitialState() {
    return { component: null };
  },
  componentDidMount() {
    this.props.loadComponent((component) => this.setState({ component }));
  },
  render() {
    const ChunkComponent = this.state.component;
    const loadingProgress = this.props.loadingProgress;
    if (ChunkComponent) return <ChunkComponent {...this.props} />;
    else if (loadingProgress) return loadingProgress;
    else return null;
  }
});

export default SplitPoint;
