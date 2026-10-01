const execCommandCopy = (value) => {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  let succeeded;
  try {
    // execCommand is absent in some environments (jsdom) and throws rather than
    // returning false; the textarea must still be torn down.
    succeeded = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }

  if (!succeeded) {
    throw new Error("Clipboard write failed");
  }
};

/**
 * Cross-browser clipboard write.
 *
 * Falls back to an off-screen textarea + document.execCommand("copy") when the async
 * Clipboard API is absent OR rejects the write — Edge rejects writes outside a fresh
 * user gesture rather than throwing synchronously (ADTR-9973).
 *
 * @param {string} value - Text to place on the clipboard.
 * @returns {Promise<void>} Resolves when the write succeeds; rejects otherwise.
 */
export const writeToClipboard = async (value) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      execCommandCopy(value);
      return;
    }
  }
  execCommandCopy(value);
};
