import "react-toastify/dist/ReactToastify.css";
import React from "react";
import { ToastContainer, toast } from "react-toastify";
import styles from "./Toaster.module.scss";
import "./Toaster.global.scss";
import { Icons } from "@adtraction/ui-icons";

export const ToasterContainer = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <ToastContainer
      position={isMobile ? "top-center" : "top-right"}
      style={{ zIndex: "var(--z-index-toast)" }}
    />
  );
};

const TOAST_CONFIG = {
  info: {
    color: "var(--primary-blue-500---primary)",
    closeColor: "var(--text-label-default)",
    icon: Icons.General.InfoSquare,
    closeIcon: Icons.General.XClose,
    toastMethod: toast.info,
    className: styles.info
  },
  success: {
    color: "var(--ui-colors-green-600)",
    closeColor: "var(--ui-colors-green-800)",
    icon: Icons.General.CheckCircle,
    closeIcon: Icons.General.XClose,
    toastMethod: toast.success,
    className: styles.success
  },
  warning: {
    color: "var(--ui-colors-yellow-800)",
    closeColor: "var(--ui-colors-yellow-800)",
    icon: Icons.Alert.Octagon,
    closeIcon: Icons.General.XClose,
    toastMethod: toast.warning,
    className: styles.warning
  },
  error: {
    color: "var(--ui-colors-red-800)",
    closeColor: "var(--ui-colors-red-800)",
    icon: Icons.Alert.Triangle,
    closeIcon: Icons.General.XClose,
    toastMethod: toast.error,
    className: styles.error
  }
};

const createIcon = (Icon, color) => (
  <Icon color={color} width="var(--size-icon-medium)" height="var(--size-icon-medium)" />
);

const trigger = ({
  type = "info",
  autoDismiss = true,
  autoDismissTime = 5000,
  button = null,
  icon = true,
  title = "",
  description = "",
  ariaLabel = null,
  toastId = null
} = {}) => {
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;

  const CloseButton = ({ closeToast }) => (
    <span className={styles.closeButton} onClick={closeToast}>
      {createIcon(config.closeIcon, config.closeColor)}
    </span>
  );

  const ToastContent = () => {
    const label = ariaLabel || `${type} notification: ${title}`;
    return (
      <div className={styles.wrapper} aria-label={label}>
        {icon && createIcon(config.icon, config.color)}
        <div className={styles.contentContainer}>
          <div className={styles.textContainer}>
            <p className={styles.titleText}>{title}</p>
            <p className={styles.descriptionText}>{description}</p>
          </div>
          {button}
        </div>
      </div>
    );
  };

  const options = {
    closeButton: CloseButton,
    className: config.className,
    autoClose: autoDismiss ? autoDismissTime : false,
    closeOnClick: !button,
    icon: false,
    ...(toastId && { toastId })
  };

  return config.toastMethod(ToastContent, options);
};

const dismiss = (toastId) => toast.dismiss(toastId);

export const Toaster = { trigger, dismiss };
