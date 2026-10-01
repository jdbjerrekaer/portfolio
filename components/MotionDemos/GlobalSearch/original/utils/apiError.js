/**
 * Read machine-readable error code from data-access-agent / superagent-style errors.
 */
export function getErrorCodeFromClientError(err) {
  const body = err?.response?.body ?? err?.body;
  if (body && typeof body === "object") {
    if (typeof body.errorCode === "string") return body.errorCode;
    if (typeof body.message === "string" && body.message.startsWith("platform.api.")) {
      return body.message;
    }
  }
  return null;
}

export function getHttpStatusFromClientError(err) {
  return err?.status ?? err?.statusCode ?? err?.response?.status;
}
