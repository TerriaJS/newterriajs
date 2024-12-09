import PropTypes from "prop-types";
import React from "react";
import { scaleOrdinal } from "@visx/scale";
import { LegendOrdinal } from "@visx/legend";
import Glyphs from "./Glyphs";
import { GlyphCircle } from "@visx/glyph";
import { TextSpan } from "../../../Styled/Text";
import styled from "styled-components";
import { observer } from "mobx-react";

@observer
class Legends extends React.PureComponent {
  static propTypes = {
    chartItems: PropTypes.array.isRequired,
    width: PropTypes.number.isRequired
  };

  static maxHeightPx = 33;

  render() {
    // @ts-expect-error TS(2339): Property 'chartItems' does not exist on type 'Read... Remove this comment to see the full error message
    const chartItems = this.props.chartItems;
    const colorScale = scaleOrdinal({
      domain: chartItems.map((c: any) => `${c.categoryName} ${c.name}`),
      range: chartItems.map((c: any) => c.getColor())
    });

    return (
      // @ts-expect-error TS(2339): Property 'width' does not exist on type 'Readonly<... Remove this comment to see the full error message
      <LegendsContainer style={{ maxWidth: this.props.width }}>
        <LegendOrdinal scale={colorScale}>
          {(labels) =>
            labels.map((label, i) => (
              <Legend
                key={`legend-${label.text}`}
                label={label}
                glyph={chartItems[i]?.glyphStyle ?? "circle"}
              />
            ))
          }
        </LegendOrdinal>
      </LegendsContainer>
    );
  }
}

export default Legends;

class Legend extends React.PureComponent {
  static propTypes = {
    label: PropTypes.object.isRequired,
    glyph: PropTypes.string
  };

  render() {
    // @ts-expect-error TS(2339): Property 'label' does not exist on type 'Readonly<... Remove this comment to see the full error message
    const label = this.props.label;
    const squareSize = 20;
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const Glyph = Glyphs[this.props.glyph] ?? GlyphCircle;
    return (
      // @ts-expect-error TS(2769): No overload matches this call.
      <LegendWrapper title={label.text} ariaLabel={label.text}>
        <svg
          width={`${squareSize}px`}
          height={`${squareSize}px`}
          style={{ flexShrink: 0 }}
        >
          <Glyph top={10} left={10} fill={label.value} size={100} />
        </svg>
        <LegendText>{label.text}</LegendText>
      </LegendWrapper>
    );
  }
}

const LegendsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin: auto;
  padding: 7px;
  font-size: 0.8em;
`;

const LegendWrapper = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 0px;
`;

const LegendText = styled(TextSpan).attrs({
  noWrap: true,
  overflowEllipsis: true,
  overflowHide: true,
  medium: true
})`
  margin-left: 4px;
`;
