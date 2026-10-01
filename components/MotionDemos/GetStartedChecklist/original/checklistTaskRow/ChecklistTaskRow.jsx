import React from "react";
import { Icons } from "@adtraction/ui-icons";
import styles from "./ChecklistTaskRow.module.scss";

export const ChecklistTaskRow = ({ task, index, onSelect, locked = false }) => {
  const content = (
    <>
      <span className={styles.marker}>
        {task.completed ? (
          <Icons.General.CheckCircle
            className={styles.tick}
            width="1.375rem"
            height="1.375rem"
            color="var(--primary-blue-500---primary)"
            aria-hidden
          />
        ) : (
          <span className={styles.circle} />
        )}
      </span>
      <span className={styles.labelWrap}>
        <span className={styles.label}>
          {task.label}
          {task.completed ? <span className={styles.strike} aria-hidden /> : null}
        </span>
      </span>
      {!task.completed && !locked ? (
        <Icons.Arrow.ChevronRight className={styles.chevron} width="1rem" height="1rem" aria-hidden />
      ) : null}
    </>
  );

  if (locked) {
    return (
      <div className={styles.row} style={{ "--index": index }} data-locked="true">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={styles.row}
      style={{ "--index": index }}
      data-completed={task.completed}
      disabled={task.completed}
      onClick={() => onSelect(task.id)}>
      {content}
    </button>
  );
};
