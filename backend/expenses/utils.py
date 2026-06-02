"""Small shared helpers for the expenses app."""
from decimal import Decimal

TWO_PLACES = Decimal("0.01")


def money(value):
    """Normalize a Decimal/amount to a fixed 2-decimal string (DB-agnostic)."""
    return str((value or Decimal("0")).quantize(TWO_PLACES))
