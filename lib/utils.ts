export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function formatDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function debounce<T extends (...args: never[]) => void>(fn: T, wait = 700) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => fn(...args), wait);
  };
}
