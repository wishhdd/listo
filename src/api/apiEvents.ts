const API_EVENT_UNAUTHORIZED = 'unauthorized';
const eventTarget = new EventTarget();

export const triggerUnauthorized = () => {
  eventTarget.dispatchEvent(new Event(API_EVENT_UNAUTHORIZED));
};

export const onUnauthorized = (callback: () => void) => {
  const handler = () => callback();
  eventTarget.addEventListener(API_EVENT_UNAUTHORIZED, handler);
  return () => {
    eventTarget.removeEventListener(API_EVENT_UNAUTHORIZED, handler);
  };
};
