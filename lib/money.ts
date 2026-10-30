const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Always two decimals ($1,683.00): fees are stored to the cent and printed totals must tie out. */
export function formatMoney(amount: number): string {
  return usd.format(amount);
}
