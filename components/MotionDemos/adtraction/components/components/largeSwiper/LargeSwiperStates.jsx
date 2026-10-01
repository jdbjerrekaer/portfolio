import { Icons } from "@adtraction/ui-icons";
import { i18n } from "@adtraction/shared-i18n";

/**
 * Predefined state configurations for the LargeSwiper component.
 * Each state defines visual styling, icons, and interaction behavior.
 */
export const LargeSwiperStates = {
  /**
   * Initial application state - ready to apply
   */
  APPLY: {
    id: "apply",
    icon: <Icons.Arrow.ChevronRight />,
    iconColor: "var(--grayscale-0)",
    iconBackgroundColor: "var(--primary-blue-500---primary)",
    backgroundColor: "var(--primary-blue-100)",
    textColor: "var(--text-default---body)",
    isLink: false,
    cursor: "pointer"
  },

  /**
   * Application has been submitted successfully
   */
  APPLICATION_SENT: {
    id: "application-sent",
    icon: <Icons.Map.Rocket02 />,
    iconColor: "var(--primary-blue-500---primary)",
    iconBackgroundColor: "var(--grayscale-0)",
    backgroundColor: "var(--primary-blue-500---primary)",
    textColor: "var(--grayscale-0)",
    isLink: false,
    cursor: "default"
  },

  /**
   * Application is being processed - brand manager review (faster)
   */
  PROCESSING_APPLICATION_MANAGER: {
    id: "processing-application-manager",
    icon: <Icons.Time.Hourglass02 secondaryColor="var(--primary-blue-200)" />,
    iconColor: "var(--primary-blue-500---primary)",
    iconBackgroundColor: "var(--grayscale-0)",
    backgroundColor: "var(--primary-blue-500---primary)",
    textColor: "var(--grayscale-0)",
    get defaultText() {
      return i18n.t("ui.toolkit.swiper.pendingApproval");
    },
    isLink: false,
    cursor: "wait",
    reviewType: "manager"
  },

  /**
   * Application is being processed - brand self-review (slower)
   */
  PROCESSING_APPLICATION_BRAND: {
    id: "processing-application-brand",
    icon: <Icons.Time.Hourglass02 secondaryColor="var(--primary-blue-200)" />,
    iconColor: "var(--primary-blue-500---primary)",
    iconBackgroundColor: "var(--grayscale-0)",
    backgroundColor: "var(--primary-blue-500---primary)",
    textColor: "var(--grayscale-0)",
    get defaultText() {
      return i18n.t("ui.toolkit.swiper.pendingApproval");
    },
    isLink: false,
    cursor: "wait",
    reviewType: "brand"
  },

  /**
   * Application has not been approved
   */
  REJECTED: {
    id: "rejected",
    icon: <Icons.General.XClose />,
    iconColor: "var(--ui-colors-red-600)",
    iconBackgroundColor: "var(--grayscale-0)",
    backgroundColor: "var(--ui-colors-red-600)",
    textColor: "var(--grayscale-0)",
    isLink: false,
    cursor: "help"
  },

  /**
   * Link is ready to be copied
   */
  COPY_LINK: {
    id: "copy-link",
    icon: <Icons.General.Copy01 />,
    iconColor: "var(--primary-blue-500---primary)",
    iconBackgroundColor: "var(--grayscale-0)",
    backgroundColor: "var(--ui-colors-green-600)",
    textColor: "var(--grayscale-0)",
    isLink: true,
    cursor: "pointer"
  },

  /**
   * Payout initiated state
   */
  PAYOUT_NOW_STATE: {
    id: "payout-now",
    icon: <Icons.Arrow.ChevronRight />,
    iconColor: "var(--grayscale-0)",
    iconBackgroundColor: "var(--primary-blue-500---primary)",
    backgroundColor: "var(--primary-blue-100)",
    textColor: "var(--text-default---body)",
    isLink: false,
    cursor: "pointer"
  },

  /**
   * User is finishing payout in modal
   */
  FINISH_PAYOUT_STATE: {
    id: "finish-payout",
    icon: <Icons.Map.Rocket02 />,
    iconColor: "var(--primary-blue-500---primary)",
    iconBackgroundColor: "var(--grayscale-0)",
    backgroundColor: "var(--primary-blue-500---primary)",
    textColor: "var(--grayscale-0)",
    isLink: false,
    cursor: "pointer"
  }
};
