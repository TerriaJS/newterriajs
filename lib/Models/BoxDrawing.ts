import throttle from "lodash-es/throttle";
import {
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved
} from "mobx";
import ArcType from "terriajs-cesium/Source/Core/ArcType";
import BoundingSphere from "terriajs-cesium/Source/Core/BoundingSphere";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Color from "terriajs-cesium/Source/Core/Color";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import EllipsoidTerrainProvider from "terriajs-cesium/Source/Core/EllipsoidTerrainProvider";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import IntersectionTests from "terriajs-cesium/Source/Core/IntersectionTests";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import KeyboardEventModifier from "terriajs-cesium/Source/Core/KeyboardEventModifier";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Matrix3 from "terriajs-cesium/Source/Core/Matrix3";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Plane from "terriajs-cesium/Source/Core/Plane";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import Ray from "terriajs-cesium/Source/Core/Ray";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import sampleTerrainMostDetailed from "terriajs-cesium/Source/Core/sampleTerrainMostDetailed";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import TranslationRotationScale from "terriajs-cesium/Source/Core/TranslationRotationScale";
import CallbackProperty from "terriajs-cesium/Source/DataSources/CallbackProperty";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PlaneGraphics from "terriajs-cesium/Source/DataSources/PlaneGraphics";
import PolylineDashMaterialProperty from "terriajs-cesium/Source/DataSources/PolylineDashMaterialProperty";
import PositionProperty from "terriajs-cesium/Source/DataSources/PositionProperty";
import Axis from "terriajs-cesium/Source/Scene/Axis";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import isDefined from "../Core/isDefined";
import { CustomCursorType, getCustomCssCursor } from "./BoxDrawing/cursors";
import Cesium from "./Cesium";

export type ChangeEvent = {
  isFinished: boolean;
  modelMatrix: Matrix4;
};

export type ChangeEventHandler = (event: ChangeEvent) => void;

type MouseClick = { position: Cartesian2 };

type MouseMove = { startPosition: Cartesian2; endPosition: Cartesian2 };

/**
 * An object that responds to box parameter updates.
 */
type Updatable = { update: () => void };

/**
 * A user interactable object
 */
type Interactable = {
  onMouseOver: (mouseMove: MouseMove) => void;
  onMouseOut: (mouseMove: MouseMove) => void;
  onPick: (click: MouseClick) => void;
  onRelease: () => void;
  onDrag: (mouseMove: MouseMove) => void;
};

/**
 * An object that responds to camera changes
 */
type CameraAware = {
  updateOnCameraChange: () => void;
};

/**
 * A box side
 */
type Side = Entity &
  Updatable &
  Interactable &
  CameraAware & {
    isSide: true;
    plane: PlaneGraphics;
    isFacingCamera: boolean;
    highlight: () => void;
    unHighlight: () => void;
  };

/**
 * A box edge
 */
type Edge = Entity & Updatable & Interactable;

/**
 * Style for a box side
 */
type SideStyle = {
  fillColor: Color;
  outlineColor: Color;
  highlightFillColor: Color;
  highlightOutlineColor: Color;
};

/**
 * A scale grip point
 */
type ScalePoint = Entity &
  Updatable &
  Interactable &
  CameraAware & {
    position: PositionProperty;
    oppositeScalePoint: ScalePoint;
    axisLine: Entity;
  };

/**
 * Style for a scale point
 */
type ScalePointStyle = {
  cornerPointColor: Color;
  facePointColor: Color;
  dimPointColor: Color;
};

/**
 * The current interaction state of the box
 */
type InteractionState =
  | { is: "none" }
  | {
      is: "picked";
      entity: Entity & Interactable;
      beforePickState: {
        isFeaturePickingPaused: boolean;
        enableInputs: boolean;
      };
    }
  | { is: "hovering"; entity: Entity & Interactable };

export type BoxDrawingChangeParams = {
  /**
   * The modelMatrix of the box
   */
  modelMatrix: Matrix4;

  /**
   * The translation rotation scale of the box
   */
  translationRotationScale: TranslationRotationScale;

  /**
   * True if the change is finished or false if it is ongoing
   */
  isFinished: boolean;
};

type BoxDrawingOptions = {
  /**
   * When true, prevents the box from going underground. Note that we only use
   * the center of the bottom face to detect if the box is underground. For
   * large boxes, this center point can be above ground while the corners are
   * underground.
   */
  keepBoxAboveGround?: boolean;

  /**
   * A callback method to call when box parameters change.
   */
  onChange?: (params: BoxDrawingChangeParams) => void;

  /**
   * When set to `false`, do not draw the scale grips on the box faces, used for non-uniform scaling.
   * Defaults to `true`, i.e draws the non-uniform scaling grips.
   */
  drawNonUniformScaleGrips?: boolean;

  /**
   * When set to `true`, disable dragging of top and bottom planes to change the box height.
   * Defaults to `false`, i.e top and bottom sides are draggable and dragging them changes the box height.
   */
  disableVerticalMovement?: boolean;
};

// The 6 box sides defined as planes in local coordinate space.
const SIDE_PLANES: Plane[] = [
  new Plane(new Cartesian3(0, 0, 1), 0.5),
  new Plane(new Cartesian3(0, 0, -1), 0.5),
  new Plane(new Cartesian3(0, 1, 0), 0.5),
  new Plane(new Cartesian3(0, -1, 0), 0.5),
  new Plane(new Cartesian3(1, 0, 0), 0.5),
  new Plane(new Cartesian3(-1, 0, 0), 0.5)
];

const CORNER_POINT_VECTORS = [
  new Cartesian3(0.5, 0.5, 0.5),
  new Cartesian3(0.5, -0.5, 0.5),
  new Cartesian3(-0.5, -0.5, 0.5),
  new Cartesian3(-0.5, 0.5, 0.5)
];

const FACE_POINT_VECTORS = [
  new Cartesian3(0.5, 0.0, 0.0),
  new Cartesian3(0.0, 0.5, 0.0),
  new Cartesian3(0.0, 0.0, 0.5)
];

/**
 * Checks whether the given entity is updatable (i.e repsonds to box parameter changes).
 */
function isUpdatable(entity: Entity): entity is Entity & Updatable {
  return typeof (entity as any).update === "function";
}

/**
 * Checks whether the given entity is interactable.
 */
function isInteractable(entity: Entity): entity is Entity & Interactable {
  return (
    typeof (entity as any).onPick === "function" &&
    typeof (entity as any).onRelease === "function" &&
    typeof (entity as any).onMouseOver === "function" &&
    typeof (entity as any).onMouseOut === "function"
  );
}

export function isSideEntity(entity: Entity): entity is Side {
  return (entity as any).isSide;
}

export default class BoxDrawing {
  static localSidePlanes = SIDE_PLANES;

  // Observable because we want to start/stop interactions when the datasource
  // gets used/removed.
  @observable
  public dataSource: CustomDataSource;

  private _keepBoxAboveGround = false;

  private drawNonUniformScaleGrips: boolean;

  public disableVerticalMovement: boolean;

  public keepHeightSteadyWhenMovingLaterally = true;

  public onChange?: (params: BoxDrawingChangeParams) => void;

  // An external transform to convert the box in local coordinates to world coordinates
  private readonly worldTransform: Matrix4 = Matrix4.IDENTITY.clone();

