import React from "react";
import { ITextProps } from "../Text";

export type ICheckboxProps = {
  /** Sets whether the checkbox begins checked. */
  defaultChecked?: boolean;
  /** id assigned to input */
  id?: string;
  /** Callback to receive a reference.  */
  inputRef?: (input: HTMLInputElement | null | undefined) => any;
  /** Sets whether the checkbox is checked or unchecked. */
  isChecked?: boolean;
  /** Sets whether the checkbox is disabled. */
  isDisabled?: boolean;
  /**
   * Sets whether the checkbox is indeterminate. This only affects the style and
   * does not modify the isChecked property.
   */
  isIndeterminate?: boolean;
  /** Sets whether the checkbox should take up the full width of the parent. */
  isFullWidth?: boolean;
  /** Title of the html component */
  title?: string;
  /** The name of the submitted field in a checkbox. */
  name?: string;
  /** Whether to use "switch" icons instead */
  isSwitch?: boolean;
  /**
   * Function that is called whenever the state of the checkbox changes. It will
   * be called with an object containing the react synthetic event. Use
   * currentTarget to get value, name and checked
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => any;
  /** The value to be used in the checkbox input. This is the value that will be
   * returned on form submission. */
  value?: number | string;

  /**
   * Children to render next to checkbox. This should be used for label. Css
   * style `font-size: inherit` and props `isDisabled` and `isChecked` will be
   * applied to all child elements.
   */
  children?: React.ReactChild;

  textProps?: ITextProps;

  /**
   * Accepting className lets allows the Checkbox component to be extended using
   * styled components.
   */
  className?: string;
};

export interface CheckboxIconProps {
  /* Override svg icon to use switch icon */
  isSwitch?: boolean;
  /** Sets whether the checkbox is checked or unchecked. */
  isChecked?: boolean;
  /** Sets whether the checkbox is disabled. */
  isDisabled?: boolean;
  /**
   * Sets whether the checkbox is indeterminate. This only affects the style and
   * does not modify the isChecked property.
   */
  isIndeterminate?: boolean;
}
