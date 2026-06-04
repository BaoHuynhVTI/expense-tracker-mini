"""Small shared helpers for the expenses app."""
from decimal import Decimal

from django.db.models import Sum

TWO_PLACES = Decimal("0.01")


def money(value):
    """Normalize a Decimal/amount to a fixed 2-decimal string (DB-agnostic)."""
    return str((value or Decimal("0")).quantize(TWO_PLACES))


def aggregate_sum(queryset, field="amount"):
    return queryset.aggregate(total=Sum(field))["total"] or Decimal("0")


def compute_wallet_balance(wallet, exclude_transfer=None):
    """Current wallet balance including transfers (mirrors WalletSerializer)."""
    from .models import Debt

    expenses = aggregate_sum(wallet.expenses)
    incomes = aggregate_sum(wallet.incomes)
    borrowed = aggregate_sum(
        wallet.debts.filter(
            direction=Debt.Direction.PAYABLE, affects_wallet=True
        ),
        "principal",
    )
    lent = aggregate_sum(
        wallet.debts.filter(
            direction=Debt.Direction.RECEIVABLE, affects_wallet=True
        ),
        "principal",
    )
    repaid = aggregate_sum(
        wallet.debt_payments.filter(
            debt__direction=Debt.Direction.PAYABLE, debt__affects_wallet=True
        )
    )
    collected = aggregate_sum(
        wallet.debt_payments.filter(
            debt__direction=Debt.Direction.RECEIVABLE, debt__affects_wallet=True
        )
    )
    credit_bills = aggregate_sum(wallet.credit_payments)

    transfers_out = wallet.transfers_out.all()
    transfers_in = wallet.transfers_in.all()
    if exclude_transfer is not None:
        transfers_out = transfers_out.exclude(pk=exclude_transfer.pk)
        transfers_in = transfers_in.exclude(pk=exclude_transfer.pk)

    transfers_out_total = aggregate_sum(transfers_out)
    transfers_in_total = aggregate_sum(transfers_in)

    return (
        wallet.initial_balance
        + incomes
        - expenses
        + borrowed
        - lent
        - repaid
        + collected
        - credit_bills
        - transfers_out_total
        + transfers_in_total
    )