  // The translation, rotation & scale (i.e position, orientation, dimensions) of the box
  private readonly trs = new TranslationRotationScale();

  // A matrix representation of trs
  private readonly modelMatrix: Matrix4 = Matrix4.IDENTITY.clone();

  private scene: Scene;

  // A disposer function to destroy all event handlers
  private interactionsDisposer?: () => void;

  // Sides of the box defined as cesium entities with additional properties
  private readonly sides: Side[] = [];

  // Scale points on the box defined as cesium entities with additional properties
  private readonly scalePoints: ScalePoint[] = [];

  private readonly edges: Edge[] = [];

  private isHeightUpdateInProgress: boolean = false;
  private terrainHeightEstimate: number = 0;

  // Flag to turn scaling interaction on or off
  private _enableScaling = true;

  // Flag to turn rotation interaction on or off
  private _enableRotation = true;

  /**
   * A private constructor. Use {@link BoxDrawing.fromTransform} or {@link BoxDrawing.fromTranslationRotationScale} to create instances.
   */
  private constructor(
    readonly cesium: Cesium,
    transform: Matrix4,
    options: BoxDrawingOptions
  ) {
    makeObservable(this);
    this.scene = cesium.scene;
    this.keepBoxAboveGround = options.keepBoxAboveGround ?? false;
    this.drawNonUniformScaleGrips = options.drawNonUniformScaleGrips ?? true;
    this.disableVerticalMovement = options.disableVerticalMovement ?? false;
    this.onChange = options.onChange;
    this.dataSource = new Proxy(new CustomDataSource(), {
      set: (target, prop, value) => {
        if (prop === "show") {
          if (value === true) {
            this.startInteractions();
          } else {
            this.stopInteractions();
          }
        }
        return Reflect.set(target, prop, value);
      }
    });
    this.setTransform(transform);
    this.drawBox();
    this.setBoxAboveGround();

    onBecomeObserved(this, "dataSource", () => this.startInteractions());
    onBecomeUnobserved(this, "dataSource", () => this.stopInteractions());
  }

  /**
   * Construct `BoxDrawing` from a transformation matrix.
   *
   * @param cesium - A Cesium instance
   * @param transform - A transformation that positions the box in the world.
   * @param options - {@link BoxDrawingOptions}
   * @returns A `BoxDrawing` instance
   */
  static fromTransform(
    cesium: Cesium,
    transform: Matrix4,
    options?: BoxDrawingOptions
  ): BoxDrawing {
    return new BoxDrawing(cesium, transform, options ?? {});
  }

  /**
   * Construct `BoxDrawing` from a {@link TranslationRotationScale} object.
   *
   * @param cesium - A Cesium instance
   * @param trs - Translation, rotation and scale of the object.
   * @param options - {@link BoxDrawingOptions}
   * @returns A `BoxDrawing` instance
   */
  static fromTranslationRotationScale(
    cesium: Cesium,
    trs: TranslationRotationScale,
    options?: BoxDrawingOptions
  ): BoxDrawing {
    const boxDrawing = new BoxDrawing(
      cesium,
      Matrix4.fromTranslationRotationScale(trs),
      options ?? {}
    );

    return boxDrawing;
  }

  public setTranslationRotationScale(trs: TranslationRotationScale): void {
    Cartesian3.clone(trs.translation, this.trs.translation);
    Quaternion.clone(trs.rotation, this.trs.rotation);
    Cartesian3.clone(trs.scale, this.trs.scale);
    this.updateBox();
  }

  /**
   * A method to udpate the world transform.
   */
  public setTransform(transform: Matrix4): void {
    Matrix4.clone(transform, this.worldTransform);
    Matrix4.getTranslation(this.worldTransform, this.trs.translation);
    Matrix4.getScale(this.worldTransform, this.trs.scale);
    Quaternion.fromRotationMatrix(
      Matrix3.getRotation(
        Matrix4.getMatrix3(this.worldTransform, new Matrix3()),
        new Matrix3()
      ),
      this.trs.rotation
    );
    this.updateBox();
  }

  get keepBoxAboveGround() {
    return this._keepBoxAboveGround;
  }

  set keepBoxAboveGround(value: boolean) {
    if (this._keepBoxAboveGround === value) {
      return;
    }

    this._keepBoxAboveGround = value;
    this.setBoxAboveGround().then(() => {
      this.onChange?.({
        modelMatrix: this.modelMatrix,
        translationRotationScale: this.trs,
        isFinished: true
      });
    });
  }

  get enableScaling() {
    return this._enableScaling;
  }

  set enableScaling(enable: boolean) {
    this._enableScaling = enable;
    this.scalePoints.forEach((scalePoint) => (scalePoint.show = enable));
  }

  get enableRotation() {
    return this._enableRotation;
  }

  set enableRotation(enable: boolean) {
    this._enableRotation = enable;
    this.edges.forEach((edge) => (edge.show = enable));
  }

  /**
   * Moves the box by the provided moveStep with optional clamping applied so that the
   * box does not go underground.
   *
   * @param moveStep The amount by which to move the box
   */
  private moveBoxWithClamping = (() => {
    const scratchNewPosition = new Cartesian3();
    const scratchCartographic = new Cartographic();

    return (moveStep: Cartesian3) => {
      const nextPosition = Cartesian3.add(
        this.trs.translation,
        moveStep,
        scratchNewPosition
      );

      if (this.keepBoxAboveGround) {
        const cartographic = Cartographic.fromCartesian(
          nextPosition,
          undefined,
          scratchCartographic
        );
        const boxBottomHeight = cartographic.height - this.trs.scale.z / 2;
        const floorHeight: number = this.terrainHeightEstimate;
        if (boxBottomHeight < floorHeight) {
          cartographic.height += floorHeight - boxBottomHeight;
          Cartographic.toCartesian(cartographic, undefined, nextPosition);
        }
      }
      Cartesian3.clone(nextPosition, this.trs.translation);
    };
  })();

  /**
   * Set the box position
   */
  setPosition(position: Cartesian3): void {
    const moveStep = Cartesian3.subtract(
      position,
      this.trs.translation,
      new Cartesian3()
    );
    this.moveBoxWithClamping(moveStep);
    this.updateBox();
  }

  /**
   * Update the terrain height estimate at the current box position.
   *
   * If the terrainProvider is the `EllipsoidTerrainProvider` this simply sets
   * the estimate to 0.  Otherwise we request the terrain provider for the most
   * detailed height estimate.  To avoid concurrent attempts we skip the call
   * if any other request is active. `forceUpdate` can be used to force an
   * update even when an earlier request is active.
   */
  private updateTerrainHeightEstimate = (() => {
    const scratchBoxCenter = new Cartographic();
    const scratchFloor = new Cartographic();

    return async (forceUpdate = false) => {
      if (!this.keepBoxAboveGround) {
        return;
      }

      if (this.isHeightUpdateInProgress && !forceUpdate) {
        return;
      }

      const terrainProvider = this.scene.terrainProvider;
      if (terrainProvider instanceof EllipsoidTerrainProvider) {
        this.terrainHeightEstimate = 0;
        return;
      }

      const boxCenter =
        this.trs.translation &&
        Cartographic.fromCartesian(
          this.trs.translation,
          undefined,
          scratchBoxCenter
        );

      if (!boxCenter) {
        this.terrainHeightEstimate = 0;
        return;
      }

      this.isHeightUpdateInProgress = true;

      try {
        const [floor] = await sampleTerrainMostDetailed(terrainProvider, [
          Cartographic.clone(boxCenter, scratchFloor)
        ]);
        if (floor.height !== undefined) {
          this.terrainHeightEstimate = floor.height;
        }
      } finally {
        this.isHeightUpdateInProgress = false;
      }
    };
  })();

