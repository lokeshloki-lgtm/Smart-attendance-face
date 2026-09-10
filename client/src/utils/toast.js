import toast from 'react-hot-toast';

export const showSuccess = (message, duration = 3000) => {
  toast.success(message, {
    duration,
    position: 'top-right',
  });
};

export const showError = (message, duration = 4000) => {
  toast.error(message, {
    duration,
    position: 'top-right',
  });
};

export const showInfo = (message, duration = 3000) => {
  toast(message, {
    icon: 'ℹ️',
    duration,
    position: 'top-right',
  });
};

export const showWarning = (message, duration = 3000) => {
  toast(message, {
    icon: '⚠️',
    duration,
    position: 'top-right',
  });
};

export const showLoading = (message = 'Loading...') => {
  return toast.loading(message, {
    position: 'top-right',
  });
};

export const updateToast = (toastId, message, type = 'success') => {
  toast.remove(toastId);
  if (type === 'success') {
    showSuccess(message);
  } else if (type === 'error') {
    showError(message);
  } else {
    showInfo(message);
  }
};
