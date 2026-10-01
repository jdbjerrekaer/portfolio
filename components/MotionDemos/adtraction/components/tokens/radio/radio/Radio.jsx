import React from "react";
import clsx from "clsx";
import styles from "../RadioButton.module.scss";

export const Radio = ({
  value = "",
  size = "small",
  disabled = false,
  checked = false,
  onChange = () => {},
  id = "",
  name = ""
}) => {
  return (
    <input
      className={clsx(styles.radio_button_input, styles[size])}
      data-disabled={disabled}
      type="radio"
      disabled={disabled}
      value={value}
      checked={checked}
      onChange={onChange}
      id={id}
      name={name}
    />
  );
};
