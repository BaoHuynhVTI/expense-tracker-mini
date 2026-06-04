"""Billing-cycle helpers for credit cards (statement close day each month)."""
from calendar import monthrange
from datetime import date, timedelta


def clamp_statement_day(day: int) -> int:
    return max(1, min(28, int(day)))


def _clamp_calendar_day(year: int, month: int, day: int) -> int:
    return min(day, monthrange(year, month)[1])


def billing_cycle_bounds(statement_day: int, reference: date | None = None) -> tuple[date, date]:
    """Inclusive start/end dates for the open billing cycle containing ``reference``.

    Charges on ``statement_day`` belong to the cycle that closes that day.
    Example: statement_day=25, reference=2026-06-02 → 2026-05-26 … 2026-06-25.
    """
    reference = reference or date.today()
    statement_day = clamp_statement_day(statement_day)

    end_day = _clamp_calendar_day(reference.year, reference.month, statement_day)
    if reference.day <= end_day:
        cycle_end = date(reference.year, reference.month, end_day)
    else:
        if reference.month == 12:
            year, month = reference.year + 1, 1
        else:
            year, month = reference.year, reference.month + 1
        cycle_end = date(year, month, _clamp_calendar_day(year, month, statement_day))

    if cycle_end.month == 1:
        prev_year, prev_month = cycle_end.year - 1, 12
    else:
        prev_year, prev_month = cycle_end.year, cycle_end.month - 1
    prev_end_day = _clamp_calendar_day(prev_year, prev_month, statement_day)
    prev_end = date(prev_year, prev_month, prev_end_day)
    cycle_start = prev_end + timedelta(days=1)
    return cycle_start, cycle_end
