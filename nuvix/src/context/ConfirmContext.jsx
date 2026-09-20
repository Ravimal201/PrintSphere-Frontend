import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { AlertTriangle, Trash2, AlertCircle, Info, CheckCircle2, X } from "lucide-react";

const ConfirmContext = createContext(null);

// Global handler reference for imperative calls anywhere in the app
let globalConfirmHandler = null;

export const confirmAction = (options) => {
  if (globalConfirmHandler) {
    return globalConfirmHandler(options);
  }
  // Fallback to native if context is unmounted
  return Promise.resolve(window.confirm(typeof options === "string" ? options : options?.message || "Are you sure?"));
};

export const alertAction = (options) => {
  if (globalConfirmHandler) {
    const opts = typeof options === "string" ? { message: options } : options;
    return globalConfirmHandler({ ...opts, isAlert: true });
  }
  // Fallback
  window.alert(typeof options === "string" ? options : options?.message || "");
  return Promise.resolve();
};

export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "danger", // 'danger' | 'warning' | 'info' | 'success'
    isAlert: false,
  });

  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      if (typeof options === "string") {
        setModalState({
          isOpen: true,
          title: "Confirmation Required",
          message: options,
          confirmText: "Confirm",
          cancelText: "Cancel",
          type: "danger",
          isAlert: false,
        });
      } else {
        const type = options?.type || "danger";
        const defaultConfirmText = type === "danger" ? "Delete" : "Confirm";
        setModalState({
          isOpen: true,
          title: options?.title || (type === "danger" ? "Confirm Deletion" : "Confirm Action"),
          message: options?.message || "Are you sure you want to proceed?",
          confirmText: options?.confirmText || defaultConfirmText,
          cancelText: options?.cancelText || "Cancel",
          type,
          isAlert: Boolean(options?.isAlert),
        });
      }
    });
  }, []);

  const alert = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      if (typeof options === "string") {
        setModalState({
          isOpen: true,
          title: "Notice",
          message: options,
          confirmText: "OK",
          cancelText: "",
          type: "info",
          isAlert: true,
        });
      } else {
        setModalState({
          isOpen: true,
          title: options?.title || "Notice",
          message: options?.message || "",
          confirmText: options?.confirmText || options?.okText || "OK",
          cancelText: "",
          type: options?.type || "info",
          isAlert: true,
        });
      }
    });
  }, []);

  useEffect(() => {
    globalConfirmHandler = (options) => {
      if (options?.isAlert) {
        return alert(options);
      }
      return confirm(options);
    };
    return () => {
      globalConfirmHandler = null;
    };
  }, [confirm, alert]);

  const handleConfirm = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  // Keyboard accessibility (Enter to confirm, Escape to cancel)
  useEffect(() => {
    if (!modalState.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCancel();
      } else if (e.key === "Enter" && !modalState.isAlert) {
        // Prevent accidental triggers if active element is cancel
        if (document.activeElement?.dataset?.action !== "cancel") {
          handleConfirm();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalState.isOpen]);

  const getIcon = () => {
    switch (modalState.type) {
      case "danger":
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-sm">
            <Trash2 className="w-6 h-6" />
          </div>
        );
      case "warning":
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case "success":
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
            <Info className="w-6 h-6" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (modalState.type) {
      case "danger":
        return "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/25";
      case "warning":
        return "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25";
      case "success":
        return "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25";
      case "info":
      default:
        return "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25";
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}

      {modalState.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={modalState.isAlert ? handleConfirm : handleCancel}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-7 overflow-hidden z-10 animate-in zoom-in-95 fade-in duration-200">
            {/* Top close button */}
            <button
              onClick={modalState.isAlert ? handleConfirm : handleCancel}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              {getIcon()}
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {modalState.title}
                </h3>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed break-words whitespace-pre-line">
                  {modalState.message}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-2">
              {!modalState.isAlert && (
                <button
                  type="button"
                  data-action="cancel"
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                >
                  {modalState.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition active:scale-95 cursor-pointer ${
                  modalState.isAlert ? "w-full text-center" : ""
                } ${getConfirmButtonClasses()}`}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    return {
      confirm: confirmAction,
      alert: alertAction,
    };
  }
  return context;
};

export default ConfirmContext;
