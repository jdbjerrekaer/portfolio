// @ts-nocheck -- portfolio edit: trimmed to the icons the demos use; portfolio edit: trimmed to the icons the demos use; portfolio edit: vendored toolkit file; Next types *.svg as image URLs, the toolkit uses SVGR ReactComponent.
import { lazy as _lazy } from "react";
import type { ComponentType, SVGProps } from "react";
import { Icon } from "./Icon";

type ImportFunction = () => Promise<{ ReactComponent: ComponentType<SVGProps<SVGSVGElement>> }>;

function lazy(importFn: ImportFunction) {
  const LazyComponent = _lazy(async () => {
    const m = await importFn();
    return { default: m.ReactComponent };
  });

  return function WrappedIcon(props: Omit<Parameters<typeof Icon>[0], "LazyComponent">) {
    return (
      <Icon {...props} LazyComponent={LazyComponent as ComponentType<SVGProps<SVGSVGElement>>} />
    );
  };
}

// All icons grouped by category
export const Icons = {
  Weather: {
    CloudMoon: lazy(() => import("./media/weather/cloud-moon.svg")),
    Sun: lazy(() => import("./media/weather/sun.svg"))
  },
  Shape: {
    Circle: lazy(() => import("./media/shapes/circle.svg"))
  },
  Chart: {
    Pie02: lazy(() => import("./media/charts/pie-chart-02.svg")),
  },
  Security: {
    Lock03: lazy(() => import("./media/security/lock-03.svg"))
  },
  Channel: {
    Content: lazy(() => import("./media/channel_types/content.svg")),
    Paid: lazy(() => import("./media/channel_types/paid.svg")),
    Direct: lazy(() => import("./media/channel_types/direct.svg")),
    Creators: lazy(() => import("./media/channel_types/creators.svg")),
    SavingsAndRewards: lazy(() => import("./media/channel_types/savings-and-rewards.svg")),
    Other: lazy(() => import("./media/channel_types/other.svg"))
  },

  Custom: {
    HourGlass02Filled: lazy(() => import("./media/custom/hourglass-02-filled.svg")),
    NotificationDot: lazy(() => import("./media/custom/notification-dot.svg")),
    Brand: lazy(() => import("./media/custom/brand.svg")),
    AdtractionOutline: lazy(() => import("./media/custom/adtraction-outline.svg")),
    BrandClose: lazy(() => import("./media/custom/brand-close.svg")),
    BrandSearch: lazy(() => import("./media/custom/brand-search.svg")),
    Flower: lazy(() => import("./media/custom/flower.svg")),
    Seedling: lazy(() => import("./media/custom/seedling.svg")),
    Tree: lazy(() => import("./media/custom/tree.svg")),
    Adtraction: lazy(() => import("./media/custom/adtraction.svg")),
    BoxFilled: lazy(() => import("./media/custom/box-filled.svg")),
    ClockSnoozeFill: lazy(() => import("./media/custom/clock-snooze-filled.svg")),
    MinusSquareAngleFilled: lazy(() => import("./media/custom/minus-square-angle-filled.svg")),
    Tool02Filled: lazy(() => import("./media/custom/tool-02-filled.svg")),
    XSquareFilled: lazy(() => import("./media/custom/x-square-filled.svg"))
  },


  Arrow: {

    NarrowDown: lazy(() => import("./media/arrows/arrow-narrow-down.svg")),
    NarrowUp: lazy(() => import("./media/arrows/arrow-narrow-up.svg")),
    NarrowLeft: lazy(() => import("./media/arrows/arrow-narrow-left.svg")),
    NarrowRight: lazy(() => import("./media/arrows/arrow-narrow-right.svg")),





    ChevronUp: lazy(() => import("./media/arrows/chevron-up.svg")),
    ChevronLeft: lazy(() => import("./media/arrows/chevron-left.svg")),
    ChevronRight: lazy(() => import("./media/arrows/chevron-right.svg")),




    NarrowUpRight: lazy(() => import("./media/arrows/arrow-narrow-up-right.svg")),
    ChevronDown: lazy(() => import("./media/arrows/chevron-down.svg")),
    Expand01: lazy(() => import("./media/arrows/expand-01.svg")),
    ArrowsDown: lazy(() => import("./media/arrows/arrows-down.svg")),
    ArrowsUp: lazy(() => import("./media/arrows/arrows-up.svg")),
  },

  Alert: {
    Announcement01: lazy(() => import("./media/alerts/announcement-01.svg")),
    Circle: lazy(() => import("./media/alerts/alert-circle.svg")),
    Triangle: lazy(() => import("./media/alerts/alert-triangle.svg")),
    TriangleFilled: lazy(() => import("./media/alerts/alert-triangle-filled.svg")),
    Octagon: lazy(() => import("./media/alerts/alert-octagon.svg")),




    OctagonFilled: lazy(() => import("./media/alerts/alert-octagon-filled.svg")),
    Bell01: lazy(() => import("./media/alerts/bell-01.svg"))
  },




  Time: {

    Calendar: lazy(() => import("./media/time/calendar.svg")),


    Hourglass02: lazy(() => import("./media/time/hourglass-02.svg")),
    Hourglass03: lazy(() => import("./media/time/hourglass-03.svg")),

    Clock: lazy(() => import("./media/time/clock.svg")),
    ClockRewind: lazy(() => import("./media/time/clock-rewind.svg"))
  },

  User: {
    FaceFrown: lazy(() => import("./media/users/face-frown.svg")),

    User01: lazy(() => import("./media/users/user-01.svg")),



    Users01: lazy(() => import("./media/users/users-01.svg")),


  },



  Layout: {


    DistributeSpacingHorizontal: lazy(
      () => import("./media/layout/distribute-spacing-horizontal.svg")
    ),



    LayersThree01: lazy(() => import("./media/layout/layers-three-01.svg")),



    Rows01: lazy(() => import("./media/layout/rows-01.svg")),
    LayoutLeft: lazy(() => import("./media/layout/layout-left.svg")),
    LayoutRight: lazy(() => import("./media/layout/layout-right.svg"))
  },

  Map: {








    Rocket02: lazy(() => import("./media/maps/rocket-02.svg"))
  },

  General: {
    CheckVerified03: lazy(() => import("./media/general/check-verified-03.svg")),
    FilterLines: lazy(() => import("./media/general/filter-lines.svg")),
    HelpCircle: lazy(() => import("./media/general/help-circle.svg")),
    Home05: lazy(() => import("./media/general/home-05.svg")),
    Settings01: lazy(() => import("./media/general/settings-01.svg")),




    Check: lazy(() => import("./media/general/check.svg")),
    CheckCircle: lazy(() => import("./media/general/check-circle.svg")),
    CheckCircleFilled: lazy(() => import("./media/general/check-circle-filled.svg")),
    CheckSquare: lazy(() => import("./media/general/check-square.svg")),
    CheckVerified02: lazy(() => import("./media/general/check-verified-02.svg")),


    Copy01: lazy(() => import("./media/general/copy-01.svg")),
    Copy02: lazy(() => import("./media/general/copy-02.svg")),
    Copy03: lazy(() => import("./media/general/copy-03.svg")),
    Copy04: lazy(() => import("./media/general/copy-04.svg")),
    Copy05: lazy(() => import("./media/general/copy-05.svg")),
    Copy06: lazy(() => import("./media/general/copy-06.svg")),


    DotsVertical: lazy(() => import("./media/general/dots-vertical.svg")),


    Edit03: lazy(() => import("./media/general/edit-03.svg")),





    InfoSquare: lazy(() => import("./media/general/info-square.svg")),








    Minus: lazy(() => import("./media/general/minus.svg")),















    Trash03: lazy(() => import("./media/general/trash-03.svg")),



    XClose: lazy(() => import("./media/general/x-close.svg")),

    EyeOff: lazy(() => import("./media/general/eye-off.svg")),
    Menu01: lazy(() => import("./media/general/menu-01.svg")),
    Pin01: lazy(() => import("./media/general/pin-01.svg")),
    Pin02: lazy(() => import("./media/general/pin-02.svg")),
    SearchMd: lazy(() => import("./media/general/search-md.svg")),
    X: lazy(() => import("./media/general/x.svg")),
    LinkExternal01: lazy(() => import("./media/general/link-external-01.svg")),
    LogIn02: lazy(() => import("./media/general/log-in-02.svg")),
    LogOut03: lazy(() => import("./media/general/log-out-03.svg"))
  },



  Files: {
    File02: lazy(() => import("./media/files/file-02.svg")),
    FileCheck02: lazy(() => import("./media/files/file-check-02.svg")),
    FileX02: lazy(() => import("./media/files/file-x-02.svg")),
    File05: lazy(() => import("./media/files/file-05.svg")),




    FileDownload03: lazy(() => import("./media/files/file-download-03.svg")),
  },

  Finance: {
    BankNote01: lazy(() => import("./media/finance/bank-note-01.svg")),
    ShoppingBag03: lazy(() => import("./media/finance/shopping-bag-03.svg")),

    CoinsHand: lazy(() => import("./media/finance/coins-hand.svg")),
    CoinsStacked01: lazy(() => import("./media/finance/coins-stacked-01.svg")),






    Scales01: lazy(() => import("./media/finance/scales-01.svg")),
  },


  Communication: {
    Send01: lazy(() => import("./media/communication/send-01.svg")),
    MessageNotificationCircle: lazy(
      () => import("./media/communication/message-notification-circle.svg")
    ),

    MessageNotificationSquare: lazy(
      () => import("./media/communication/message-notification-square.svg")
    ),





    Mail01: lazy(() => import("./media/communication/mail-01.svg")),
    ConversionApproved: lazy(() => import("./media/communication/conversion-confirm.svg")),
    ConversionPending: lazy(() => import("./media/communication/conversion-missing.svg")),
    ConversionRejected: lazy(() => import("./media/communication/conversion-reject.svg")),
    Phone: lazy(() => import("./media/communication/phone.svg"))
  },
  Brand: {
    Automotive: lazy(() => import("./media/brand_categories/automotive.svg")),
    Electronics: lazy(() => import("./media/brand_categories/electronics.svg")),
    Family: lazy(() => import("./media/brand_categories/family.svg")),
    Fashion: lazy(() => import("./media/brand_categories/fashion.svg")),
    Finance: lazy(() => import("./media/brand_categories/finance.svg")),
    Food: lazy(() => import("./media/brand_categories/food.svg")),
    HealthAndBeauty: lazy(() => import("./media/brand_categories/health-and-beauty.svg")),
    HobbiesAndGifts: lazy(() => import("./media/brand_categories/hobbies-and-gifts.svg")),
    HomeAndGarden: lazy(() => import("./media/brand_categories/home-and-garden.svg")),
    Insurance: lazy(() => import("./media/brand_categories/insurance.svg")),
    Marketing: lazy(() => import("./media/brand_categories/marketing.svg")),
    Media: lazy(() => import("./media/brand_categories/media.svg")),
    OnlineServices: lazy(() => import("./media/brand_categories/online-services.svg")),
    SportsAndOutdoor: lazy(() => import("./media/brand_categories/sports-and-outdoor.svg")),
    Travel: lazy(() => import("./media/brand_categories/travel.svg")),
    Utilities: lazy(() => import("./media/brand_categories/utilities.svg")),
    Other: lazy(() => import("./media/brand_categories/other.svg")),
  },
  Media: {
    PauseCircle: lazy(() => import("./media/media/pause-circle.svg")),
  }
} as const;