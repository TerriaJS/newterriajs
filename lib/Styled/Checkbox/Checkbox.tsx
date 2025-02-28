import {
  Children,
  isValidElement,
  cloneElement,
  ChangeEvent,
  forwardRef,
  memo,
  ReactElement,
  Ref,
  useCallback,
  useState
} from "react";
import { useUID } from "react-uid";
import { TextSpan } from "../Text";
import { SpacingSpan } from "../Spacing";
import CheckboxIcon from "./Elements/CheckboxIcon";
import HiddenCheckbox from "./Elements/HiddenCheckbox";
import { ICheckboxProps } from "./types";

const Checkbox = forwardRef(function Checkbox(
  props: ICheckboxProps,
  ref: Ref<HTMLInputElement>
) {
  const {
    isChecked: isCheckedProp,
    isDisabled = false,
    defaultChecked = false,
    isIndeterminate = false,
    onChange: onChangeProps,
    title,
    name,
    value,
    children,
    textProps,
    className,
    ..._rest
  } = props;

  const [isCheckedState, setIsCheckedState] = useState(
    isCheckedProp !== undefined ? isCheckedProp : defaultChecked
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setIsCheckedState(e.target.checked);
      if (onChangeProps) {
        onChangeProps(e);
      }
    },
    [onChangeProps]
  );

  // Use isChecked from the state if it is controlled
  const isChecked =
    isCheckedProp === undefined ? isCheckedState : isCheckedProp;
  const id = useUID();

  // Add props to children
  const childrenWithProps = Children.map(children, (child) => {
    // Checking isValidElement is the safe way and avoids a typescript
    // error too.
    if (isValidElement(child)) {
      return cloneElement(
        child as ReactElement<{
          isDisabled: boolean;
          isChecked: boolean;
          style: any;
        }>,
        {
          isDisabled,
          isChecked,
          style: { fontSize: "inherit" }
        }
      );
    }
    return child;
  });

  return (
    <TextSpan
      as={"label"}
      title={title}
      htmlFor={`checkbox-${id}`}
      className={className}
      css={`
        display: flex;
        flex-shrink: 0;
        align-items: center;
        &:focus-within {
          //copy the global focus
          outline: 3px solid #c390f9;
        }
        ${!isDisabled &&
        `
            cursor: pointer;
            &:hover svg {
              opacity: 0.6;
            }
          `}
        ${isDisabled &&
        `
            cursor: not-allowed;
          `}
      `}
      {...textProps}
    >
      <HiddenCheckbox
        disabled={isDisabled}
        checked={isChecked}
        onChange={onChange}
        value={value}
        name={name}
        id={`checkbox-${id}`}
        ref={ref}
      />
      <CheckboxIcon
        isIndeterminate={isIndeterminate}
        isChecked={isChecked}
        isDisabled={isDisabled}
      />
      <SpacingSpan right={1} />
      {childrenWithProps}
    </TextSpan>
  );
});

Checkbox.displayName = "Checkbox";

export default memo(Checkbox);
