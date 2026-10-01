import "../../../../i18n/initialize";
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { i18n } from "@adtraction/shared-i18n";
import { Link } from "react-router-dom";
import styles from "../PartnerSidemenu.module.scss";
import CustomSubMenu from "./CustomSubMenu";
import SubItem from "./SubItem";
import Tippy from "@tippyjs/react";
import { ListItem, ListItemWrapper, linkTargetProps } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";

const MenuItem = ({ item, index, isActive, onDisabledClick, onItemClick }) => {
  if (item.children) {
    return (
      <CustomSubMenu
        key={index}
        label={item.label}
        icon={item.icon}
        defaultOpen={item.defaultOpen}
        id={`submenu-${index}`}
        isActive={isActive}
        onItemClick={onItemClick}>
        {item.children.map((child, childIndex) => (
          <SubItem
            key={childIndex}
            url={child.url}
            externalUrl={child.externalUrl}
            extraUrls={child.extraUrls}
            name={child.name}
            disabled={child.disabled}
            isActive={isActive}
            onItemClick={onItemClick}
          />
        ))}
      </CustomSubMenu>
    );
  } else if (item.externalUrl && !item.disabled) {
    return (
      <a
        key={index}
        href={item.externalUrl}
        {...linkTargetProps()}
        className={styles.menu_item}
        onClick={onItemClick}>
        {item.icon && (
          <item.icon
            strokeWidth={1.73}
            className={styles.icon}
            width="var(--size-icon-medium)"
            height="var(--size-icon-medium)"
          />
        )}
        <span className={styles.menu_label}>{item.label}</span>
      </a>
    );
  } else if (item.url && !item.disabled) {
    const active = isActive(item.url);
    return (
      <MenuItemWithContextMenu
        key={index}
        item={item}
        active={active}
        onItemClick={onItemClick}
        index={index}
      />
    );
  } else if (!item.url && !item.disabled) {
    return (
      <div key={index} className={`${styles.menu_item}`} onClick={() => onItemClick?.()}>
        {item.icon && (
          <item.icon
            strokeWidth={1.73}
            className={styles.icon}
            width="var(--size-icon-medium)"
            height="var(--size-icon-medium)"
          />
        )}
        <span className={styles.menu_label}>{item.label}</span>
      </div>
    );
  } else {
    // Use item-specific onDisabledClick if provided (e.g., for privilege-restricted items)
    const handleDisabled = item.onDisabledClick || onDisabledClick;
    return (
      <div
        key={index}
        className={`${styles.menu_item} ${styles.disabled}`}
        onClick={() => handleDisabled()}>
        {item.icon && (
          <item.icon
            strokeWidth={1.73}
            className={styles.icon}
            width="var(--size-icon-medium)"
            height="var(--size-icon-medium)"
          />
        )}
        <span className={styles.menu_label}>{item.label}</span>
      </div>
    );
  }
};

const MenuItemWithContextMenu = ({ item, active, onItemClick, index }) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const menuWrapperRef = useRef(null);
  const itemRef = useRef(null);

  const openContextMenuAt = useCallback(({ x, y }) => {
    setContextMenuPosition({ x, y });
    setShowContextMenu(true);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  const handleContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      openContextMenuAt({
        x: event.clientX,
        y: event.clientY
      });
    },
    [openContextMenuAt]
  );

  const handleOpenInNewTab = useCallback(() => {
    handleCloseContextMenu();
    window.open(item.url, "_blank", "noopener,noreferrer");
  }, [item.url, handleCloseContextMenu]);

  const menuOptions = useMemo(
    () => [
      {
        label: i18n.t("platform.sidemenu.menu.openInNewTab"),
        action: handleOpenInNewTab
      }
    ],
    [handleOpenInNewTab]
  );

  const handleMenuSelection = useCallback(
    (keys) => {
      if (!keys?.length) {
        return;
      }

      const selected = menuOptions.find((option) => option.label === keys[0]);
      selected?.action();
    },
    [menuOptions]
  );

  const handleContextMenuClickOutside = useCallback(
    (_instance, event) => {
      const target = event?.target;
      if (
        itemRef.current &&
        typeof Node !== "undefined" &&
        target instanceof Node &&
        itemRef.current.contains(target)
      ) {
        return;
      }
      handleCloseContextMenu();
    },
    [handleCloseContextMenu]
  );

  useEffect(() => {
    if (!showContextMenu) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleCloseContextMenu();
      }
    };

    const handleViewportChange = () => {
      handleCloseContextMenu();
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [showContextMenu, handleCloseContextMenu]);

  useEffect(() => {
    if (!showContextMenu) {
      return;
    }

    const rafId = requestAnimationFrame(() => {
      const firstItem = menuWrapperRef.current?.querySelector('[data-context-menu-item="true"]');

      if (firstItem && typeof firstItem.focus === "function") {
        firstItem.focus();
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [showContextMenu]);

  return (
    <div ref={itemRef} data-menu-open={showContextMenu}>
      <Tippy
        visible={showContextMenu}
        trigger="manual"
        interactive={true}
        placement="bottom-start"
        className={styles.context_menu_tippy}
        appendTo={document.body}
        onClickOutside={handleContextMenuClickOutside}
        content={
          <div
            ref={menuWrapperRef}
            className={styles.context_menu_wrapper}
            role="menu"
            onClick={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}>
            <ListItemWrapper
              inFocus={showContextMenu}
              itemGap="0"
              customClassName={styles.context_menu_list}
              onSelectionChange={handleMenuSelection}>
              {menuOptions.map((option) => (
                <ListItem
                  key={option.label}
                  size="small"
                  text={option.label}
                  iconRight={<Icons.Arrow.NarrowUpRight width="1rem" height="1rem" />}
                  role="menuitem"
                  tabIndex={-1}
                  data-context-menu-item="true"
                />
              ))}
            </ListItemWrapper>
          </div>
        }
        getReferenceClientRect={() => ({
          width: 0,
          height: 0,
          top: contextMenuPosition.y,
          bottom: contextMenuPosition.y,
          left: contextMenuPosition.x,
          right: contextMenuPosition.x
        })}>
        <Link
          to={item.url}
          className={`${styles.menu_item} ${active ? styles.active : ""} ${
            showContextMenu ? styles.context_menu_open : ""
          }`}
          onClick={onItemClick}
          onContextMenu={handleContextMenu}>
          {item.icon && (
            <item.icon
              strokeWidth={1.73}
              className={styles.icon}
              width="var(--size-icon-medium)"
              height="var(--size-icon-medium)"
            />
          )}
          <span className={styles.menu_label}>{item.label}</span>
        </Link>
      </Tippy>
    </div>
  );
};

export default MenuItem;
