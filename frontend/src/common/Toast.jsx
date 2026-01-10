import { useEffect } from "react";
import styles from "./Toast.module.css"; // or your existing css

const Toast = ({ open, message, type = "success", onClose }) => {
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000); // ⏱ 3 seconds

    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      {message}
    </div>
  );
};

export default Toast;
