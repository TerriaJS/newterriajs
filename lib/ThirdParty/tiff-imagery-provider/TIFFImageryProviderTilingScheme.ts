import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import MapProjection from "terriajs-cesium/Source/Core/MapProjection";

class TIFFImageryProviderTilingScheme extends WebMercatorTilingScheme {
  constructor(options: {
    ellipsoid?: Ellipsoid;
    numberOfLevelZeroTilesX?: number;
    numberOfLevelZeroTilesY?: number;
    rectangleSouthwestInMeters: Cartesian2;
    rectangleNortheastInMeters: Cartesian2;
    project: (pos: number[]) => number[];
    unproject: (pos: number[]) => number[];
  }) {
    super(options);

    const { project, unproject } = options;

    // @ts-ignore
    this._ellipsoid = options.ellipsoid ?? Ellipsoid.WGS84;
    // @ts-ignore
    this._projection = {
      ellipsoid: this.ellipsoid,
      project(cartographic: Cartographic, result?: Cartesian3): Cartesian3 {
        const [x, y] = unproject(
          [cartographic.longitude, cartographic.latitude].map(
            CesiumMath.toDegrees
          )
        );
        const z = cartographic.height;
        return Cartesian3.fromElements(x, y, z, result);
      },
      unproject(cartesian: Cartesian3, result?: Cartographic): Cartographic {
        const [longitude, latitude] = project([cartesian.x, cartesian.y]);
        const height = cartesian.z;
        return Cartographic.fromDegrees(longitude, latitude, height, result);
      }
    };

    const swMeters = new Cartesian3();
    options.rectangleSouthwestInMeters.clone(swMeters);
    const neMeters = new Cartesian3();
    options.rectangleNortheastInMeters.clone(neMeters);
    const seMeters = new Cartesian3(neMeters.x, swMeters.y);
    const nwMeters = new Cartesian3(swMeters.x, neMeters.y);

    const southwest = this.projection.unproject(swMeters);
    const southeast = this.projection.unproject(seMeters);
    const northwest = this.projection.unproject(nwMeters);
    const northeast = this.projection.unproject(neMeters);

    // @ts-ignore
    this._rectangle = new Rectangle(
      Math.min(
        southwest.longitude,
        southeast.longitude,
        northwest.longitude,
        northeast.longitude
      ),
      Math.min(
        southwest.latitude,
        southeast.latitude,
        northwest.latitude,
        northeast.latitude
      ),
      Math.max(
        southwest.longitude,
        southeast.longitude,
        northwest.longitude,
        northeast.longitude
      ),
      Math.max(
        southwest.latitude,
        southeast.latitude,
        northwest.latitude,
        northeast.latitude
      )
    );
  }
}

export default TIFFImageryProviderTilingScheme;
