"use client";
import React from "react";
import { i18n } from "@adtraction/shared-i18n";
import { GetStartedChecklist } from "../original/GetStartedChecklist";
import { PARTNER_GET_STARTED_TASKS } from "./partnerGetStartedTasks";

const REJECTED_KEY = "platform.onboarding.partner.task.getApproved.rejected";

export const PartnerGetStartedChecklist = ({
  initialCompletedIds = [],
  channelsRejected = false,
  defaultExpanded = false,
  onTaskAction
}) => {
  const tasks = PARTNER_GET_STARTED_TASKS.map((task) => {
    if (!channelsRejected || task.id !== "getApproved") return task;
    const title = i18n.t(`${REJECTED_KEY}.title`);
    return { ...task, label: title, title, description: i18n.t(`${REJECTED_KEY}.description`) };
  });

  return (
    <GetStartedChecklist
      tasks={tasks}
      keyPrefix="platform.onboarding.partner"
      testId="partner-get-started"
      initialCompletedIds={initialCompletedIds}
      defaultExpanded={defaultExpanded}
      onTaskAction={onTaskAction}
      sequential
      allowSkip={false}
      completeOnAction={false}
    />
  );
};

export default PartnerGetStartedChecklist;