  async setBoxAboveGround(): Promise<void> {
    if (!this.keepBoxAboveGround) {
      return;
    }

    // Get the latest terrain height estimate and update the box position
    return this.updateTerrainHeightEstimate(true).then(() => {
      this.moveBoxWithClamping(Cartesian3.ZERO);
      this.updateBox();
    });
  }

  /**
   * Sets up event handlers if not already done.
   */
  private startInteractions() {
    if (this.interactionsDisposer) {
      // already started
      return;
    }

    let eventHandler: { destroy: () => void } | undefined;

    // Start event handling if not already started
    const startMapInteractions = () => {
      if (!eventHandler) {
        eventHandler = this.createEventHandler();
      }
    };

    // Stop event handling
    const stopMapInteractions = () => {
      eventHandler?.destroy();
      eventHandler = undefined;
    };

    // Watch camera changes to update entities and to enable/disable
    // interactions when the box comes in and out of view.
    const onCameraChange = () => {
      this.updateEntitiesOnOrientationChange();
    };

    // Camera event disposer
    const disposeCameraEvent =
      this.scene.camera.changed.addEventListener(onCameraChange);

    // Disposer for map interactions & camera events
    this.interactionsDisposer = () => {
      stopMapInteractions();
      disposeCameraEvent();
      this.interactionsDisposer = undefined;
    };

    startMapInteractions();
    // Call once to initialize
    onCameraChange();
  }

  private stopInteractions() {
    this.interactionsDisposer?.();
  }

  /**
   * Updates all box parameters from changes to the localTransform.
   */
  private updateBox() {
    Matrix4.fromTranslationRotationScale(this.trs, this.modelMatrix);
    this.dataSource.entities.values.forEach((entity) => {
      if (isUpdatable(entity)) entity.update();
    });
  }

  private updateEntitiesOnOrientationChange() {
    this.sides.forEach((side) => side.updateOnCameraChange());
    this.scalePoints.forEach((scalePoint) => scalePoint.updateOnCameraChange());
  }

  /**
   * Returns true if the box is in camera view.
   */
  private isBoxInCameraView() {
    // This method is unused until we figure out a better way to implement it.
    // The view rectangle is a rectangle on the ellipsoid so
    // intersecting with it wont work correctly for oblique camera angles.
    // We might have to intersect with the camera frustum volume
    // like here: https://stackoverflow.com/questions/58207413/how-to-check-if-a-cesium-entity-is-visible-occluded
    const viewRectangle = computeViewRectangle(this.scene);
    return viewRectangle
      ? Rectangle.contains(
          viewRectangle,
          Cartographic.fromCartesian(this.trs.translation)
        )
      : false;
  }

  /**
   * Create event handlers for interacting with the box.
   */
  private createEventHandler() {
    const scene = this.scene;
    let state: InteractionState = { is: "none" };
    const handlePick = (click: MouseClick) => {
      const pick = scene.pick(click.position);
      const entity = pick?.id;
      if (
        entity === undefined ||
        !isInteractable(entity) ||
        !this.dataSource.entities.contains(entity)
      ) {
        return;
      }

      if (state.is === "picked") {
        handleRelease();
      }

      if (state.is === "hovering") {
        state.entity.onMouseOut({
          startPosition: click.position,
          endPosition: click.position
        });
      }
      state = {
        is: "picked",
        entity,
        beforePickState: {
          isFeaturePickingPaused: this.cesium.isFeaturePickingPaused,
          enableInputs: scene.screenSpaceCameraController.enableInputs
        }
      };
      this.cesium.isFeaturePickingPaused = true;
      scene.screenSpaceCameraController.enableInputs = false;
      entity.onPick(click);
    };

    const handleRelease = () => {
      if (state.is === "picked") {
        this.cesium.isFeaturePickingPaused =
          state.beforePickState.isFeaturePickingPaused;
        scene.screenSpaceCameraController.enableInputs =
          state.beforePickState.enableInputs;
        state.entity.onRelease();
        state = { is: "none" };
      }
    };

    const detectHover = throttle((mouseMove: MouseMove) => {
      const pick = scene.pick(mouseMove.endPosition);
      const entity = pick?.id;
      if (entity === undefined || !isInteractable(entity)) {
        return;
      }

      state = { is: "hovering", entity };
      entity.onMouseOver(mouseMove);
    }, 200);

    const scratchEndPosition = new Cartesian2();
    const scratchStartPosition = new Cartesian2();
    const handleMouseMove = (_mouseMove: MouseMove) => {
      const mouseMove = {
        endPosition: _mouseMove.endPosition.clone(scratchEndPosition),
        startPosition: _mouseMove.startPosition.clone(scratchStartPosition)
      };
      if (state.is === "none") {
        detectHover(mouseMove);
      } else if (state.is === "hovering") {
        const pick = scene.pick(mouseMove.endPosition);
        const entity = pick?.id;
        if (entity !== state.entity) {
          state.entity.onMouseOut(mouseMove);
          if (entity && isInteractable(entity)) {
            state = { is: "hovering", entity };
            entity.onMouseOver(mouseMove);
          } else {
            state = { is: "none" };
          }
        }
      } else if (state.is === "picked") {
        state.entity.onDrag(mouseMove);
      }
    };

    const eventHandler = new ScreenSpaceEventHandler(this.scene.canvas);
    eventHandler.setInputAction(handlePick, ScreenSpaceEventType.LEFT_DOWN);
    eventHandler.setInputAction(handleRelease, ScreenSpaceEventType.LEFT_UP);
    Object.values(KeyboardEventModifier).forEach(
      // Bind the release action to all LEFT_UP + any modifier. This is
      // required because we want the release to happen even if the user is by
      // chance pressing down on some other key. In such cases Cesium will not
      // trigger a LEFT_UP event unless we explicitly pass a modifier.
      (modifier) =>
        eventHandler.setInputAction(
          handleRelease,
          ScreenSpaceEventType.LEFT_UP,
          modifier as any
        )
    );

    eventHandler.setInputAction(
      handleMouseMove,
      ScreenSpaceEventType.MOUSE_MOVE
    );

    const onMouseOutCanvas = (e: MouseEvent) => {
      if (state.is === "hovering") {
        const { x, y } = e;
        state.entity.onMouseOut({
          startPosition: new Cartesian2(x, y),
          endPosition: new Cartesian2(x, y)
        });
        state = { is: "none" };
      }
    };
    scene.canvas.addEventListener("mouseout", onMouseOutCanvas);

    const handler = {
      destroy: () => {
        eventHandler.destroy();
        // When destroying the eventHandler make sure we also release any
        // picked entities and not leave them hanging
        handleRelease();
        scene.canvas.removeEventListener("mouseout", onMouseOutCanvas);
      }
    };
    return handler;
  }

  /**
   * Draw the box.
   */
  private drawBox() {
    this.drawSides();
    this.drawEdges();
    this.drawScalePoints();
  }

