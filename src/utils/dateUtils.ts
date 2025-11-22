import i18n from '@/i18n/config';

/**
 * Get locale code for the current language
 */
const getLocaleCode = (): string => {
  const lang = i18n.language;
  const localeMap: Record<string, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    kn: 'kn-IN',
  };
  return localeMap[lang] || 'en-US';
};

/**
 * Format date according to current language
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocaleCode();
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return dateObj.toLocaleDateString(locale, defaultOptions);
};

/**
 * Format date to short format (e.g., "Jan 15, 2025")
 */
export const formatDateShort = (date: Date | string): string => {
  return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Get translated month abbreviation
 */
export const getMonthAbbr = (monthIndex: number): string => {
  const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return i18n.t(`months.${monthKeys[monthIndex]}`) || monthKeys[monthIndex];
};

/**
 * Get translated month name
 */
export const getMonthName = (monthIndex: number): string => {
  const monthKeys = ['january', 'february', 'march', 'april', 'mayFull', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  return i18n.t(`months.${monthKeys[monthIndex]}`) || monthKeys[monthIndex];
};

/**
 * Format number according to current language locale
 */
export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  const locale = getLocaleCode();
  return num.toLocaleString(locale, options);
};

/**
 * Format percentage according to current language locale
 */
export const formatPercentage = (num: number, decimals: number = 0): string => {
  const locale = getLocaleCode();
  return num.toLocaleString(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format number with percentage sign (for display purposes)
 */
export const formatNumberWithPercent = (num: number, showPlus: boolean = false): string => {
  const formatted = formatNumber(num);
  return showPlus && num > 0 ? `+${formatted}%` : `${formatted}%`;
};

/**
 * Format decimal number with specific decimal places
 */
export const formatDecimal = (num: number, decimals: number = 1): string => {
  const locale = getLocaleCode();
  return num.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

