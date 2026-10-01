import "../../../../i18n/initialize";
import React from "react";
import { i18n } from "@adtraction/shared-i18n";
import styles from "./BrandResultItem.module.scss";
import { AccountTypeIndicator } from "./AccountTypeIndicator";
import { ProgramStatusBadge } from "./ProgramStatusBadge";
import { ProgramTierBadge } from "./ProgramTierBadge";
import { Flag } from "@adtraction/ui-flags";
import { Icons } from "@adtraction/ui-icons";
import { Button, BrandName } from "@adtraction/ui-components";
import Tippy from "@tippyjs/react";
import { useLazyLogo } from "../hooks/useLazyLogo";

const StaffBrandResultItem = ({
  result = {},
  isAlt = false,
  lazyRoot,
  logoCacheRef,
  overscanPx = 0
}) => {
  const {
    id,
    title: brandName,
    flag,
    staffProgramStatus,
    staffProgramTier,
    isSubUser,
    logo
  } = result;
  const { imgSrc, mountRef } = useLazyLogo({
    logoUrl: logo,
    cacheKey: id || logo,
    root: lazyRoot,
    overscanPx,
    cacheRef: logoCacheRef
  });

  return (
    <div
      className={styles.search_results_item}
      data-loading={false}
      data-search-item={true}
      data-variant="default">
      <div className={styles.left_group}>
        {flag && <Flag flag={flag} width={18} height={18} />}
        <AccountTypeIndicator text={i18n.t("platform.staffSearch.program")} variant="program" />
      </div>
      {logo && (
        <div className={styles.brand_logo_container}>
          <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={i18n.t("platform.staffSearch.brandLogoAlt", {
                name: brandName || i18n.t("platform.staffSearch.brandFallback")
              })}
              loading="lazy"
            />
          ) : null}
        </div>
      )}
      <div className={styles.brand_group}>
        <BrandName brandName={brandName || ""} size="default" />
        <ProgramStatusBadge stype={(staffProgramStatus || "live").toLowerCase()} size="small" />
        <ProgramTierBadge ttype={(staffProgramTier || "basic").toLowerCase()} size="small" />
        {isSubUser && (
          <p className={styles.sub_user_badge}>{i18n.t("platform.staffSearch.subUser")}</p>
        )}
      </div>
      <div className={styles.spacer} />
      <div className={styles.right_group}>
        <div className={styles.id_tag}>
          <p>{`${i18n.t("platform.staffSearch.idLabel")}: ${id ?? "12345678901"}`}</p>
        </div>
      </div>
      <Tippy
        content={
          <span style={{ color: "var(--text-body-default)" }}>
            {i18n.t("platform.staffSearch.openInNewTab")}
          </span>
        }
        placement="bottom"
        delay={[300, 0]}
        animation="fade"
        arrow={false}
        theme="light">
        <div>
          <Button
            type="ghost"
            size="small"
            text=""
            aria-label={i18n.t("platform.staffSearch.openInNewTab")}
            iconLeft={<Icons.Arrow.NarrowUpRight />}
          />
        </div>
      </Tippy>
      <Tippy
        content={
          <span style={{ color: "var(--text-body-default)" }}>
            {i18n.t("platform.staffSearch.logInAs", { name: brandName || "" })}
          </span>
        }
        placement="bottom"
        delay={[300, 0]}
        animation="fade"
        arrow={false}
        theme="light">
        <div>
          <Button
            type="ghost"
            size="small"
            text=""
            aria-label={i18n.t("platform.staffSearch.logInAs", { name: brandName || "" })}
            iconLeft={<Icons.General.LogIn02 />}
          />
        </div>
      </Tippy>
    </div>
  );
};

export default StaffBrandResultItem;