  /**
   * Draw sides of the box.
   */
  private drawSides() {
    SIDE_PLANES.forEach((sideLocal) => {
      const side = this.createSide(sideLocal);
      this.dataSource.entities.add(side);
      this.sides.push(side);
    });
  }

  private drawEdges() {
    const localEdges: [Cartesian3, Cartesian3][] = [];
    CORNER_POINT_VECTORS.map((vector, i) => {
      const upPoint = vector;
      const downPoint = Cartesian3.clone(upPoint, new Cartesian3());
      downPoint.z *= -1;

      const nextUpPoint = CORNER_POINT_VECTORS[(i + 1) % 4];
      const nextDownPoint = Cartesian3.clone(nextUpPoint, new Cartesian3());
      nextDownPoint.z *= -1;

      const verticalEdge: [Cartesian3, Cartesian3] = [upPoint, downPoint];
      const topEdge: [Cartesian3, Cartesian3] = [nextUpPoint, upPoint];
      const bottomEdge: [Cartesian3, Cartesian3] = [nextDownPoint, downPoint];
      localEdges.push(verticalEdge, topEdge, bottomEdge);
    });

    localEdges.forEach((localEdge) => {
      const edge = this.createEdge(localEdge);
      this.dataSource.entities.add(edge);
      this.edges.push(edge);
    });
  }

  /**
   * Draw the scale grip points.
   */
  private drawScalePoints() {
    const scalePointVectors = [
      ...CORNER_POINT_VECTORS,
      ...(this.drawNonUniformScaleGrips ? FACE_POINT_VECTORS : [])
    ];

    scalePointVectors.forEach((vector) => {
      const pointLocal1 = vector;
      const pointLocal2 = Cartesian3.multiplyByScalar(
        vector,
        -1,
        new Cartesian3()
      );
      const scalePoint1 = this.createScalePoint(
        pointLocal1,
        Cartesian3.normalize(
          Cartesian3.subtract(pointLocal1, pointLocal2, new Cartesian3()),
          new Cartesian3()
        )
      );
      const scalePoint2 = this.createScalePoint(
        pointLocal2,
        Cartesian3.normalize(
          Cartesian3.subtract(pointLocal2, pointLocal1, new Cartesian3()),
          new Cartesian3()
        )
      );
      scalePoint1.oppositeScalePoint = scalePoint2;
      scalePoint2.oppositeScalePoint = scalePoint1;
      const axisLine = this.createScaleAxisLine(scalePoint1, scalePoint2);
      scalePoint1.axisLine = axisLine;
      scalePoint2.axisLine = axisLine;

      this.dataSource.entities.add(scalePoint1);
      this.dataSource.entities.add(scalePoint2);
      this.dataSource.entities.add(axisLine);
      this.scalePoints.push(scalePoint1, scalePoint2);
    });
  }

