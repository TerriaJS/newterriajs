import defined from "terriajs-cesium/Source/Core/defined";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";

/**
 * Callback for when a point is moved.
 * @callback PointMovedCallback
 * @param {CustomDataSource} customDataSource Contains all point entities that user has selected so far
 */

/**
 * For letting user drag existing points in Cesium ViewerModes only.
 *
 * @alias CesiumDragPoints
 * @constructor
 *
 * @param {Terria} terria The Terria instance.
 * @param {PointMovedCallback} pointMovedCallback A function that is called when a point is moved.
 */
const CesiumDragPoints = function (terria, pointMovedCallback) {
  this._terria = terria;
  this._setUp = false;
  this.type = "Cesium";

  /**
   * Callback that occurs when point is moved. Function takes a CustomDataSource which is a list of PointEntities.
   * @type {PointMovedCallback}
   * @default undefined
   */
  this._pointMovedCallback = pointMovedCallback;

  /**
   * List of entities that can be dragged, which is populated with user-created points only.
   * @type {CustomDataSource}
   */
  this._draggableObjects = new CustomDataSource();

  /**
   * Whether user is currently dragging point.
   * @type {Boolean}
   */
  this._dragInProgress = false;

  /**
   * For determining whether a drag has just occurred, to avoid deleting a point at the end of the drag.
   * @type {Number}
   */
  this.dragCount = 0;
};

/**
 * Set up the drag point helper so that attempting to drag a point will move the point.
 */
CesiumDragPoints.prototype.setUp = function () {
  if (this._setUp) {
    return;
  }
  if (
    !defined(this._terria.cesium) ||
    !defined(this._terria.cesium.scene) ||
    !defined(this._terria.cesium.cesiumWidget)
  ) {
    // Test context or something has gone *so* badly wrong
    return;
  }
  this._scene = this._terria.cesium.scene;
  this._viewer = this._terria.cesium.cesiumWidget;
  this._mouseHandler = new ScreenSpaceEventHandler(this._scene.canvas, false);

  const that = this;

  // Mousedown event. This is called for all mousedown events, not just mousedown on entity events like the Leaflet
  // equivalent.
  this._mouseHandler.setInputAction(function (click) {
    if (
      !defined(that._draggableObjects.entities) ||
      that._draggableObjects.entities.length === 0
    ) {
      return;
    }
    const pickedObject = that._scene.pick(click.position);
    that._originalPosition = click.position;
    if (defined(pickedObject)) {
      const pickedEntity = pickedObject.id;
      const draggedEntity = that._draggableObjects.entities.values.filter(
        function (dragObjEntity) {
          return dragObjEntity.id === pickedEntity.id;
        }
      )[0];
      if (draggedEntity) {
        that._dragInProgress = true;
        that._entityDragged = draggedEntity;
        that._setCameraMotion(false);
      }
    }
  }, ScreenSpaceEventType.LEFT_DOWN);

  // Mouse move event.
  this._mouseHandler.setInputAction(function (move) {
    if (!that._dragInProgress) {
      return;
    }
    that.dragCount = that.dragCount + 1;
    const pickRay = that._viewer.camera.getPickRay(move.endPosition);
    const cartesian = that._scene.globe.pick(pickRay, that._scene);
    that._entityDragged.position = cartesian;
    for (let i = 0; i < that._draggableObjects.entities.values.length; i++) {
      if (
        that._draggableObjects.entities.values[i].id === that._entityDragged.id
      ) {
        that._draggableObjects.entities.values[i].position = cartesian;
      }
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);

  // Mouse release event.
  this._mouseHandler.setInputAction(function (mouseUp) {
    if (that._dragInProgress && mouseUp.position !== that._originalPosition) {
      that._pointMovedCallback(that._draggableObjects);
    }
    that._dragInProgress = false;
    that._setCameraMotion(true);
  }, ScreenSpaceEventType.LEFT_UP);

  this._setUp = true;
};

/**
 * Update the list of draggable objects with a new list of entities that are able to be dragged. We are only interested
 * in entities that the user has drawn.
 *
 * @param {CustomDataSource} entities Entities that user has drawn on the map.
 */
CesiumDragPoints.prototype.updateDraggableObjects = function (entities) {
  this._draggableObjects = entities;
};

/**
 * A clean up function to call when destroying the object.
 */
CesiumDragPoints.prototype.destroy = function () {
  if (defined(this._mouseHandler)) {
    this._mouseHandler.destroy();
    this._setUp = false;
  }
};

/**
 * Enable or disable camera motion, so that the user can drag a point rather than dragging the map.
 * @param {Boolean} state True to enable and false to disable camera motion.
 * @private
 */
CesiumDragPoints.prototype._setCameraMotion = function (state) {
  this._scene.screenSpaceCameraController.enableRotate = state;
  this._scene.screenSpaceCameraController.enableZoom = state;
  this._scene.screenSpaceCameraController.enableLook = state;
  this._scene.screenSpaceCameraController.enableTilt = state;
  this._scene.screenSpaceCameraController.enableTranslate = state;
};

export default CesiumDragPoints;
