/**
 * Formats a number into a currency string (e.g., 100 -> $100.00)
 * @param amount - The numeric value to format
 * @param currency - The currency code (default: USD)
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};