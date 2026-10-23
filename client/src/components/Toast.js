import React, { useEffect, useState } from "react";

let pushToastFn = null;

export function pushToast(message, type = "info") {
  if (pushToastFn) pushToastFn(message, type);
}

function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    pushToastFn = (message, type) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    };
    return () => { pushToastFn = null; };
  }, []);

  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default ToastHost;
