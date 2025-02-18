import classNames from "classnames";
import { ReactNode, FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ViewState from "../../ReactViewModels/ViewState";
import Styles from "./explorer-window.scss";

const SLIDE_DURATION = 300;

interface IProps {
  isVisible?: boolean;
  onClose: () => void;
  viewState: ViewState;
  onStartAnimatingIn?: () => void;
  onDoneAnimatingIn?: () => void;
  children: ReactNode;
  isTopElement?: boolean;
}

const ModalPopup: FC<React.PropsWithChildren<IProps>> = (props) => {
  const { t } = useTranslation();
  const [inTransition, setInTransition] = useState(false);
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function slideIn() {
    props.onStartAnimatingIn?.();
    setInTransition(true);
    animationTimeout.current = setTimeout(() => {
      setInTransition(false);
      setTimeout(() => {
        props.onDoneAnimatingIn?.();
      }, SLIDE_DURATION);
    });
  }

  function slideOut() {
    setInTransition(true);
    animationTimeout.current = setTimeout(() => {
      setInTransition(false);
    }, SLIDE_DURATION);
  }

  useEffect(() => {
    // Clear previous timeout
    if (animationTimeout.current !== null) {
      clearTimeout(animationTimeout.current);
      animationTimeout.current = null;
    }
    if (props.isVisible) {
      slideIn();
    } else {
      slideOut();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [props.isVisible]);

  useEffect(() => {
    const escKeyListener = (e: KeyboardEvent) => {
      // Only explicitly check share modal state, move to levels/"layers of modals" logic if we need to go any deeper
      if (e.key === "Escape" && !props.viewState.shareModalIsVisible) {
        props.onClose();
      }
    };
    window.addEventListener("keydown", escKeyListener, true);
  });

  // Render explorer panel when explorer panel should be visible
  //  or when sliding out (animation)
  const renderUi = props.isVisible || inTransition;

  return renderUi ? (
    <div
      className={classNames(
        Styles.modalWrapper,
        props.isTopElement ? "top-element" : ""
      )}
      id="explorer-panel-wrapper"
      aria-hidden={!props.isVisible}
    >
      <div
        onClick={props.onClose}
        id="modal-overlay"
        className={Styles.modalOverlay}
        tabIndex={-1}
      />
      <div
        id="explorer-panel"
        className={classNames(Styles.explorerPanel, {
          [Styles.isMounted]: props.isVisible && !inTransition
        })}
        aria-labelledby="modalTitle"
        aria-describedby="modalDescription"
        role="dialog"
      >
        <button
          type="button"
          onClick={props.onClose}
          className={Styles.btnCloseModal}
          title={t("addData.closeDataPanel")}
          data-target="close-modal"
        >
          {t("addData.done")}
        </button>
        {props.children}
      </div>
    </div>
  ) : null;
};

export default ModalPopup;
