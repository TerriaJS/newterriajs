import { HTMLProps, ChangeEventHandler, Ref, forwardRef } from "react";

export interface HiddenCheckboxProps extends HTMLProps<HTMLInputElement> {
  disabled?: boolean;
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  value?: number | string;
  name?: string;
  isIndeterminate?: boolean;
}
export default forwardRef(function HiddenCheckbox(
  { isIndeterminate, ...props }: HiddenCheckboxProps,
  ref: Ref<HTMLInputElement>
) {
  return (
    <input
      type="checkbox"
      ref={ref}
      aria-checked={isIndeterminate ? "mixed" : props.checked}
      css={{
        appearance: "none",
        clip: "rect(0 0 0 0)",
        overflow: "hidden",
        position: "absolute",
        width: 0,
        margin: 0,
        padding: 0,
        border: 0
      }}
      {...props}
    />
  );
});
