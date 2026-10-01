import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../modal/Modal";
import { RadioButton } from "../../tokens/radio/radioButton/RadioButton";
import { Input } from "../../tokens/input/Input";
import { Button } from "../../tokens/button/Button";
import { Tag } from "../../tokens/tag/Tag";
import { Badge } from "../../tokens/badge/Badge";
import { Toaster } from "../../tokens/toaster/Toaster";
import { i18n } from "@adtraction/shared-i18n";
import styles from "./SubscribeModal.module.scss";

const MAIL_PRESET_VALUES_WITH_PILLS = new Set(["today", "yesterday", "last7", "last28", "last30"]);
const DEFAULT_PRESET = "yesterday";
const SUBJECT_LINE_MAX_LENGTH = 50;

function parseSubscribeModalDate(value) {
  if (!value) return null;
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split("-").map((n) => parseInt(n, 10));
    return new Date(yyyy, mm - 1, dd);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function ymdKeyCal(d) {
  if (!d || isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysCalModal(baseMidnight, days) {
  const dt = new Date(baseMidnight.getFullYear(), baseMidnight.getMonth(), baseMidnight.getDate());
  dt.setDate(dt.getDate() + days);
  return dt;
}

function formatDeliveryShort(date) {
  if (!date || isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(i18n.language || undefined, {
      weekday: "short",
      day: "numeric",
      month: "short"
    }).format(date);
  } catch {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}-${mm}`;
  }
}

// Dates on which the subscription email will actually be delivered, derived from frequency.
// Independent of the reporting window so the caption matches the user's mental model:
// "daily" → next 3 days, "monday" → next 3 Mondays, "monthly" → next 3 1st-of-month dates.
function computeNextDeliveryDates(frequency, count = 3) {
  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dates = [];

  if (frequency === "monday") {
    // First Monday strictly after today; if today is Sunday → next day, if Monday → +7.
    const dayOfWeek = todayMid.getDay(); // 0=Sun ... 1=Mon ... 6=Sat
    const daysUntilNextMonday = ((1 - dayOfWeek + 7) % 7) || 7;
    let next = addDaysCalModal(todayMid, daysUntilNextMonday);
    for (let i = 0; i < count; i++) {
      dates.push(next);
      next = addDaysCalModal(next, 7);
    }
    return dates;
  }

  if (frequency === "monthly") {
    // First "1st of month" strictly after today.
    let next = new Date(todayMid.getFullYear(), todayMid.getMonth() + 1, 1);
    for (let i = 0; i < count; i++) {
      dates.push(next);
      next = new Date(next.getFullYear(), next.getMonth() + 1, 1);
    }
    return dates;
  }

  // Daily: tomorrow, day after, etc.
  for (let i = 1; i <= count; i++) {
    dates.push(addDaysCalModal(todayMid, i));
  }
  return dates;
}

/** Same keys as {@link MAIL_PRESET_VALUES_WITH_PILLS} plus thismonth / lastmonth, else "custom". */
function classifyTableBoundsToMailPreset(startDateStr, endDateStr) {
  const start = parseSubscribeModalDate(startDateStr);
  const end = parseSubscribeModalDate(endDateStr);
  if (!start || !end) return DEFAULT_PRESET;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const s = ymdKeyCal(start);
  const e = ymdKeyCal(end);
  const t = ymdKeyCal(today);
  const y1 = ymdKeyCal(addDaysCalModal(today, -1));

  if (s === t && e === t) return "today";
  if (s === y1 && e === y1) return "yesterday";

  if (s === ymdKeyCal(addDaysCalModal(today, -7)) && e === y1) return "last7";
  if (s === ymdKeyCal(addDaysCalModal(today, -6)) && e === t) return "last7";

  if (s === ymdKeyCal(addDaysCalModal(today, -28)) && e === y1) return "last28";
  if (s === ymdKeyCal(addDaysCalModal(today, -27)) && e === t) return "last28";

  if (s === ymdKeyCal(addDaysCalModal(today, -30)) && e === y1) return "last30";
  if (s === ymdKeyCal(addDaysCalModal(today, -29)) && e === t) return "last30";

  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  if (s === ymdKeyCal(firstOfMonth) && e === t) return "thismonth";

  const lastOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);
  if (s === ymdKeyCal(firstOfPrevMonth) && e === ymdKeyCal(lastOfPrevMonth)) return "lastmonth";

  return "custom";
}

export const SubscribeModal = ({
  isOpen = false,
  onClose,
  onOutsideClick,
  tableName,
  subscribeReportName,
  activeFilters = [],
  currencyCode = null,
  dateRangeConfig = { mode: "preset" },
  defaultRecipients = "",
  onSubmit,
  onViewAllSubscriptions,
  modalVariant = "sidePanel",
  ...rest
}) => {
  const [frequency, setFrequency] = useState("daily");
  const [format, setFormat] = useState("pdf");
  const [recipients, setRecipients] = useState(defaultRecipients || "");
  const recipientsTouchedRef = useRef(Boolean(defaultRecipients));
  const [subject, setSubject] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [recipientsError, setRecipientsError] = useState("");
  const [subjectError, setSubjectError] = useState("");

  const parseDate = (value) => {
    if (!value) return null;
    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
      const [dd, mm, yyyy] = value.split("-").map((n) => parseInt(n, 10));
      return new Date(yyyy, mm - 1, dd);
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatShortDate = (date) => {
    if (!date || isNaN(date.getTime())) return "";
    const now = new Date();
    const opts = { day: "numeric", month: "short" };
    if (date.getFullYear() !== now.getFullYear()) opts.year = "numeric";
    try {
      return new Intl.DateTimeFormat(i18n.language || undefined, opts).format(date);
    } catch {
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      return `${dd}-${mm}`;
    }
  };

  const formatFirstDeliveryDate = (date) => {
    if (!date || isNaN(date.getTime())) return null;
    const now = new Date();
    const opts = { weekday: "short", day: "numeric", month: "short" };
    if (date.getFullYear() !== now.getFullYear()) opts.year = "numeric";
    try {
      return new Intl.DateTimeFormat(i18n.language || undefined, opts).format(date);
    } catch {
      return formatShortDate(date);
    }
  };

  const rollingRangeFromPreset = (presetKey) => {
    const today = new Date();
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (presetKey === "today") return { start: todayMid, end: todayMid };
    if (presetKey === "last7") return { start: addDaysCalModal(todayMid, -6), end: todayMid };
    if (presetKey === "last28") return { start: addDaysCalModal(todayMid, -27), end: todayMid };
    if (presetKey === "last30") return { start: addDaysCalModal(todayMid, -29), end: todayMid };
    const y = addDaysCalModal(todayMid, -1);
    return { start: y, end: y };
  };

  // The preset key we will send in the payload, fully derived from the table's dateRangeConfig
  // so the user never re-picks a range inside the modal.
  const derivedPreset = useMemo(() => {
    if (dateRangeConfig?.mode !== "custom") return DEFAULT_PRESET;
    return classifyTableBoundsToMailPreset(dateRangeConfig?.startDate, dateRangeConfig?.endDate);
  }, [dateRangeConfig?.mode, dateRangeConfig?.startDate, dateRangeConfig?.endDate]);

  // The concrete base range used to compute "next deliveries" and (for custom) payload start/end.
  const getCurrentRange = () => {
    if (dateRangeConfig?.mode === "custom") {
      if (MAIL_PRESET_VALUES_WITH_PILLS.has(derivedPreset)) {
        return rollingRangeFromPreset(derivedPreset);
      }
      const start = parseDate(dateRangeConfig?.startDate);
      const end = parseDate(dateRangeConfig?.endDate);
      if (start && end) return { start, end };
    }
    return rollingRangeFromPreset(derivedPreset);
  };

  const resetForm = () => {
    setFrequency("daily");
    setFormat("pdf");
    setRecipients(defaultRecipients || "");
    recipientsTouchedRef.current = Boolean(defaultRecipients);
    setSubject("");
    setRecipientsError("");
    setSubjectError("");
  };

  // Prefill recipients with the current user's email when modal opens, unless the
  // user has already typed something. This works even when defaultRecipients
  // becomes available after initial mount (async session load).
  useEffect(() => {
    if (!isOpen) return;
    if (recipientsTouchedRef.current) return;
    if (!defaultRecipients) return;
    setRecipients(defaultRecipients);
  }, [isOpen, defaultRecipients]);

  const toIsoDateLocal = (d) => {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const buildSubscriptionPayload = (validEmails) => {
    const range = getCurrentRange();
    const recipientsComma = validEmails
      .map((e) => String(e).trim())
      .filter(Boolean)
      .join(",");

    const payload = {
      frequency,
      format,
      subjectLine: subject.trim(),
      recipients: recipientsComma,
      // API: SaveMailSubscriptionRequest.dateRangePreset (@JsonAlias "dateRange")
      dateRangePreset: derivedPreset,
      ...(typeof tableName === "string" && tableName.trim() ? { tableName: tableName.trim() } : {})
    };

    if (derivedPreset === "custom") {
      payload.startDate = toIsoDateLocal(range.start);
      payload.endDate = toIsoDateLocal(range.end);
    }

    return payload;
  };

  const handleViewAllSubscriptions = () => {
    if (typeof onViewAllSubscriptions === "function") {
      onViewAllSubscriptions();
      return;
    }
    window.location.assign("/settings/subscriptions");
  };

  const dateRangeChip = useMemo(() => {
    // Prefer the rolling preset label whenever the bounds resolve to a known
    // preset — the backend will roll these forward at send time, so showing
    // absolute dates here misrepresents what gets emailed. Absolute dates are
    // only honest when the preset is genuinely "custom".
    const presetLabelKey = {
      today: "ui.toolkit.subscribeModal.today",
      yesterday: "ui.toolkit.subscribeModal.yesterday",
      last7: "ui.toolkit.subscribeModal.last7Days",
      last28: "ui.toolkit.subscribeModal.last28Days",
      last30: "ui.toolkit.subscribeModal.last30Days",
      thismonth: "ui.toolkit.subscribeModal.thisMonth",
      lastmonth: "ui.toolkit.subscribeModal.lastMonth"
    }[derivedPreset];
    if (presetLabelKey) {
      return { id: "date-range", text: i18n.t(presetLabelKey) };
    }
    if (dateRangeConfig?.mode === "custom") {
      const start = parseDate(dateRangeConfig?.startDate);
      const end = parseDate(dateRangeConfig?.endDate);
      if (start && end) {
        return {
          id: "date-range",
          text: `${formatShortDate(start)} – ${formatShortDate(end)}`
        };
      }
    }
    return null;
  }, [dateRangeConfig?.mode, dateRangeConfig?.startDate, dateRangeConfig?.endDate, derivedPreset]);

  const filterChips = useMemo(() => {
    const chips = Array.isArray(activeFilters)
      ? activeFilters.filter((f) => f?.id && f?.text)
      : [];
    return dateRangeChip ? [...chips, dateRangeChip] : chips;
  }, [activeFilters, dateRangeChip]);

  const hasCurrencyBadge = typeof currencyCode === "string" && currencyCode.trim().length > 0;
  const hasAnyChips = hasCurrencyBadge || filterChips.length > 0;
  // A custom date range that doesn't map to a preset is sent to the backend as
  // literal start/end dates — the backend will not roll it. Show an explicit
  // caption so the user understands every delivery uses the same window.
  const hasFixedDateRange = derivedPreset === "custom" && !!dateRangeChip;

  const nextDeliveryDates = useMemo(
    () =>
      computeNextDeliveryDates(frequency, 3)
        .map((d) => formatDeliveryShort(d))
        .filter(Boolean),
    [frequency]
  );

  const resolvedReportName =
    (typeof subscribeReportName === "string" && subscribeReportName.trim()) ||
    (typeof tableName === "string" && tableName.trim()) ||
    null;

  const subjectPlaceholder = useMemo(() => {
    if (!resolvedReportName) return i18n.t("ui.toolkit.subscribeModal.subjectPlaceholder");
    const cap = resolvedReportName.charAt(0).toUpperCase() + resolvedReportName.slice(1);
    const key =
      {
        daily: "ui.toolkit.subscribeModal.subjectPlaceholderDaily",
        monday: "ui.toolkit.subscribeModal.subjectPlaceholderWeekly",
        monthly: "ui.toolkit.subscribeModal.subjectPlaceholderMonthly"
      }[frequency] || "ui.toolkit.subscribeModal.subjectPlaceholderDaily";
    return i18n.t(key, { reportName: cap });
  }, [resolvedReportName, frequency]);

  return (
    <Modal
      id="table-subscribe-modal"
      isOpen={isOpen}
      onClose={onClose}
      onOutsideClick={onOutsideClick ?? onClose}
      showCloseButton={true}
      dismissible={true}
      title={
        resolvedReportName
          ? i18n.t("ui.toolkit.subscribeModal.subscribeTo", { tableName: resolvedReportName })
          : i18n.t("ui.toolkit.subscribeModal.subscribeToTable")
      }
      {...rest}
      variant={modalVariant}>
      <div className={styles.container} data-modal-variant={modalVariant}>
        <p className={styles.description}>{i18n.t("ui.toolkit.subscribeModal.description")}</p>

        <div className={styles.section}>
          <p className={styles.section_title}>
            {i18n.t("ui.toolkit.subscribeModal.activeFilters")}
          </p>
          {hasAnyChips ? (
            <>
              <div
                className={styles.active_filters_row}
                aria-label={i18n.t("ui.toolkit.subscribeModal.activeFilters")}>
                {hasCurrencyBadge && (
                  <Badge text={currencyCode} size="small" hideCurrencyTooltip />
                )}
                {filterChips.map((chip) => (
                  <Tag key={chip.id} text={chip.text} iconLeft={chip.iconLeft} />
                ))}
              </div>
              {hasFixedDateRange && (
                <p className={styles.section_hint}>
                  {i18n.t("ui.toolkit.subscribeModal.fixedDateRangeHint")}
                </p>
              )}
            </>
          ) : (
            <p className={styles.section_hint}>
              {i18n.t("ui.toolkit.subscribeModal.noActiveFilters")}
            </p>
          )}
        </div>

        <div className={styles.section}>
          <p className={styles.section_title}>{i18n.t("ui.toolkit.subscribeModal.frequency")}</p>
          <div
            className={styles.pill_group}
            role="radiogroup"
            aria-label={i18n.t("ui.toolkit.subscribeModal.frequency")}>
            <RadioButton
              type="pill"
              text={i18n.t("ui.toolkit.subscribeModal.daily")}
              active={frequency === "daily"}
              onClick={() => setFrequency("daily")}
            />
            <RadioButton
              type="pill"
              text={i18n.t("ui.toolkit.subscribeModal.everyMonday")}
              active={frequency === "monday"}
              onClick={() => setFrequency("monday")}
            />
            <RadioButton
              type="pill"
              text={i18n.t("ui.toolkit.subscribeModal.firstOfEveryMonth")}
              active={frequency === "monthly"}
              onClick={() => setFrequency("monthly")}
            />
          </div>
          {nextDeliveryDates.length > 0 && (
            <div className={styles.next_deliveries}>
              <p className={styles.next_deliveries_label}>
                {i18n.t("ui.toolkit.subscribeModal.nextDeliveries")}
              </p>
              <div
                className={styles.next_deliveries_row}
                aria-label={i18n.t("ui.toolkit.subscribeModal.nextDeliveries")}>
                {nextDeliveryDates.map((d) => (
                  <Tag key={d} text={d} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <p className={styles.section_title}>{i18n.t("ui.toolkit.subscribeModal.format")}</p>
          <div
            className={styles.pill_group}
            role="radiogroup"
            aria-label={i18n.t("ui.toolkit.subscribeModal.format")}>
            <RadioButton
              type="pill"
              text={i18n.t("ui.toolkit.subscribeModal.pdf")}
              active={format === "pdf"}
              onClick={() => setFormat("pdf")}
            />
            <RadioButton
              type="pill"
              text={i18n.t("ui.toolkit.subscribeModal.xlsx")}
              active={format === "xlsx"}
              onClick={() => setFormat("xlsx")}
            />
            <RadioButton
              type="pill"
              text={i18n.t("ui.toolkit.subscribeModal.csv")}
              active={format === "csv"}
              onClick={() => setFormat("csv")}
            />
          </div>
        </div>

        <div className={styles.section}>
          <Input
            label={i18n.t("ui.toolkit.subscribeModal.recipients")}
            description={
              recipientsError || i18n.t("ui.toolkit.subscribeModal.recipientsDescription")
            }
            descriptionState={recipientsError ? "invalid" : "default"}
            state={recipientsError ? "invalid" : "default"}
            value={recipients}
            onChange={(e) => {
              const v = e.target.value;
              setRecipients(v);
              recipientsTouchedRef.current = true;
              if (recipientsError) {
                const emails = (v || "")
                  .split(/[,\s]+/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                const isValid = emails.some((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
                if (isValid) setRecipientsError("");
              }
            }}
            placeholder={i18n.t("ui.toolkit.subscribeModal.recipientsPlaceholder")}
          />
        </div>

        <div className={styles.section}>
          <Input
            label={i18n.t("ui.toolkit.subscribeModal.emailSubject")}
            value={subject}
            maxLength={SUBJECT_LINE_MAX_LENGTH}
            description={
              subjectError || i18n.t("ui.toolkit.subscribeModal.subjectDescription")
            }
            descriptionState={subjectError ? "invalid" : "default"}
            state={subjectError ? "invalid" : "default"}
            onChange={(e) => {
              const v = e.target.value;
              setSubject(v);
              if (subjectError && v.trim().length > 0) setSubjectError("");
            }}
            placeholder={subjectPlaceholder}
          />
        </div>

        <div className={styles.footer_actions}>
          <Button
            type="ghost"
            text={i18n.t("ui.toolkit.subscribeModal.viewAll")}
            onClick={handleViewAllSubscriptions}
          />
          <div className={styles.footer_right_actions}>
            <Button
              type="secondary"
              text={i18n.t("ui.toolkit.subscribeModal.cancel")}
              onClick={onClose}
            />
            <Button
              type="primary"
              text={i18n.t("ui.toolkit.subscribeModal.save")}
              loading={isSaving}
              onClick={async () => {
                if (isSaving) return;
                let hasError = false;
                if (!subject.trim()) {
                  setSubjectError(i18n.t("ui.toolkit.subscribeModal.enterSubject"));
                  hasError = true;
                }
                const emails = (recipients || "")
                  .split(/[\s,]+/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                const validEmails = emails.filter((email) =>
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                );
                if (validEmails.length === 0) {
                  setRecipientsError(i18n.t("ui.toolkit.subscribeModal.enterValidEmail"));
                  hasError = true;
                }
                if (hasError) {
                  Toaster.trigger({
                    type: "error",
                    title: i18n.t("ui.toolkit.subscribeModal.updateFields"),
                    description: i18n.t("ui.toolkit.subscribeModal.updateFieldsDescription")
                  });
                  return;
                }

                const payload = buildSubscriptionPayload(validEmails);

                if (typeof onSubmit !== "function") {
                  Toaster.trigger({
                    type: "error",
                    title: i18n.t("ui.toolkit.subscribeModal.onSubmitNotConfiguredTitle"),
                    description: i18n.t(
                      "ui.toolkit.subscribeModal.onSubmitNotConfiguredDescription"
                    )
                  });
                  return;
                }

                try {
                  setIsSaving(true);
                  const submitResult = await Promise.resolve(onSubmit(payload));
                  const successTitle =
                    submitResult?.successTitle ??
                    i18n.t("ui.toolkit.subscribeModal.subscriptionCreated");
                  const firstDelivery = computeNextDeliveryDates(frequency, 1)[0];
                  const firstDeliveryFormatted =
                    firstDelivery && formatFirstDeliveryDate(firstDelivery);
                  const successDescription = firstDeliveryFormatted
                    ? i18n.t("ui.toolkit.subscribeModal.firstDelivery", {
                        date: firstDeliveryFormatted
                      })
                    : (submitResult?.successDescription ??
                      i18n.t("ui.toolkit.subscribeModal.subscriptionSavedDescription"));
                  Toaster.trigger({
                    title: successTitle,
                    description: successDescription
                  });
                  resetForm();
                  onClose?.();
                } catch (e) {
                  const message = e?.message || i18n.t("ui.toolkit.table.unknownError");
                  Toaster.trigger({
                    type: "error",
                    title: i18n.t("ui.toolkit.subscribeModal.failedToSave"),
                    description: message
                  });
                } finally {
                  setIsSaving(false);
                }
              }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SubscribeModal;
