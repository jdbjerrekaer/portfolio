import React, { useState, useEffect } from "react";
import { Icons } from "@adtraction/ui-icons";
import styles from "../PartnerSidemenu.module.scss";

const CustomSubMenu = ({ label, icon: Icon, children, defaultOpen = false, id, isActive, onItemClick }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const childPaths = React.Children.map(
    children,
    (child) => child.props.url || (child.props.extraUrls && child.props.extraUrls[0])
  );

  const isAnyChildActive = childPaths && childPaths.some((path) => isActive(path));

  useEffect(() => {
    setIsOpen(isAnyChildActive);
  }, [isAnyChildActive]);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Clone children to pass onItemClick prop
  const childrenWithProps = React.Children.map(children, (child) => {
    return React.cloneElement(child, { onItemClick });
  });

  return (
    <div className={`${styles.sub_menu_container} ${isOpen ? styles.open : ""}`}>
      <button
        className={`${styles.menu_item} ${isOpen || isAnyChildActive ? styles.active : ""}`}
        onClick={handleToggle}
        type="button"
        data-hide-interactive-popover="true"
        data-submenu-id={id}>
        {Icon && (
          <Icon
            strokeWidth={1.73}
            className={styles.icon}
            width="var(--size-icon-medium)"
            height="var(--size-icon-medium)"
          />
        )}
        <span className={styles.menu_label}>{label}</span>
        <span className={`${styles.chevron_container} ${isOpen ? styles.rotated : ""}`}>
          <Icons.Arrow.ChevronDown
            className={styles.chevron}
            strokeWidth={1.73}
            width="var(--size-icon-medium)"
            height="var(--size-icon-medium)"
          />
        </span>
      </button>

      <div className={`${styles.sub_menu_items} ${isOpen ? styles.open : ""}`}>{childrenWithProps}</div>
    </div>
  );
};

export default CustomSubMenu;