  /**
   * Create a box side drawing.
   *
   * @param planeLocal A plane representing the side in local coordinates.
   * @returns side A cesium entity for the box side.
   */
  private createSide(planeLocal: Plane): Side {
    const scene = this.scene;
    const plane = new Plane(Cartesian3.UNIT_X, 0);
    const planeDimensions = new Cartesian3();
    const normalAxis = planeLocal.normal.x
      ? Axis.X
      : planeLocal.normal.y
      ? Axis.Y
      : Axis.Z;
    const style: Readonly<SideStyle> = {
      fillColor: Color.WHITE.withAlpha(0.1),
      outlineColor: Color.WHITE,
      highlightFillColor: Color.WHITE.withAlpha(0.2),
      highlightOutlineColor: Color.CYAN
    };
    let isHighlighted = false;

    const scratchScaleMatrix = new Matrix4();
    const update = () => {
      // From xyz scale set the scale for this plane based on the plane axis
      setPlaneDimensions(this.trs.scale, normalAxis, planeDimensions);

      // Transform the plane using scale matrix so that the plane distance is set correctly
      // Orientation and position are specified as entity parameters.
      const scaleMatrix = Matrix4.fromScale(this.trs.scale, scratchScaleMatrix);
      Plane.transform(planeLocal, scaleMatrix, plane);
    };

    const scratchOutlineColor = new Color();
    const side: Side = new Entity({
      position: new CallbackProperty(() => this.trs.translation, false) as any,
      orientation: new CallbackProperty(() => this.trs.rotation, false) as any,
      plane: {
        show: true,
        plane: new CallbackProperty(() => plane, false),
        dimensions: new CallbackProperty(() => planeDimensions, false),
        fill: true,
        material: new ColorMaterialProperty(
          new CallbackProperty(
            () => (isHighlighted ? style.highlightFillColor : style.fillColor),
            false
          )
        ),
        outline: true,
        outlineColor: new CallbackProperty(
          () =>
            (isHighlighted
              ? style.highlightOutlineColor
              : style.outlineColor
            ).withAlpha(side.isFacingCamera ? 1 : 0.2, scratchOutlineColor),
          false
        ),
        outlineWidth: 1
      }
    }) as Side;

    const axis = planeLocal.normal.x
      ? Axis.X
      : planeLocal.normal.y
      ? Axis.Y
      : Axis.Z;

    const scratchDirection = new Cartesian3();
    const scratchMoveVector = new Cartesian3();
    const scratchEllipsoid = new Ellipsoid();
    const scratchRay = new Ray();
    const scratchCartographic = new Cartographic();
    const scratchPreviousPosition = new Cartesian3();
    const scratchCartesian = new Cartesian3();
    const scratchCurrentPosition = new Cartesian3();
    const scratchMoveStep = new Cartesian3();
    const scratchPickPosition = new Cartesian3();

    const isTopOrBottomSide = axis === Axis.Z;
    const moveStartPos = new Cartesian2();
    const pickedPointOffset = new Cartesian3();
    let dragStart = false;
    let resetPosition = false;

    /**
     * Moves the box when dragging a side.
     *  - When dragging the top or bottom sides, move the box up or down along the z-axis.
     *  - When dragging any other sides move the box along the globe surface.
     */
    const moveBoxOnDragSide = (mouseMove: MouseMove) => {
      const moveUpDown = axis === Axis.Z;
      let moveStep = scratchMoveStep;

      // Get the move direction
      const direction = Cartesian3.normalize(
        Matrix4.multiplyByPointAsVector(
          this.modelMatrix,
          plane.normal,
          scratchDirection
        ),
        scratchDirection
      );

      if (moveUpDown) {
        // Move up or down when dragged on the top or bottom faces
        // moveAmount is proportional to the mouse movement along the provided direction
        const moveAmount = computeMoveAmount(
          scene,
          this.trs.translation,
          direction,
          mouseMove
        );
        // Get the move vector
        const moveVector = Cartesian3.multiplyByScalar(
          direction,
          moveAmount,
          scratchMoveVector
        );

        moveStep = moveVector;
      } else if (this.keepHeightSteadyWhenMovingLaterally) {
        // Move the box laterally on the globe while keeping its height (almost) steady.
        // To do this:
        //   1. Find the exact point on the box surface mouse pick landed.
        //   2. Derive a new ellipsoid such that the picked point on the box
        //      lies on the new ellipsoid surface.
        //   3. Find the point where the camera ray intersects this new
        //      ellipsoid. This intersection point will have the same height as
        //      that of the picked point while also visually coinciding with
        //      the mouse cursor.
        //   4. Use this intersection point to compute the box moveStep

        if (dragStart) {
          // 1. Find the pick position.
          // When starting to drag, find the position on the box surface where
          // the user clicked and remember its distance from the box center.

          const pickedPosition = pickScenePosition(
            scene,
            mouseMove.endPosition,
            scratchPickPosition
          );
          if (!pickedPosition) {
            return;
          }
          // Offset of the pick position from the center of the box
          Cartesian3.subtract(
            pickedPosition,
            this.trs.translation,
            pickedPointOffset
          );
          dragStart = false;
        }

        // 2. Derive a new ellipsoid containing the pick position

        // Current cartesian position of the mouse pointer on the box surface
        const pickedPosition = Cartesian3.add(
          this.trs.translation,
          pickedPointOffset,
          scratchCurrentPosition
        );

        const ellipsoid = scene.globe.ellipsoid;
        const pickedCartographicPosition = Cartographic.fromCartesian(
          pickedPosition,
          ellipsoid,
          scratchCartographic
        );
        const pickedHeight = pickedCartographicPosition.height;

        // Derive an ellipsoid that passes through the pickedPoint
        const pickedPointEllipsoid = deriveEllipsoid(
          ellipsoid,
          pickedCartographicPosition,
          scratchEllipsoid
        );

        // 3. Find the point where the camera ray intersects with the derived ellipsoid
        const cameraRay = scene.camera.getPickRay(
          mouseMove.endPosition,
          scratchRay
        );

        if (!cameraRay) {
          return;
        }

        // Get the intersection between the camera ray and the derived ellipsoid
        // This will be the next position where the picked point should be
        const nextPosition = intersectRayEllipsoid(
          cameraRay,
          pickedPointEllipsoid,
          scratchCartesian
        );
        if (!nextPosition) {
          // there is no intersection point
          return;
        }

        // Force the height of the nextPosition to the height of the picked point
        // This avoids small errors in height from accumulating
        setEllipsoidalHeight(nextPosition, pickedHeight, ellipsoid);

        // 4. Calculate the offset to move the box.
        moveStep = Cartesian3.subtract(nextPosition, pickedPosition, moveStep);
      } else {
        // Move box laterally by picking a next position that lies on the globe
        // surface and along the camera ray.
        const previousPosition =
          screenToGlobePosition(
            scene,
            mouseMove.startPosition,
            scratchPreviousPosition
          ) ??
          scene.camera.pickEllipsoid(
            mouseMove.startPosition,
            undefined,
            scratchPreviousPosition
          );

        const nextPosition =
          screenToGlobePosition(
            scene,
            mouseMove.endPosition,
            scratchCartesian
          ) ??
          scene.camera.pickEllipsoid(
            mouseMove.endPosition,
            undefined,
            scratchCartesian
          );

        if (!nextPosition || !previousPosition) {
          // We couldn't resolve a globe position, maybe because the mouse
          // cursor is pointing up in the sky. Reset the box position when we
          // can find the globe position again.
          resetPosition = true;
          return;
        }

        if (nextPosition && previousPosition) {
          if (resetPosition) {
            Cartesian3.clone(nextPosition, this.trs.translation);
            moveStep = Cartesian3.clone(Cartesian3.ZERO, moveStep);
            resetPosition = false;
          } else {
            Cartesian3.subtract(nextPosition, previousPosition, moveStep);
          }
        }
      }

      // Update box position and fire change event
      this.updateTerrainHeightEstimate();
      this.moveBoxWithClamping(moveStep);
      this.updateBox();
      this.onChange?.({
        isFinished: false,
        modelMatrix: this.modelMatrix,
        translationRotationScale: this.trs
      });
    };

    const highlightSide = () => {
      isHighlighted = true;
    };

    const unHighlightSide = () => {
      isHighlighted = false;
    };

    const highlightAllSides = () => {
      this.sides.forEach((side) => side.highlight());
    };
    const unHighlightAllSides = () =>
      this.sides.forEach((side) => side.unHighlight());

    const onMouseOver = () => {
      highlightAllSides();
      if (isTopOrBottomSide) {
        setCanvasCursor(scene, "n-resize");
      } else {
        setCustomCanvasCursor(scene, "grab", "ew-resize");
      }
    };

    const onMouseOut = () => {
      unHighlightAllSides();
      setCanvasCursor(scene, "auto");
    };

    const onPick = (click: MouseClick) => {
      Cartesian2.clone(click.position, moveStartPos);
      dragStart = true;
      highlightAllSides();
      if (isTopOrBottomSide) {
        setCanvasCursor(scene, "n-resize");
      } else {
        setCustomCanvasCursor(scene, "grabbing", "ew-resize");
      }
    };

    const onPickDisabled = () => {
      setCanvasCursor(scene, "not-allowed");
    };

    const onRelease = () => {
      this.setBoxAboveGround();
      unHighlightAllSides();
      setCanvasCursor(scene, "auto");
      this.onChange?.({
        modelMatrix: this.modelMatrix,
        translationRotationScale: this.trs,
        isFinished: true
      });
    };

    const scratchNormal = new Cartesian3();
    const updateOnCameraChange = () => {
      const normalWc = Cartesian3.normalize(
        Matrix4.multiplyByPointAsVector(
          this.modelMatrix,
          plane.normal,
          scratchNormal
        ),
        scratchNormal
      );
      // The side normals point inwards, so when facing the camera the camera
      // vector also points inwards which gives a positive dot product.
      side.isFacingCamera =
        Cartesian3.dot(normalWc, scene.camera.direction) >= 0;
    };

    // Call enabledFn only if movement is is allowed for this side, otherwise call disabledFn
    const ifActionEnabled = (
      enabledFn: (...args: any[]) => any,
      disabledFn?: (...args: any[]) => any
    ) => {
      return (...args: any[]) => {
        return this.disableVerticalMovement && isTopOrBottomSide
          ? disabledFn?.apply(this, args)
          : enabledFn.apply(this, args);
      };
    };

    side.onMouseOver = ifActionEnabled(onMouseOver);
    side.onMouseOut = ifActionEnabled(onMouseOut);
    side.onPick = ifActionEnabled(onPick, onPickDisabled);
    side.onDrag = ifActionEnabled(moveBoxOnDragSide);
    side.onRelease = ifActionEnabled(onRelease);
    side.highlight = highlightSide;
    side.unHighlight = unHighlightSide;
    side.isFacingCamera = false;
    side.updateOnCameraChange = updateOnCameraChange;
    side.update = update;
    side.isSide = true;
    update();
    return side;
  }

