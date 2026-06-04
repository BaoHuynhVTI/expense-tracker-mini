"""Expense domain models. Everything is scoped to a single user."""
from decimal import Decimal

from django.contrib.auth.models import User
from django.db import models


class Category(models.Model):
    """A user-defined expense category (name + color)."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="categories"
    )
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#6b7280")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("user", "name")
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Wallet(models.Model):
    """A user-defined wallet with an initial balance."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wallets")
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#4f46e5")
    initial_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("user", "name")

    def __str__(self):
        return self.name


class IncomeSource(models.Model):
    """A user-defined income source (e.g. Salary, Bonus)."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="income_sources"
    )
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#16a34a")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("user", "name")

    def __str__(self):
        return self.name


class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="expenses")
    wallet = models.ForeignKey(
        Wallet, on_delete=models.PROTECT, related_name="expenses"
    )
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="expenses"
    )
    title = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)
    spent_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-spent_date", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.amount})"


class Income(models.Model):
    """Money coming into a wallet (increases its balance)."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="incomes")
    wallet = models.ForeignKey(
        Wallet, on_delete=models.PROTECT, related_name="incomes"
    )
    source = models.ForeignKey(
        IncomeSource, on_delete=models.PROTECT, related_name="incomes"
    )
    title = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)
    received_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-received_date", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.amount})"


class Counterparty(models.Model):
    """Someone you borrow from or lend to (debt actor)."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="counterparties"
    )
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("user", "name")
        verbose_name_plural = "counterparties"

    def __str__(self):
        return self.name


class Debt(models.Model):
    """A debt the user owes (payable) or is owed (receivable).

    The principal moves through `wallet`: borrowing (payable) increases the
    wallet, lending (receivable) decreases it. Repayments are tracked as
    DebtPayment rows and move the wallet the opposite way.
    """

    class Direction(models.TextChoices):
        PAYABLE = "payable", "Payable"  # I borrowed -> I owe
        RECEIVABLE = "receivable", "Receivable"  # I lent -> owed to me

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="debts")
    counterparty = models.ForeignKey(
        Counterparty, on_delete=models.PROTECT, related_name="debts"
    )
    wallet = models.ForeignKey(
        Wallet, on_delete=models.PROTECT, related_name="debts", null=True, blank=True
    )
    affects_wallet = models.BooleanField(
        default=True,
        help_text="When true, principal adjusts the linked wallet balance.",
    )
    direction = models.CharField(max_length=12, choices=Direction.choices)
    principal = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.TextField(blank=True)
    incurred_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-incurred_date", "-created_at"]

    def __str__(self):
        return f"{self.get_direction_display()} {self.counterparty.name} ({self.principal})"


class DebtPayment(models.Model):
    """A repayment toward a debt, settled through a wallet."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="debt_payments"
    )
    debt = models.ForeignKey(Debt, on_delete=models.CASCADE, related_name="payments")
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.PROTECT,
        related_name="debt_payments",
        null=True,
        blank=True,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.TextField(blank=True)
    paid_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-paid_date", "-created_at"]

    def __str__(self):
        return f"Payment {self.amount} for debt #{self.debt_id}"


class WalletTransfer(models.Model):
    """Move money between two wallets (not income or spending)."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="wallet_transfers"
    )
    from_wallet = models.ForeignKey(
        Wallet, on_delete=models.PROTECT, related_name="transfers_out"
    )
    to_wallet = models.ForeignKey(
        Wallet, on_delete=models.PROTECT, related_name="transfers_in"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.TextField(blank=True)
    transfer_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-transfer_date", "-created_at"]

    def __str__(self):
        return f"{self.amount} from #{self.from_wallet_id} to #{self.to_wallet_id}"


class Credit(models.Model):
    """A user-defined credit card with a spending limit."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="credits")
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#702c37")
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2)
    # Day of month (1–28) when the statement closes; drives monthly cycle totals.
    statement_day = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("user", "name")

    def __str__(self):
        return self.name


class CreditCharge(models.Model):
    """A purchase made on a credit card (increases amount owed)."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="credit_charges"
    )
    credit = models.ForeignKey(
        Credit, on_delete=models.PROTECT, related_name="charges"
    )
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="credit_charges"
    )
    title = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)
    charged_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-charged_date", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.amount})"


class CreditPayment(models.Model):
    """Paying a credit card bill from a wallet."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="credit_payments"
    )
    credit = models.ForeignKey(
        Credit, on_delete=models.CASCADE, related_name="payments"
    )
    wallet = models.ForeignKey(
        Wallet, on_delete=models.PROTECT, related_name="credit_payments"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.TextField(blank=True)
    paid_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-paid_date", "-created_at"]

    def __str__(self):
        return f"Credit payment {self.amount} for #{self.credit_id}"
