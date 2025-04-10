import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as a currency amount
 * @param amount The amount to format
 * @param currency The currency code (e.g. USD, JPY)
 * @returns Formatted currency string
 */
export function formatAmount(amount: number, currency = "USD"): string {
  // For JPY, don't show decimal places since yen doesn't typically use them
  if (currency === "JPY") {
    const options: Intl.NumberFormatOptions = {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
      currencyDisplay: "symbol",
    };
    return new Intl.NumberFormat("ja-JP", options).format(amount);
  }

  // Default to USD formatting
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: currency,
  };
  return new Intl.NumberFormat("en-US", options).format(amount);
}
