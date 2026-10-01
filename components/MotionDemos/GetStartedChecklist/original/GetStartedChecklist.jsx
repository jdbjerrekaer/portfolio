import React, { useEffect, useState } from "react";
import { i18n } from "@adtraction/shared-i18n";
import { ChecklistHeader } from "./checklistHeader/ChecklistHeader";
import { ChecklistTaskRow } from "./checklistTaskRow/ChecklistTaskRow";
import { ChecklistTaskDetail } from "./checklistTaskDetail/ChecklistTaskDetail";
import { ChecklistCompleted } from "./checklistCompleted/ChecklistCompleted";
import styles from "./GetStartedChecklist.module.scss";

const CELEBRATION_DELAY_MS = 400;

const encouragementKeyForRemaining = (remaining) => {
  if (remaining === 0) return "platform.onboarding.checklist.encouragement.all";
  if (remaining === 1 || remaining === 2 || remaining === 3) {
    return `platform.onboarding.checklist.encouragement.${remaining}`;
  }
  return "platform.onboarding.checklist.encouragement.many";
};

export const GetStartedChecklist = ({
  tasks: taskDefs = [],
  keyPrefix,
  testId,
  initialCompletedIds = [],
  defaultExpanded = false,
  onTaskAction = () => {},
  sequential = false,
  allowSkip = true,
  completeOnAction = true
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [completedIds, setCompletedIds] = useState(initialCompletedIds);
  const completedKey = (initialCompletedIds || []).join("|");

  useEffect(() => {
    setCompletedIds((current) => {
      if (current.join("|") === completedKey) {
        return current;
      }
      return completedKey ? completedKey.split("|") : [];
    });
  }, [completedKey]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const tasks = taskDefs.map((task) => ({
    ...task,
    label: task.label ?? i18n.t(`${keyPrefix}.task.${task.id}.label`),
    title: task.title ?? i18n.t(`${keyPrefix}.task.${task.id}.title`),
    description: task.description ?? i18n.t(`${keyPrefix}.task.${task.id}.description`),
    ctaLabel: task.ctaLabel ?? i18n.t(`${keyPrefix}.task.${task.id}.cta`),
    completed: completedIds.includes(task.id)
  }));

  const done = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const nextTaskId = tasks.find((task) => !task.completed)?.id ?? null;
  const remaining = total - done;
  const allDone = total > 0 && done === total;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const selectedIndex = selectedTask ? tasks.findIndex((task) => task.id === selectedTask.id) : -1;

  useEffect(() => {
    if (!allDone || !expanded || selectedTaskId) {
      return undefined;
    }
    const timerId = window.setTimeout(() => setCelebrating(true), CELEBRATION_DELAY_MS);
    return () => window.clearTimeout(timerId);
  }, [allDone, expanded, selectedTaskId]);

  const completeTask = (taskId) => {
    setCompletedIds((current) => (current.includes(taskId) ? current : [...current, taskId]));
    setSelectedTaskId(null);
  };

  const encouragementKey = encouragementKeyForRemaining(remaining);
  const encouragementWords = String(i18n.t(encouragementKey) ?? "").split(" ");

  if (dismissed) {
    return null;
  }

  return (
    <div className={styles.card} data-testid={testId}>
      {celebrating ? (
        <ChecklistCompleted testId={testId} onContinue={() => setDismissed(true)} />
      ) : null}
      {!celebrating && selectedTask ? (
        <ChecklistTaskDetail
          task={selectedTask}
          index={selectedIndex}
          total={total}
          onBack={() => setSelectedTaskId(null)}
          onSkip={allowSkip ? () => completeTask(selectedTask.id) : undefined}
          onComplete={() => {
            onTaskAction(selectedTask.id);
            if (completeOnAction) {
              completeTask(selectedTask.id);
            } else {
              setSelectedTaskId(null);
            }
          }}
        />
      ) : null}
      {!celebrating && !selectedTask ? (
        <>
          <ChecklistHeader
            done={done}
            total={total}
            expanded={expanded}
            allDone={allDone}
            onToggle={() => setExpanded((current) => !current)}
          />
          <div className={styles.expand} data-open={expanded}>
            <div className={styles.expandInner}>
              <div className={styles.panel}>
                <div className={styles.list}>
                  {tasks.map((task, index) => (
                    <ChecklistTaskRow
                      key={task.id}
                      task={task}
                      index={index}
                      locked={sequential && !task.completed && task.id !== nextTaskId}
                      onSelect={(taskId) => {
                        if (sequential && taskId !== nextTaskId) {
                          return;
                        }
                        setSelectedTaskId(taskId);
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.footer}>
                <p className={styles.encouragement} key={encouragementKey}>
                  {encouragementWords.map((word, index) => (
                    <span
                      key={`${encouragementKey}-${index}`}
                      className={styles.word}
                      style={{ "--index": index }}>
                      {word}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default GetStartedChecklist;
