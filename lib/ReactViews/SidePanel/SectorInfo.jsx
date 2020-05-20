import React from "react";
import Styles from "./sector_info.scss";
import PropTypes from "prop-types";

class SectorInfo extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { sector } = this.props;

    if (sector !== null) {
      return (
        <>
          <div className={Styles.panelHeading}>
            <span className={Styles.sectorTitle}>{sector.title}</span>
          </div>
          <div className={Styles.sectorInfo}>
            <p>{sector.info}</p>
          </div>
        </>
      );
    }
    return (
      <>
        <div className={Styles.panelHeading}>
          <span className={Styles.sectorTitle}>Welcome</span>
        </div>
        <div className={Styles.messageConatiner}>
          <h3>
            The RECEIPT climate story explorer allows you to explore storylines
            that show indirect impact of climate change on EU.
          </h3>
          <p>
            As much of the wealth and many of the products that are eaten or
            used in the EU are produced or sourced in the rest of the world,
            climate change impacts the EU not only directly, but also through
            impact on remote regions. With this application, we can build and
            show stories to highlight several of these climate impact hotspots.
          </p>
          <p>
            More information on the RECEIPT Horizon 2020 project can be found on
          </p>
          <a href="https://climatestorylines.eu/ ">
            https://climatestorylines.eu/{" "}
          </a>
        </div>
      </>
    );
  }
}
SectorInfo.propTypes = {
  sector: PropTypes.object.isRequired
};

export default SectorInfo;
