import { toast, type ToastOptions } from "react-toastify";

const baseOptions: ToastOptions = {
  position: "top-right",
  autoClose: 2600,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const appToast = {
  success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      ...baseOptions,
      ...options,
    });
  },
  error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      ...baseOptions,
      autoClose: 3400,
      ...options,
    });
  },
  info(message: string, options?: ToastOptions) {
    return toast.info(message, {
      ...baseOptions,
      ...options,
    });
  },
  warning(message: string, options?: ToastOptions) {
    return toast.warning(message, {
      ...baseOptions,
      ...options,
    });
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
    return toast.promise(
      promise,
      {
        pending: messages.pending,
        success: messages.success,
        error: messages.error,
      },
      {
        ...baseOptions,
        ...options,
      },
    );
  },
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
};

export { toast };