  /**
   * Creates edges for the side specified as plane in local coordinates.
   */
  private createEdge(localEdge: [Cartesian3, Cartesian3]): Edge {
    const scene = this.scene;
    const style = {
      color: Color.WHITE.withAlpha(0.1),
      highlightColor: Color.CYAN.withAlpha(0.7)
    };
    const position1 = new Cartesian3();
    const position2 = new Cartesian3();
    const positions = [position1, position2];

    // Only vertical edges are draggable
    const isDraggableEdge = localEdge[1].z - localEdge[0].z !== 0;

    const update = () => {
      Matrix4.multiplyByPoint(this.modelMatrix, localEdge[0], position1);
      Matrix4.multiplyByPoint(this.modelMatrix, localEdge[1], position2);
    };

    let isHighlighted = false;
    const edge = new Entity({
      polyline: {
        show: true,
        positions: new CallbackProperty(() => positions, false),
        width: new CallbackProperty(() => (isDraggableEdge ? 10 : 0), false),
        material: new ColorMaterialProperty(
          new CallbackProperty(
            () => (isHighlighted ? style.highlightColor : style.color),
            false
          )
        ) as any,
        arcType: ArcType.NONE
      }
    }) as Edge;

    const onMouseOver = () => {
      if (isDraggableEdge) {
        isHighlighted = true;
        setCustomCanvasCursor(scene, "rotate", "pointer");
      }
    };

    const onMouseOut = () => {
      if (isDraggableEdge) {
        isHighlighted = false;
        setCanvasCursor(scene, "auto");
      }
    };

    const onPick = () => {
      if (isDraggableEdge) {
        isHighlighted = true;
        setCustomCanvasCursor(scene, "rotate", "pointer");
      }
    };

    const onRelease = () => {
      if (isDraggableEdge) {
        isHighlighted = false;
        setCanvasCursor(scene, "auto");
        this.onChange?.({
          isFinished: true,
          modelMatrix: this.modelMatrix,
          translationRotationScale: this.trs
        });
      }
    };

    const scratchHpr = new HeadingPitchRoll(0, 0, 0);

    const rotateBoxOnDrag = (mouseMove: MouseMove) => {
      if (!isDraggableEdge) {
        return;
      }

      const dx = mouseMove.endPosition.x - mouseMove.startPosition.x;
      const sensitivity = 0.05;
      const hpr = scratchHpr;
      // -dx because the screen coordinates is opposite to local coordinates space.
      hpr.heading = -dx * sensitivity;
      hpr.pitch = 0;
      hpr.roll = 0;

      Quaternion.multiply(
        this.trs.rotation,
        Quaternion.fromHeadingPitchRoll(hpr),
        this.trs.rotation
      );

      this.updateBox();
      this.updateEntitiesOnOrientationChange();
      this.onChange?.({
        isFinished: false,
        modelMatrix: this.modelMatrix,
        translationRotationScale: this.trs
      });
    };

    edge.update = update;
    edge.onMouseOver = onMouseOver;
    edge.onMouseOut = onMouseOut;
    edge.onPick = onPick;
    edge.onRelease = onRelease;
    edge.onDrag = rotateBoxOnDrag;
    update();
    return edge;
  }

