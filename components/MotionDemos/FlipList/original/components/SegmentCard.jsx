"use client";
import React, { useState, useEffect, useRef, useContext } from "react";
import { i18n } from "@adtraction/shared-i18n";
import Tippy from "@tippyjs/react";
import {
  Badge,
  Button,
  Input,
  ListItemWrapper,
  ListItem,
  Modal,
  Tag
} from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
import SegmentBudgetTooltip from "./SegmentBudgetTooltip";
import budgetTooltipStyles from "./SegmentBudgetTooltip.module.scss";
import styles from "./SegmentCard.module.scss";
import { UserRoleContext } from "@adtraction/util-providers";
import { CLIENT_PRIVILEGES } from "@adtraction/util-constants";

const ICON_SIZE = 16;

/** ADTR-8897: Hide rename, duplicate, and delete options for now. */
const SHOW_SEGMENT_CRUD_MENU_ITEMS = false;

const SegmentCard = ({
  segment,
  isSelected,
  scheduledCount = 0,
  onSelect,
  onViewChannels,
  onTrackingPeriod,
  onRenameSegment,
  onDuplicateSegment,
  onDeleteSegment
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameSegmentName, setRenameSegmentName] = useState("");
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateSegmentName, setDuplicateSegmentName] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [budgetFetchEnabled, setBudgetFetchEnabled] = useState(false);
  const menuButtonRef = useRef(null);
  const menuTippyRef = useRef(null);
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const userRoleContext = useContext(UserRoleContext);
  const privileges = userRoleContext?.privileges || [];
  const canEditPrice = privileges.includes(CLIENT_PRIVILEGES.SHOW_COMMISSION);

  const hideMenu = () => {
    menuTippyRef.current?.hide();
  };

  const closeContextMenu = () => setContextMenuVisible(false);

  const handleCardContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideMenu();
    cursorPosRef.current = { x: e.clientX, y: e.clientY };
    setContextMenuVisible((v) => !v);
  };

  const handleMenuItemClick = (action) => {
    hideMenu();
    closeContextMenu();
    action?.(segment);
  };

  const handleOpenRenameModal = () => {
    hideMenu();
    closeContextMenu();
    setRenameModalOpen(true);
  };

  const handleCloseRenameModal = () => {
    setRenameModalOpen(false);
    setRenameSegmentName("");
  };

  useEffect(() => {
    if (!renameModalOpen || !segment) return;
    setRenameSegmentName(segment.name ?? "");
  }, [renameModalOpen, segment]);

  const trimmedRenameName = renameSegmentName.trim();
  const renameNameValid = trimmedRenameName.length > 0;

  const handleConfirmRename = () => {
    if (!renameNameValid) return;
    onRenameSegment?.(segment, trimmedRenameName);
    setRenameModalOpen(false);
    setRenameSegmentName("");
  };

  const handleOpenDuplicateModal = () => {
    hideMenu();
    closeContextMenu();
    setDuplicateModalOpen(true);
  };

  const handleCloseDuplicateModal = () => {
    setDuplicateModalOpen(false);
    setDuplicateSegmentName("");
  };

  useEffect(() => {
    if (!duplicateModalOpen || !segment) return;
    setDuplicateSegmentName(
      i18n.t("brands.myBrand.price.segmentCard.duplicateSegmentDefaultName", {
        name: segment.name ?? ""
      })
    );
  }, [duplicateModalOpen, segment]);

  const trimmedDuplicateName = duplicateSegmentName.trim();
  const duplicateNameValid = trimmedDuplicateName.length > 0;

  const handleConfirmDuplicate = () => {
    if (!duplicateNameValid) return;
    onDuplicateSegment?.(segment, trimmedDuplicateName);
    setDuplicateModalOpen(false);
    setDuplicateSegmentName("");
  };

  const handleOpenDeleteModal = () => {
    hideMenu();
    closeContextMenu();
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  const handleConfirmDelete = () => {
    onDeleteSegment?.(segment);
    setDeleteModalOpen(false);
  };

  const { activeCompensationCount = 0, totalCompensationCount = 0 } = segment;

  const tagLabel =
    totalCompensationCount > 0
      ? i18n.t("brands.myBrand.price.segmentCard.activeCompensations", {
          active: activeCompensationCount,
          total: totalCompensationCount
        })
      : null;

  const budgetLabel =
    segment.budgetShared === true
      ? i18n.t("brands.myBrand.price.segmentCard.sharedBudget")
      : segment.budgetShared === false
        ? i18n.t("brands.myBrand.price.segmentCard.perChannelBudget")
        : null;

  const getMenuContent = () => (
    <div className={styles.menuContent}>
      <ListItemWrapper selectedKeys={[]}>
        <ListItem
          hoverable={true}
          text={i18n.t("brands.myBrand.price.segmentCard.menuViewChannels")}
          iconRight={
            <Icons.User.Users01
              width={ICON_SIZE}
              height={ICON_SIZE}
              color="var(--primary-blue-500---primary)"
              aria-hidden
            />
          }
          onClick={() => handleMenuItemClick(onViewChannels)}
        />
        <ListItem
          hoverable={true}
          text={i18n.t("brands.myBrand.price.segmentCard.menuTrackingPeriod")}
          caption={
            segment.cookieTime != null
              ? i18n.t("brands.myBrand.price.segmentCard.cookieDaysCaption", {
                  count: segment.cookieTime
                })
              : ""
          }
          iconRight={
            <Icons.Time.Hourglass03
              width={ICON_SIZE}
              height={ICON_SIZE}
              color="var(--primary-blue-500---primary)"
              aria-hidden
            />
          }
          onClick={() => handleMenuItemClick(onTrackingPeriod)}
        />
        {SHOW_SEGMENT_CRUD_MENU_ITEMS && canEditPrice && (
          <>
            <ListItem
              hoverable={true}
              text={i18n.t("brands.myBrand.price.segmentCard.menuEditSegmentName")}
              iconRight={
                <Icons.General.Edit03
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  color="var(--primary-blue-500---primary)"
                  aria-hidden
                />
              }
              onClick={handleOpenRenameModal}
            />
            <ListItem
              hoverable={true}
              text={i18n.t("brands.myBrand.price.segmentCard.menuDuplicateSegment")}
              onClick={handleOpenDuplicateModal}
            />
            <ListItem
              hoverable={true}
              text={i18n.t("brands.myBrand.price.segmentCard.menuDeleteSegment")}
              onClick={handleOpenDeleteModal}
            />
          </>
        )}
      </ListItemWrapper>
    </div>
  );

  return (
    <div
      className={`${styles.segmentCard} ${isSelected ? styles.selected : ""} ${menuVisible || contextMenuVisible ? styles.menuOpen : ""}`}
      onClick={() => {
        closeContextMenu();
        onSelect(segment);
      }}
      onContextMenu={handleCardContextMenu}>
      <Tippy
        visible={contextMenuVisible}
        onClickOutside={closeContextMenu}
        interactive={true}
        arrow={false}
        theme="light"
        placement="bottom-start"
        maxWidth="none"
        appendTo={() => document.body}
        getReferenceClientRect={() => ({
          width: 0,
          height: 0,
          top: cursorPosRef.current.y,
          bottom: cursorPosRef.current.y,
          left: cursorPosRef.current.x,
          right: cursorPosRef.current.x
        })}
        content={getMenuContent()}>
        <span />
      </Tippy>
      <div className={styles.segmentInfo}>
        <span className={styles.segmentName}>{segment.name}</span>
        {(budgetLabel || scheduledCount > 0) && (
          <div className={styles.segmentBadges}>
            {budgetLabel && (
              <Tippy
                className={budgetTooltipStyles.budgetTippy}
                interactive={true}
                placement="bottom-start"
                appendTo={() => document.body}
                delay={[300, 0]}
                maxWidth="none"
                arrow={false}
                onShow={() => setBudgetFetchEnabled(true)}
                content={
                  <SegmentBudgetTooltip
                    segmentId={segment.segment_id}
                    fetchEnabled={budgetFetchEnabled}
                  />
                }>
                <div className={styles.badgeWrapper} onClick={(e) => e.stopPropagation()}>
                  <Badge
                    size="small"
                    text={budgetLabel}
                    iconLeft={
                      <Icons.Finance.CoinsHand
                        width={ICON_SIZE}
                        height={ICON_SIZE}
                        color="var(--badge-text)"
                      />
                    }
                  />
                </div>
              </Tippy>
            )}
            {scheduledCount > 0 && (
              <Tippy
                content={
                  scheduledCount === 1
                    ? i18n.t("brands.myBrand.price.segmentCard.scheduledChangesTooltip.one")
                    : i18n.t("brands.myBrand.price.segmentCard.scheduledChangesTooltip.many", {
                        count: scheduledCount
                      })
                }
                placement="bottom"
                appendTo={() => document.body}
                delay={[100, 0]}
                maxWidth={240}>
                {/* div (not span): .segmentList disables pointer-events on spans */}
                <div
                  className={styles.scheduleIcon}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={
                    scheduledCount === 1
                      ? i18n.t("brands.myBrand.price.segmentCard.scheduledChangesTooltip.one")
                      : i18n.t("brands.myBrand.price.segmentCard.scheduledChangesTooltip.many", {
                          count: scheduledCount
                        })
                  }>
                  <Icons.Time.Calendar
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                    color="var(--grayscale-0, #fff)"
                    aria-hidden
                  />
                </div>
              </Tippy>
            )}
          </div>
        )}
      </div>

      <Tippy
        trigger="mouseenter click"
        delay={[300, 0]}
        interactive={true}
        arrow={false}
        theme="light"
        placement="bottom-end"
        appendTo={() => document.body}
        hideOnClick={false}
        offset={[0, 0]}
        onClickOutside={(instance) => instance.hide()}
        onCreate={(instance) => {
          menuTippyRef.current = instance;
        }}
        onShow={() => {
          closeContextMenu();
          setMenuVisible(true);
        }}
        onHide={() => setMenuVisible(false)}
        content={getMenuContent()}>
        <div
          ref={menuButtonRef}
          className={styles.menuButton}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            e.stopPropagation();
            menuTippyRef.current?.show();
          }}
          role="button"
          tabIndex={0}
          aria-label={i18n.t("brands.myBrand.price.segmentCard.openMenu")}>
          <Icons.General.DotsVertical width={ICON_SIZE} height={ICON_SIZE} aria-hidden />
        </div>
      </Tippy>

      {tagLabel &&
        (activeCompensationCount === 0 ? (
          <Tippy
            content={i18n.t("brands.myBrand.price.segmentCard.activeTagEmptyTooltip")}
            placement="bottom"
            appendTo={() => document.body}
            delay={[300, 0]}
            maxWidth={240}>
            <div
              className={styles.activeTagWrapper}
              onClick={(e) => e.stopPropagation()}
              aria-label={i18n.t("brands.myBrand.price.segmentCard.activeTagEmptyTooltip")}>
              <Tag size="small" text={tagLabel} className={styles.activeTagRed} />
            </div>
          </Tippy>
        ) : (
          <Tag size="small" text={tagLabel} className={styles.activeTag} />
        ))}

      <Modal
        isOpen={renameModalOpen}
        onClose={handleCloseRenameModal}
        onOutsideClick={handleCloseRenameModal}
        showScrollShadow={false}
        minWidth="31.25rem"
        maxWidth="40rem"
        title={i18n.t("brands.myBrand.price.segmentCard.renameModalTitle", {
          segmentName: segment.name ?? ""
        })}>
        <div className={styles.deleteModalContent}>
          <p className={styles.deleteModalBody}>
            {i18n.t("brands.myBrand.price.segmentCard.renameModalConfirm")}
          </p>
          <div className={styles.duplicateModalNameField}>
            <Input
              className={styles.duplicateModalInput}
              label={i18n.t("brands.myBrand.price.segmentCard.renameModalNameLabel")}
              placeholder={i18n.t("brands.myBrand.price.segmentCard.renameModalNamePlaceholder")}
              required={true}
              value={renameSegmentName}
              onChange={(e) => setRenameSegmentName(e.target.value)}
              state={renameNameValid || renameSegmentName.length === 0 ? "default" : "invalid"}
              description={
                renameNameValid || renameSegmentName.length === 0
                  ? ""
                  : i18n.t("brands.myBrand.price.segmentCard.renameModalNameRequired")
              }
              descriptionState={
                renameNameValid || renameSegmentName.length === 0 ? "default" : "invalid"
              }
              autoFocus={renameModalOpen}
            />
          </div>
          <div className={styles.deleteModalActions}>
            <Button
              text={i18n.t("brands.myBrand.price.segmentCard.duplicateModalCancel")}
              type="secondary"
              onClick={handleCloseRenameModal}
            />
            <Button
              text={i18n.t("brands.myBrand.price.segmentCard.renameModalSave")}
              type="primary"
              onClick={handleConfirmRename}
              disabled={!renameNameValid}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={duplicateModalOpen}
        onClose={handleCloseDuplicateModal}
        onOutsideClick={handleCloseDuplicateModal}
        showScrollShadow={false}
        minWidth="31.25rem"
        maxWidth="40rem"
        title={i18n.t("brands.myBrand.price.segmentCard.duplicateModalTitle", {
          segmentName: segment.name ?? ""
        })}>
        <div className={styles.deleteModalContent}>
          <p className={styles.deleteModalBody}>
            {i18n.t("brands.myBrand.price.segmentCard.duplicateModalConfirm")}
          </p>
          <div className={styles.duplicateModalNameField}>
            <Input
              className={styles.duplicateModalInput}
              label={i18n.t("brands.myBrand.price.segmentCard.duplicateModalNameLabel")}
              placeholder={i18n.t("brands.myBrand.price.segmentCard.duplicateModalNamePlaceholder")}
              required={true}
              value={duplicateSegmentName}
              onChange={(e) => setDuplicateSegmentName(e.target.value)}
              state={
                duplicateNameValid || duplicateSegmentName.length === 0 ? "default" : "invalid"
              }
              description={
                duplicateNameValid || duplicateSegmentName.length === 0
                  ? ""
                  : i18n.t("brands.myBrand.price.segmentCard.duplicateModalNameRequired")
              }
              descriptionState={
                duplicateNameValid || duplicateSegmentName.length === 0 ? "default" : "invalid"
              }
              autoFocus={duplicateModalOpen}
            />
          </div>
          <div className={styles.deleteModalActions}>
            <Button
              text={i18n.t("brands.myBrand.price.segmentCard.duplicateModalCancel")}
              type="secondary"
              onClick={handleCloseDuplicateModal}
            />
            <Button
              text={i18n.t("brands.myBrand.price.segmentCard.duplicateModalDuplicate")}
              type="primary"
              onClick={handleConfirmDuplicate}
              disabled={!duplicateNameValid}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onOutsideClick={handleCloseDeleteModal}
        showScrollShadow={false}
        minWidth="31.25rem"
        maxWidth="40rem"
        title={i18n.t("brands.myBrand.price.segmentCard.deleteModalTitle", {
          segmentName: segment.name ?? ""
        })}>
        <div className={styles.deleteModalContent}>
          <p className={styles.deleteModalBody}>
            {i18n.t("brands.myBrand.price.segmentCard.deleteModalConfirm")}
          </p>
          <div className={styles.deleteModalActions}>
            <Button
              text={i18n.t("brands.myBrand.price.segmentCard.deleteModalCancel")}
              type="secondary"
              onClick={handleCloseDeleteModal}
            />
            <Button
              text={i18n.t("brands.myBrand.price.segmentCard.deleteModalDelete")}
              type="ghost_danger"
              onClick={handleConfirmDelete}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SegmentCard;
