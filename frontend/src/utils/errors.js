// Pull a human-readable message out of a failed API request error.
export function extractError(err, fallback = "Something went wrong.") {
  const data = err?.data || {};
  if (typeof data === "string" && data) return data;
  return (
    data.email?.[0] ||
    data.password?.[0] ||
    data.password_confirm?.[0] ||
    data.amount?.[0] ||
    data.principal?.[0] ||
    data.title?.[0] ||
    data.name?.[0] ||
    data.counterparty?.[0] ||
    data.category?.[0] ||
    data.source?.[0] ||
    data.wallet?.[0] ||
    data.from_wallet?.[0] ||
    data.to_wallet?.[0] ||
    data.transfer_date?.[0] ||
    data.credit?.[0] ||
    data.credit_limit?.[0] ||
    data.debt?.[0] ||
    data.spent_date?.[0] ||
    data.received_date?.[0] ||
    data.charged_date?.[0] ||
    data.incurred_date?.[0] ||
    data.paid_date?.[0] ||
    data.non_field_errors?.[0] ||
    data.detail ||
    fallback
  );
}
