export type ToastOptions = {
  autoClose?: number;
  closeOnClick?: boolean;
  draggable?: boolean;
  hideProgressBar?: boolean;
  pauseOnHover?: boolean;
  position?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
};

type ToastLevel = "success" | "error" | "info" | "warning";
type ToastId = number;

let toastSequence = 0;

const logToast = (
  level: ToastLevel,
  message: string,
  _options?: ToastOptions,
): ToastId => {
  toastSequence += 1;

  const logger =
    level === "error"
      ? console.error
      : level === "warning"
        ? console.warn
        : console.log;

  logger(`[toast:${level}] ${message}`);
  return toastSequence;
};

export const toast = {
  success(message: string, options?: ToastOptions) {
    return logToast("success", message, options);
  },
  error(message: string, options?: ToastOptions) {
    return logToast("error", message, options);
  },
  info(message: string, options?: ToastOptions) {
    return logToast("info", message, options);
  },
  warning(message: string, options?: ToastOptions) {
    return logToast("warning", message, options);
  },
  promise<T>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string;
      error: string;
    },
    options?: ToastOptions,
  ) {
    logToast("info", messages.pending, options);

    return promise
      .then((result) => {
        logToast("success", messages.success, options);
        return result;
      })
      .catch((error) => {
        logToast("error", messages.error, options);
        throw error;
      });
  },
  dismiss(_id?: string | number) {
    return;
  },
};

export const appToast = {
  success(message: string, options?: ToastOptions) {
    return toast.success(message, options);
  },
  error(message: string, options?: ToastOptions) {
    return toast.error(message, options);
  },
  info(message: string, options?: ToastOptions) {
    return toast.info(message, options);
  },
  warning(message: string, options?: ToastOptions) {
    return toast.warning(message, options);
  },
  promise<T>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string;
      error: string;
    },
    options?: ToastOptions,
  ) {
    return toast.promise(promise, messages, options);
  },
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
};
