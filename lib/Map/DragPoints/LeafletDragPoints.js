import defined from "terriajs-cesium/Source/Core/defined";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";

/**
 * Callback for when a point is moved.
 * @callback PointMovedCallback
 * @param {CustomDataSource} customDataSource Contains all point entities that user has selected so far
 */

/**
 * For letting user drag existing points in Leaflet ViewerMode only.
 *
 * @alias LeafletDragPoints
 * @constructor
 *
 * @param {Terria} terria The Terria instance.
 * @param {PointMovedCallback} pointMovedCallback A function that is called when a point is moved.
 */
const LeafletDragPoints = function (terria, pointMovedCallback) {
  this._terria = terria;
  this._setUp = false;
  this.type = "Leaflet";

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
LeafletDragPoints.prototype.setUp = function () {
  if (this._setUp) {
    return;
  }
  if (!defined(this._terria.leaflet) || !defined(this._terria.leaflet.map)) {
    // Test context or something has gone *so* badly wrong
    return;
  }
  this._terria.leaflet.scene.featureMousedown.addEventListener(
    this._onMouseDownOnPoint,
    this
  );
  this._setUp = true;
};

/**
 * Function that is called when the user clicks and holds on a point that was previously drawn.
 *
 * @param {Entity} entity The entity that user mouse downs on.
 */
LeafletDragPoints.prototype._onMouseDownOnPoint = function (entity) {
  if (
    !defined(this._draggableObjects.entities) ||
    this._draggableObjects.entities.length === 0
  ) {
    return;
  }

  const dragEntity = this._draggableObjects.entities.values.filter(function (
    dragObjEntity
  ) {
    // Not necessarily same entity, but will have same id.
    return dragObjEntity.id === entity.id;
  })[0];
  if (defined(dragEntity)) {
    // The touch events below don't actually work because Leaflet doesn't
    // expose these events.  See here for a possible workaround:
    // https://github.com/Leaflet/Leaflet/issues/1542
    this._terria.leaflet.map.on("mousemove", this._onMouseMove, this);
    this._terria.leaflet.map.on("touchmove", this._onMouseMove, this);
    this._terria.leaflet.map.on("mouseup", this._onMouseUp, this);
    this._terria.leaflet.map.on("touchend", this._onMouseUp, this);

    this._dragInProgress = true;
    this._entityDragged = dragEntity;

    this._terria.currentViewer.pauseMapInteraction();
    this._originalPosition = dragEntity.position;
  }
};

/**
 * Function that is called when the mouse moves.
 *
 * @param {Leaflet.MouseEvent} move Information about the move such as the final position of the mouse.
 */
LeafletDragPoints.prototype._onMouseMove = function (move) {
  if (!this._dragInProgress) {
    return;
  }
  this.dragCount = this.dragCount + 1;
  if (defined(this._entityDragged)) {
    this._entityDragged.position = Cartesian3.fromDegrees(
      move.latlng.lng,
      move.latlng.lat
    );
  }
};

/**
 * Function that is called when the user releases the mousedown click.
 *
 * @param {Leaflet.MouseEvent} e Information about where the event occurred.
 */
LeafletDragPoints.prototype._onMouseUp = function (e) {
  if (
    this._dragInProgress &&
    Cartesian3.fromDegrees(e.latlng.lng, e.latlng.lat) !==
      this._originalPosition
  ) {
    this._pointMovedCallback(this._draggableObjects);
  }
  this._terria.leaflet.map.off("mousemove", this._onMouseMove, this);
  this._terria.leaflet.map.off("touchmove", this._onMouseMove, this);
  this._terria.leaflet.map.off("mouseup", this._onMouseUp, this);
  this._terria.leaflet.map.off("touchend", this._onMouseUp, this);
  this._dragInProgress = false;
  this._terria.currentViewer.resumeMapInteraction();
};

/**
 * Update the list of draggable objects with a new list of entities that are able to be dragged. We are only interested
 * in entities that the user has drawn.
 *
 * @param {CustomDataSource} entities Entities that user has drawn on the map.
 */
LeafletDragPoints.prototype.updateDraggableObjects = function (entities) {
  this._draggableObjects = entities;
};

/**
 * A clean up function to call when destroying the object.
 */
LeafletDragPoints.prototype.destroy = function () {
  this._setUp = false;
};

export default LeafletDragPoints;
