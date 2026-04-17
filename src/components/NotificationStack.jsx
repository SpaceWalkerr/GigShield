import { useEffect, useState } from "react";
import { subscribeNotifications } from "../utils/notifications";

function NotificationStack() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeNotifications((notification) => {
      setItems((current) => [notification, ...current].slice(0, 4));
      window.setTimeout(() => {
        setItems((current) => current.filter((entry) => entry.id !== notification.id));
      }, 3500);
    });

    return unsubscribe;
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[320px] flex-col gap-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-xl border border-coal-200 bg-white px-3 py-2 shadow-edge"
          role="status"
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-coal-500">{item.type}</p>
          <p className="mt-1 text-sm font-semibold text-coal-900">{item.title}</p>
          {item.message ? <p className="mt-1 text-xs text-coal-600">{item.message}</p> : null}
        </article>
      ))}
    </div>
  );
}

export default NotificationStack;

