/** Returns overdraft info when a wallet expense exceeds current balance. */
export function getWalletOverdraft(wallets, walletId, amount) {
  const wallet = wallets.find((w) => String(w.id) === String(walletId));
  if (!wallet) return null;

  const balance = Number(wallet.balance ?? 0);
  const expenseAmount = Number(amount);
  if (!(expenseAmount > balance)) return null;

  return {
    wallet,
    balance,
    expenseAmount,
    shortfall: expenseAmount - balance,
  };
}
