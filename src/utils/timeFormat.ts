/**
 * Time display format options
 */
export type TimeFormat = 'decimal' | 'hhmm';

const TIME_FORMAT_STORAGE_KEY = 'harvest-time-format';

/**
 * Get the user's preferred time format from localStorage
 * @returns The stored time format or 'hhmm' as default
 */
export const getTimeFormat = (): TimeFormat => {
  if (typeof window === 'undefined') return 'hhmm';

  const stored = localStorage.getItem(TIME_FORMAT_STORAGE_KEY);
  if (stored === 'decimal' || stored === 'hhmm') {
    return stored;
  }
  return 'hhmm'; // Default to hour:minute format
};

/**
 * Save the user's preferred time format to localStorage
 * @param format The time format to save
 */
export const setTimeFormat = (format: TimeFormat): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TIME_FORMAT_STORAGE_KEY, format);
};

/**
 * Format seconds to either decimal hours or "Xh Ym" format based on user preference
 * @param seconds Total seconds to format
 * @param format Optional format override. If not provided, uses stored preference
 * @returns Formatted time string
 */
export const formatTime = (seconds: number | undefined, format?: TimeFormat): string => {
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return format === 'decimal' || (format === undefined && getTimeFormat() === 'decimal')
      ? '0.0'
      : '0h 0m';
  }

  const actualFormat = format || getTimeFormat();
  const totalSeconds = Math.round(seconds);

  if (actualFormat === 'decimal') {
    const hours = totalSeconds / 3600;
    return hours.toFixed(1);
  } else {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

/**
 * Format hours (as decimal) to either decimal or "Xh Ym" format based on user preference
 * @param hours Hours as decimal number
 * @param format Optional format override. If not provided, uses stored preference
 * @returns Formatted time string
 */
export const formatHours = (hours: number | undefined, format?: TimeFormat): string => {
  if (hours === undefined || hours === null || isNaN(hours)) {
    return format === 'decimal' || (format === undefined && getTimeFormat() === 'decimal')
      ? '0.0'
      : '0h 0m';
  }

  const actualFormat = format || getTimeFormat();

  if (actualFormat === 'decimal') {
    return hours.toFixed(1);
  } else {
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
};