  /**
   * Creates a scale point drawing
   *
   * @param pointLocal The scale point in local coordinates.
   * @returns ScalePoint A cesium entity representing the scale point.
   */
  private createScalePoint(
    pointLocal: Cartesian3,
    direction: Cartesian3
  ): ScalePoint {
    const scene = this.scene;
    const position = new Cartesian3();
    const offsetPosition = new Cartesian3();
    const style: Readonly<ScalePointStyle> = {
      cornerPointColor: Color.RED.brighten(0.5, new Color()),
      facePointColor: Color.BLUE.brighten(0.5, new Color()),
      dimPointColor: Color.GREY.withAlpha(0.2)
    };
    let isFacingCamera = false;

    const getColor = () => {
      return isFacingCamera
        ? isCornerPoint
          ? style.cornerPointColor
          : style.facePointColor
        : style.dimPointColor;
    };

    const scalePointRadii = new Cartesian3();
    const scratchBoundingSphere = new BoundingSphere();
    const updateScalePointRadii = (
      position: Cartesian3,
      boxScale: Cartesian3
    ) => {
      // Get size of a pixel in metres at the position of the bounding shpere
      position.clone(scratchBoundingSphere.center);
      scratchBoundingSphere.radius = 1;
      const pixelSize = scene.camera.getPixelSize(
        scratchBoundingSphere,
        scene.drawingBufferWidth,
        scene.drawingBufferHeight
      );

      const maxBoxScale = Cartesian3.maximumComponent(boxScale);

      // Compute radius equivalent to 10 pixels or 0.1 times the box scale whichever is smaller
      const radius = Math.min(pixelSize * 10, maxBoxScale * 0.1);
      scalePointRadii.x = radius;
      scalePointRadii.y = radius;
      scalePointRadii.z = radius;
      return scalePointRadii;
    };

    const scratchOffset = new Cartesian3();
    const scratchMatrix = new Matrix4();
    const update = () => {
      // Update grip position
      Matrix4.multiplyByPoint(this.modelMatrix, pointLocal, position);

      // Update the size of scale points
      updateScalePointRadii(position, this.trs.scale);

      // Compute an offset for grips that lie on a face. Without the offset,
      // half of the grip will be inside the box thus reducing the clickable
      // surface area and creating a bad user experience. So, we want to push
      // most of the grip outside the box. Here we compute an offset 0.9 times
      // the radius of the point and in an outward direction from the center of
      // the box.
      const offset = isCornerPoint
        ? Cartesian3.ZERO // skip for corner points
        : Cartesian3.multiplyByScalar(
            // Transform the direction into world co-ordinates, but ignore the scaling
            Matrix4.multiplyByPointAsVector(
              Matrix4.setScale(this.modelMatrix, Cartesian3.ONE, scratchMatrix),
              direction,
              scratchOffset
            ),
            // assuming the grip point has uniform radii
            scalePointRadii.x * 0.9,
            scratchOffset
          );

      Cartesian3.add(position, offset, offsetPosition);
    };

    let isHighlighted = false;
    const scratchColor = new Color();
    const scalePoint: ScalePoint = new Entity({
      position: new CallbackProperty(() => offsetPosition, false) as any,
      orientation: new CallbackProperty(
        () => Quaternion.IDENTITY,
        false
      ) as any,

      // Sphere for the scale point
      ellipsoid: {
        radii: new CallbackProperty(
          // update scale point radii to reflect camera distance changes
          () => updateScalePointRadii(position, this.trs.scale),
          false
        ),
        material: new ColorMaterialProperty(
          new CallbackProperty(
            () => getColor().brighten(isHighlighted ? -0.5 : 0.0, scratchColor),
            false
          )
        )
      }
    }) as ScalePoint;

    // Calculate dot product with x, y & z axes
    const axisLocal = Cartesian3.normalize(pointLocal, new Cartesian3());
    const xDot = Math.abs(Cartesian3.dot(new Cartesian3(1, 0, 0), axisLocal));
    const yDot = Math.abs(Cartesian3.dot(new Cartesian3(0, 1, 0), axisLocal));
    const zDot = Math.abs(Cartesian3.dot(new Cartesian3(0, 0, 1), axisLocal));
    const isCornerPoint = xDot && yDot && zDot;
    const isProportionalScaling = isCornerPoint;

    // Return the angle in clockwise direction to rotate the mouse
    // cursor so that it points towards the center of the box.
    const getCursorRotation = (mousePos: Cartesian2) => {
      const boxCenter = scene.cartesianToCanvasCoordinates(
        this.trs.translation
      );
      // mouse coords relative to the box center
      const x = mousePos.x - boxCenter.x;
      const y = mousePos.y - boxCenter.y;

      // Math.atan2 gives the angle the (x, y) point makes with the positive
      // x-axes in the clockwise direction
      const angle = CesiumMath.toDegrees(Math.atan2(y, x));
      return angle;
    };

    const onMouseOver = (mouseMove: MouseMove) => {
      scalePoint.axisLine.show = true;
      highlightScalePoint();
      //cursor(mouseMove.endPosition);
      //setCanvasCursor(scene, cursorDirection);
      const cursorRotation = getCursorRotation(mouseMove.endPosition);
      setCustomCanvasCursor(scene, "resize", "ew-resize", cursorRotation);
    };

    const onPick = (mouseClick: MouseClick) => {
      scalePoint.axisLine.show = true;
      highlightScalePoint();

      const cursorRotation = getCursorRotation(mouseClick.position);
      setCustomCanvasCursor(scene, "resize", "ew-resize", cursorRotation);
    };

    const onRelease = () => {
      scalePoint.axisLine.show = false;
      unHighlightScalePoint();
      this.onChange?.({
        modelMatrix: this.modelMatrix,
        translationRotationScale: this.trs,
        isFinished: true
      });
      setCanvasCursor(scene, "auto");
    };

    const onMouseOut = () => {
      scalePoint.axisLine.show = false;
      unHighlightScalePoint();
      setCanvasCursor(scene, "auto");
    };

    // Axis for proportional scaling
    const proportionalScalingAxis = new Cartesian3(1, 1, 1);

    const scratchOppositePosition = new Cartesian3();
    const scratchAxisVector = new Cartesian3();
    const scratchMoveDirection = new Cartesian3();
    const scratchMultiply = new Cartesian3();
    const scratchAbs = new Cartesian3();
    const scratchScaleStep = new Cartesian3();
    const scratchMoveStep = new Cartesian3();
    const scratchCartographic = new Cartographic();

    /**
     * Scales the box proportional to the mouse move when dragging the scale point.
     * Scaling occurs along the axis connecting the opposite scaling point.
     * Additionally we make sure:
     *   - That scaling also keeps opposite side of the box stationary.
     *   - The box does not get smaller than 20px on any side at the current zoom level.
     */
    const scaleBoxOnDrag = (mouseMove: MouseMove) => {
      // Find the direction to scale in
      const oppositePosition = scalePoint.oppositeScalePoint.position.getValue(
        JulianDate.now(),
        scratchOppositePosition
      );
      if (oppositePosition === undefined) return;
      const axisVector = Cartesian3.subtract(
        position,
        oppositePosition,
        scratchAxisVector
      );
      const length = Cartesian3.magnitude(axisVector);
      const scaleDirection = Cartesian3.normalize(
        axisVector,
        scratchMoveDirection
      );

      // scaleAmount is a measure of how much to scale in the given direction
      // for the given mouse movement.
      const { scaleAmount, pixelLengthAfterScaling } = computeScaleAmount(
        this.scene,
        position,
        scaleDirection,
        length,
        mouseMove
      );

      // When downscaling, stop at 20px length.
      if (scaleAmount < 0) {
        const isDiagonal = axisLocal.x && axisLocal.y && axisLocal.y;
        const pixelSideLengthAfterScaling = isDiagonal
          ? pixelLengthAfterScaling / Math.sqrt(2)
          : pixelLengthAfterScaling;
        if (pixelSideLengthAfterScaling < 20) {
          // Do nothing if scaling down will make the box smaller than 20px
          return;
        }
      }

      // Compute scale components along xyz
      const scaleStep = Cartesian3.multiplyByScalar(
        // Taking abs because scaling step is independent of axis direction
        // Scaling step is negative when scaling down and positive when scaling up
        Cartesian3.abs(
          // Extract scale components along the axis
          Cartesian3.multiplyComponents(
            this.trs.scale,
            // For proportional scaling we scale equally along xyz
            isProportionalScaling ? proportionalScalingAxis : axisLocal,
            scratchMultiply
          ),
          scratchAbs
        ),
        scaleAmount,
        scratchScaleStep
      );

      // Move the box by half the scale amount in the direction of scaling so
      // that the opposite end remains stationary.
      const moveStep = Cartesian3.multiplyByScalar(
        axisVector,
        scaleAmount / 2,
        scratchMoveStep
      );

      // Prevent scaling in Z axis if it will result in the box going underground.
      const isDraggingBottomScalePoint = axisLocal.z < 0;
      const isUpscaling = scaleAmount > 0;
      if (
        this.keepBoxAboveGround &&
        isUpscaling &&
        isDraggingBottomScalePoint
      ) {
        const boxCenterHeight = Cartographic.fromCartesian(
          this.trs.translation,
          undefined,
          scratchCartographic
        ).height;
        const bottomHeight = boxCenterHeight - this.trs.scale.z / 2;
        const bottomHeightAfterScaling = bottomHeight - Math.abs(moveStep.z);
        if (bottomHeightAfterScaling < 0) {
          scaleStep.z = 0;
        }
      }

      // Apply scale
      Cartesian3.add(this.trs.scale, scaleStep, this.trs.scale);

      // Move the box
      this.moveBoxWithClamping(moveStep);

      this.updateBox();
      this.onChange?.({
        isFinished: false,
        modelMatrix: this.modelMatrix,
        translationRotationScale: this.trs
      });
    };

    const adjacentSides = this.sides.filter((side) => {
      const plane = side.plane.plane?.getValue(JulianDate.now());
      const isAdjacent = Cartesian3.dot(plane.normal, axisLocal) < 0;
      return isAdjacent;
    });

    const updateOnCameraChange = () => {
      isFacingCamera = adjacentSides.some((side) => side.isFacingCamera);
    };

    const highlightScalePoint = () => {
      isHighlighted = true;
    };

    const unHighlightScalePoint = () => {
      isHighlighted = false;
    };

    scalePoint.onPick = onPick;
    scalePoint.onRelease = onRelease;
    scalePoint.onMouseOver = onMouseOver;
    scalePoint.onMouseOut = onMouseOut;
    scalePoint.onDrag = scaleBoxOnDrag;
    scalePoint.update = update;
    scalePoint.updateOnCameraChange = updateOnCameraChange;
    update();
    return scalePoint;
  }

  /**
   * Create an axis line drawing between two scale points.
   */
  private createScaleAxisLine(
    scalePoint1: ScalePoint,
    scalePoint2: ScalePoint
  ): Entity {
    const position1 = scalePoint1.position?.getValue(JulianDate.now());
    const position2 = scalePoint2.position?.getValue(JulianDate.now());
    const scaleAxis = new Entity({
      show: false,
      polyline: {
        positions: new CallbackProperty(
          () => [position1, position2],
          false
        ) as any,
        material: new PolylineDashMaterialProperty({
          color: Color.CYAN,
          dashLength: 8
        }),
        arcType: ArcType.NONE
      }
    });
    return scaleAxis;
  }
}

const scratchMouseVector2d = new Cartesian2();
const scratchScreenVector2d = new Cartesian2();
const scratchScreenNormal2d = new Cartesian2();

/**
 * Computes the amount by which to move a vector proportional to the provided
 * mouse movement.
 *
 * @param position The world position at which move starts
 * @param direction The direction in which to move
 * @param mouseMove The mouse movement
 * @returns moveAmount The amount by which to move the vector
 */
function computeMoveAmount(
  scene: Scene,
  position: Cartesian3,
  direction: Cartesian3,
  mouseMove: MouseMove
): number {
  const mouseVector2d = Cartesian2.subtract(
    mouseMove.endPosition,
    mouseMove.startPosition,
    scratchMouseVector2d
  );

  const screenVector2d = screenProjectVector(
    scene,
    position,
    direction,
    1,
    scratchScreenVector2d
  );

  const screenNormal2d = Cartesian2.normalize(
    screenVector2d,
    scratchScreenNormal2d
  );
  const moveAmountPixels = Cartesian2.dot(mouseVector2d, screenNormal2d);
  const pixelsPerStep = Cartesian2.magnitude(screenVector2d);
  const moveAmount = moveAmountPixels / pixelsPerStep;
  return moveAmount;
}

