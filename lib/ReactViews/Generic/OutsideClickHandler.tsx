import { FC, useCallback, useEffect, useRef } from "react";

interface OutsideClickHandlerProps {
  children: React.ReactNode;
  disabled?: boolean;
  onOutsideClick: (e: MouseEvent) => void;
}

export const CuiOutsideClickHandler: FC<OutsideClickHandlerProps> = ({
  children,
  disabled = false,
  onOutsideClick
}) => {
  const removeMouseUp = useRef<(() => void) | null>(null);
  const removeMouseDown = useRef<(() => void) | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      const element = ref.current;
      if (!element || !e.target) {
        return;
      }

      const isDescendantOfRoot = element.contains(e.target as Node);

      if (removeMouseUp.current) {
        removeMouseUp.current();
        removeMouseUp.current = null;
      }

      if (!isDescendantOfRoot) {
        onOutsideClick(e);
      }
    },
    [onOutsideClick]
  );

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      const element = ref.current;
      if (!element || !e.target) {
        return;
      }

      const isDescendantOfRoot = element.contains(e.target as Node);

      if (!isDescendantOfRoot) {
        if (removeMouseUp.current) {
          removeMouseUp.current();
          removeMouseUp.current = null;
        }

        document.addEventListener("mouseup", onMouseUp, { capture: true });
        removeMouseUp.current = () => {
          document.removeEventListener("mouseup", onMouseUp, { capture: true });
        };
      }
    },
    [onMouseUp]
  );

  useEffect(() => {
    const element = ref.current;
    if (disabled || !element) {
      return () => {};
    }

    document.addEventListener("mousedown", onMouseDown, { capture: true });
    removeMouseDown.current = () => {
      document.removeEventListener("mousedown", onMouseDown, { capture: true });
    };

    return () => {
      if (removeMouseUp.current) {
        removeMouseUp.current();
      }
      if (removeMouseDown.current) {
        removeMouseDown.current();
      }
    };
  }, [disabled, onMouseDown, onMouseUp]);

  return <div ref={ref}>{children}</div>;
};
