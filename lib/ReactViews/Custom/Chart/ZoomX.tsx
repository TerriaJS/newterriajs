import { select as d3Select, type BaseType } from "d3-selection";
import { zoom as d3Zoom } from "d3-zoom";
import { useEffect, type ReactNode } from "react";

interface Props {
  initialScale: any;
  scaleExtent: [number, number];
  translateExtent: [[number, number], [number, number]];
  children: ReactNode;
  onZoom: (arg: unknown) => void;
  surface: string;
}

export const ZoomX: React.FC<Props> = ({
  surface,
  scaleExtent,
  translateExtent,
  initialScale,
  onZoom,
  children
}: Props) => {
  useEffect(() => {
    const zoom = d3Zoom()
      .scaleExtent(scaleExtent)
      .translateExtent(translateExtent)
      .on("zoom", (event) => {
        onZoom(event.transform.rescaleX(initialScale));
      });

    d3Select(surface).call(zoom as never);
  }, [initialScale, onZoom, scaleExtent, surface, translateExtent]);
  return children;
};
ZoomX.displayName = "ZoomX";

export default ZoomX;