/**
 * Computes amount by which to scale a vector proportional to the provided mouse movement.
 *
 * @param scene
 * @param position Position in world coordinates where the move starts
 * @param direction Direction of the move vector
 * @param length Length of the move vector
 * @param mouseMove Mouse movement
 * @returns Amount by which to scale the vector and the estimated length in pixels after scaling
 */
function computeScaleAmount(
  scene: Scene,
  position: Cartesian3,
  direction: Cartesian3,
  length: number,
  mouseMove: MouseMove
) {
  const mouseVector2d = Cartesian2.subtract(
    mouseMove.endPosition,
    mouseMove.startPosition,
    scratchMouseVector2d
  );

  // Project the vector of unit length to the screen
  const screenVector2d = screenProjectVector(
    scene,
    position,
    direction,
    1,
    scratchScreenVector2d
  );
  const screenNormal2d = Cartesian2.normalize(
    screenVector2d,
    scratchScreenNormal2d
  );

  const pixelsPerStep = Cartesian2.magnitude(screenVector2d);
  const moveAmountPixels = Cartesian2.dot(mouseVector2d, screenNormal2d);
  const moveAmount = moveAmountPixels / pixelsPerStep;
  const scaleAmount = moveAmount / length;
  const pixelLengthAfterScaling =
    pixelsPerStep * length + pixelsPerStep * length * scaleAmount;
  return { scaleAmount, pixelLengthAfterScaling };
}

const scratchNearPoint2d = new Cartesian2();
const scratchFarPoint2d = new Cartesian2();
const scratchRay = new Ray();
function screenProjectVector(
  scene: Scene,
  position: Cartesian3,
  direction: Cartesian3,
  length: number,
  result: Cartesian2
): Cartesian2 {
  const ray = scratchRay;
  ray.origin = position;
  ray.direction = direction;
  const nearPoint2d = scene.cartesianToCanvasCoordinates(
    Ray.getPoint(ray, 0),
    scratchNearPoint2d
  );

  const farPoint2d = scene.cartesianToCanvasCoordinates(
    Ray.getPoint(ray, length),
    scratchFarPoint2d
  );
  const screenVector2d = Cartesian2.subtract(farPoint2d, nearPoint2d, result);
  return screenVector2d;
}

/**
 * Converts given xy screen coordinate to a position on the globe surface.
 *
 * @param scene
 * @param position The xy screen coordinate
 * @param result Cartesian3 object to store the result
 * @returns The result object set to the converted position on the globe surface
            or undefined if a globe position could not be found.
*/
const scratchPickRay = new Ray();
export function screenToGlobePosition(
  scene: Scene,
  position: Cartesian2,
  result: Cartesian3
): Cartesian3 | undefined {
  const pickRay = scene.camera.getPickRay(position, scratchPickRay);
  if (!isDefined(pickRay)) {
    return undefined;
  }

  const globePosition = scene.globe.pick(pickRay, scene, result);
  return globePosition;
}

function setPlaneDimensions(
  boxDimensions: Cartesian3,
  planeNormalAxis: Axis,
  planeDimensions: Cartesian2
) {
  if (planeNormalAxis === Axis.X) {
    planeDimensions.x = boxDimensions.y;
    planeDimensions.y = boxDimensions.z;
  } else if (planeNormalAxis === Axis.Y) {
    planeDimensions.x = boxDimensions.x;
    planeDimensions.y = boxDimensions.z;
  } else if (planeNormalAxis === Axis.Z) {
    planeDimensions.x = boxDimensions.x;
    planeDimensions.y = boxDimensions.y;
  }
}

const scratchRadii = new Cartesian3();

/**
 * Derives a new ellipsoid with surface containing the given position.
 *
 * Note that it is not clear whether the resulting shape obtained by adding the
 * height is a true ellipsoid. However, this works out ok for our purpose.
 */
function deriveEllipsoid(
  ellipsoid: Ellipsoid,
  cartographicPosition: Cartographic,
  result: Ellipsoid
): Ellipsoid {
  const height = cartographicPosition.height;
  const newRadii = ellipsoid.radii.clone(scratchRadii);
  newRadii.x += height;
  newRadii.y += height;
  newRadii.z += height;
  const derivedEllipsoid = Ellipsoid.fromCartesian3(newRadii, result);
  return derivedEllipsoid;
}

/**
 * Returns the nearest point of intersection between the ray and the ellipsoid
 * that lies on the ellipsoid.
 */
function intersectRayEllipsoid(
  ray: Ray,
  ellipsoid: Ellipsoid,
  result: Cartesian3
): Cartesian3 | undefined {
  const interval = IntersectionTests.rayEllipsoid(ray, ellipsoid);
  if (!interval) {
    // there is no intersection point
    return;
  }

  // start=0 means ray origin is inside the ellipsoid
  // in which case there is only a single intersection
  // which is given by stop.
  // This can happen, for eg, when moving the box while the camera
  // is below the box.
  const t = interval.start !== 0 ? interval.start : interval.stop;
  const intersectionPoint = Ray.getPoint(ray, t, result);
  return intersectionPoint;
}

const scratchViewRectangle = new Rectangle();
function computeViewRectangle(scene: Scene) {
  return scene.camera.computeViewRectangle(undefined, scratchViewRectangle);
}

function setCanvasCursor(scene: Scene, cursorType: string) {
  scene.canvas.style.cursor = cursorType;
}

/**
 * Set canvas cursor to the custom cursor also applying the rotation on the cursor
 *
 * @param type Custom cursor type
 * @param fallback The standard cusrsor to use as fallback (See https://developer.mozilla.org/en-US/docs/Web/CSS/cursor)
 * @param rotation Then angle in clockwise direction to rotate the custom cursor
 */
function setCustomCanvasCursor(
  scene: Scene,
  type: CustomCursorType,
  fallback: string,
  rotation = 0
) {
  setCanvasCursor(scene, getCustomCssCursor({ type, fallback, rotation }));
}

/**
 *  Returns the Cartesian position for the window position.
 */
function pickScenePosition(
  scene: Scene,
  windowPosition: Cartesian2,
  result: Cartesian3
): Cartesian3 | undefined {
  if (!scene.pickPositionSupported) {
    return undefined;
  }
  const savedPickTranslucentDepth = scene.pickTranslucentDepth;
  scene.pickTranslucentDepth = true;
  const pickPosition = scene.pickPosition(windowPosition, result);
  scene.pickTranslucentDepth = savedPickTranslucentDepth;
  return pickPosition;
}

const scratchCartographicPos = new Cartographic();
function setEllipsoidalHeight(
  position: Cartesian3,
  height: number | ((currentHeight: number) => number),
  ellipsoid: Ellipsoid
) {
  const cartographicPos = Cartographic.fromCartesian(
    position,
    ellipsoid,
    scratchCartographicPos
  );
  cartographicPos.height =
    typeof height === "function" ? height(cartographicPos.height) : height;
  Cartographic.toCartesian(cartographicPos, ellipsoid, position);
}
