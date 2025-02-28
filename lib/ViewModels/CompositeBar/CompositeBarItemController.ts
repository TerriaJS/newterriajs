import { makeObservable, observable, runInAction } from "mobx";
import { RefObject, createRef } from "react";
import ViewerMode from "../../Models/ViewerMode";

export interface ICompositeBarItemController {
  readonly id: string;
  active: boolean;
  disabled: boolean;
  collapsed: boolean;
  pinned: boolean;
  visible: boolean;
  readonly glyph: any;
  readonly viewerMode: ViewerMode | undefined;
  itemRef: RefObject<HTMLDivElement>;
}

export abstract class CompositeBarItemController
  implements ICompositeBarItemController
{
  static id: string;
  itemRef: RefObject<HTMLDivElement> = createRef();

  constructor() {
    makeObservable(this);
  }

  get id() {
    return CompositeBarItemController.id;
  }

  /**
   * Whether this item is disabled
   * @private
   */
  @observable
  private _disabled: boolean = false;

  /**
   * Gets the {@link this._disabled}
   */
  get disabled(): boolean {
    return this._disabled;
  }

  /**
   * Sets the {@link this._disabled}
   * @param value
   */
  set disabled(value: boolean) {
    this._disabled = value;
  }

  /**
   * Whether this item is collapsed
   * @private
   */
  @observable
  private _collapsed: boolean = false;

  /**
   * Gets the {@this._collapsed}
   */
  get collapsed(): boolean {
    return this._collapsed;
  }

  /**
   * Sets the {@this._collapsed}
   */
  set collapsed(value: boolean) {
    this._collapsed = value;
  }

  /**
   * Whether this item is active
   * @protected
   */
  @observable
  protected _active: boolean = false;

  /**
   * Gets the {@link this._active}
   */
  get active(): boolean {
    return !this.disabled && this._active;
  }

  /**
   * Whether this item is pinned, if item is pinned it will be always visible on screen.
   * @private
   */
  @observable
  private _pinned: boolean = false;

  /**
   * Gets the {@link this._pinned}
   */
  get pinned() {
    return this._pinned;
  }

  /**
   * Sets the {@link this._pinned}
   */
  set pinned(value: boolean) {
    this._pinned = value;
  }

  /**
   * Whether this item is visible on the screen.
   * @private
   */
  @observable
  private _visible: boolean = true;

  /**
   * Gets the {@link this._visible}
   */
  get visible(): boolean {
    return this._visible;
  }

  setVisible(v: boolean) {
    runInAction(() => {
      this._visible = v;
    });
  }

  /**
   * Glyph to be shown with this item.
   */
  abstract get glyph(): { id: string };

  /**
   * Get viewer on which this item should be visible. If undefined item will be visible in both viewers.
   */
  abstract get viewerMode(): ViewerMode | undefined;

  /**
   * What should happen after clicking on this item.
   */
  abstract handleClick(): void;
}
