"""Serializers for the expenses app."""
from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from .models import (
    Category,
    Counterparty,
    Credit,
    CreditCharge,
    CreditPayment,
    Debt,
    DebtPayment,
    Expense,
    Income,
    IncomeSource,
    Wallet,
    WalletTransfer,
)
from .credit_billing import billing_cycle_bounds
from .utils import compute_wallet_balance, money


def _sum(queryset, field="amount"):
    return queryset.aggregate(total=Sum(field))["total"] or Decimal("0")


class _NamedColorSerializer(serializers.ModelSerializer):
    """Shared base for the simple name+color lookup models."""

    duplicate_message = "This name already exists."
    duplicate_model = None

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please enter a name.")
        user = self.context["request"].user
        qs = self.duplicate_model.objects.filter(user=user, name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(self.duplicate_message)
        return value


class CategorySerializer(_NamedColorSerializer):
    duplicate_message = "This category already exists."
    duplicate_model = Category

    class Meta:
        model = Category
        fields = ("id", "name", "color", "created_at")
        read_only_fields = ("id", "created_at")


class IncomeSourceSerializer(_NamedColorSerializer):
    duplicate_message = "This income source already exists."
    duplicate_model = IncomeSource

    class Meta:
        model = IncomeSource
        fields = ("id", "name", "color", "created_at")
        read_only_fields = ("id", "created_at")


class WalletSerializer(serializers.ModelSerializer):
    spent = serializers.SerializerMethodField()
    total_income = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = (
            "id",
            "name",
            "color",
            "initial_balance",
            "spent",
            "total_income",
            "balance",
            "created_at",
        )
        read_only_fields = ("id", "spent", "total_income", "balance", "created_at")

    def get_spent(self, obj):
        return money(_sum(obj.expenses))

    def get_total_income(self, obj):
        return money(_sum(obj.incomes))

    def get_balance(self, obj):
        return money(compute_wallet_balance(obj))

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please enter a name.")
        user = self.context["request"].user
        qs = Wallet.objects.filter(user=user, name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This wallet already exists.")
        return value

    def validate_initial_balance(self, value):
        if value is None or value < 0:
            raise serializers.ValidationError("Initial balance cannot be negative.")
        return value


class ExpenseSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source="category", read_only=True)
    wallet_detail = WalletSerializer(source="wallet", read_only=True)

    class Meta:
        model = Expense
        fields = (
            "id",
            "title",
            "amount",
            "category",
            "category_detail",
            "wallet",
            "wallet_detail",
            "note",
            "spent_date",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please enter a title.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        category = attrs.get("category")
        wallet = attrs.get("wallet")
        if category is not None and category.user_id != user.id:
            raise serializers.ValidationError({"category": "Invalid category."})
        if wallet is not None and wallet.user_id != user.id:
            raise serializers.ValidationError({"wallet": "Invalid wallet."})
        return attrs


class IncomeSerializer(serializers.ModelSerializer):
    source_detail = IncomeSourceSerializer(source="source", read_only=True)
    wallet_detail = WalletSerializer(source="wallet", read_only=True)

    class Meta:
        model = Income
        fields = (
            "id",
            "title",
            "amount",
            "source",
            "source_detail",
            "wallet",
            "wallet_detail",
            "note",
            "received_date",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please enter a title.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        source = attrs.get("source")
        wallet = attrs.get("wallet")
        if source is not None and source.user_id != user.id:
            raise serializers.ValidationError({"source": "Invalid income source."})
        if wallet is not None and wallet.user_id != user.id:
            raise serializers.ValidationError({"wallet": "Invalid wallet."})
        return attrs


class WalletTransferSerializer(serializers.ModelSerializer):
    from_wallet_detail = WalletSerializer(source="from_wallet", read_only=True)
    to_wallet_detail = WalletSerializer(source="to_wallet", read_only=True)

    class Meta:
        model = WalletTransfer
        fields = (
            "id",
            "from_wallet",
            "from_wallet_detail",
            "to_wallet",
            "to_wallet_detail",
            "amount",
            "note",
            "transfer_date",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def _resolved(self, attrs, field):
        if field in attrs:
            return attrs[field]
        if self.instance is not None:
            return getattr(self.instance, field)
        return None

    def validate(self, attrs):
        user = self.context["request"].user
        from_wallet = self._resolved(attrs, "from_wallet")
        to_wallet = self._resolved(attrs, "to_wallet")
        amount = self._resolved(attrs, "amount")

        if from_wallet is not None and from_wallet.user_id != user.id:
            raise serializers.ValidationError(
                {"from_wallet": "Invalid source wallet."}
            )
        if to_wallet is not None and to_wallet.user_id != user.id:
            raise serializers.ValidationError(
                {"to_wallet": "Invalid destination wallet."}
            )
        if from_wallet is not None and to_wallet is not None:
            if from_wallet.pk == to_wallet.pk:
                raise serializers.ValidationError(
                    {"to_wallet": "Source and destination must be different."}
                )

        if from_wallet is not None and amount is not None:
            balance = compute_wallet_balance(
                from_wallet, exclude_transfer=self.instance
            )
            if amount > balance:
                raise serializers.ValidationError(
                    {
                        "amount": "Insufficient balance in the source wallet."
                    }
                )
        return attrs


def _counterparty_direction_remaining(counterparty, direction):
    total = Decimal("0")
    for debt in counterparty.debts.filter(direction=direction):
        remaining = debt.principal - _sum(debt.payments.all())
        if remaining > 0:
            total += remaining
    return money(total)


class CounterpartyBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Counterparty
        fields = ("id", "name")
        read_only_fields = fields


class CounterpartySerializer(serializers.ModelSerializer):
    payable_remaining = serializers.SerializerMethodField()
    receivable_remaining = serializers.SerializerMethodField()
    debt_count = serializers.SerializerMethodField()

    class Meta:
        model = Counterparty
        fields = (
            "id",
            "name",
            "payable_remaining",
            "receivable_remaining",
            "debt_count",
            "created_at",
        )
        read_only_fields = (
            "id",
            "payable_remaining",
            "receivable_remaining",
            "debt_count",
            "created_at",
        )

    def get_payable_remaining(self, obj):
        return _counterparty_direction_remaining(obj, Debt.Direction.PAYABLE)

    def get_receivable_remaining(self, obj):
        return _counterparty_direction_remaining(obj, Debt.Direction.RECEIVABLE)

    def get_debt_count(self, obj):
        return obj.debts.count()

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please enter a name.")
        user = self.context["request"].user
        qs = Counterparty.objects.filter(user=user, name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This counterparty already exists.")
        return value


class DebtPaymentSerializer(serializers.ModelSerializer):
    wallet_detail = WalletSerializer(source="wallet", read_only=True)

    class Meta:
        model = DebtPayment
        fields = (
            "id",
            "debt",
            "wallet",
            "wallet_detail",
            "amount",
            "note",
            "paid_date",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        debt = attrs.get("debt")
        wallet = attrs.get("wallet")
        if debt is not None and debt.user_id != user.id:
            raise serializers.ValidationError({"debt": "Invalid debt."})
        if wallet is not None and wallet.user_id != user.id:
            raise serializers.ValidationError({"wallet": "Invalid wallet."})

        if debt is not None:
            if debt.affects_wallet:
                if wallet is None:
                    raise serializers.ValidationError(
                        {"wallet": "Please choose a wallet for this payment."}
                    )
            else:
                attrs["wallet"] = None

            already_paid = _sum(debt.payments.exclude(pk=getattr(self.instance, "pk", None)))
            amount = attrs.get("amount", Decimal("0"))
            if already_paid + amount > debt.principal:
                raise serializers.ValidationError(
                    {"amount": "Amount exceeds the remaining debt."}
                )
        return attrs


class DebtSerializer(serializers.ModelSerializer):
    counterparty_detail = CounterpartyBriefSerializer(
        source="counterparty", read_only=True
    )
    wallet_detail = WalletSerializer(source="wallet", read_only=True)
    paid = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    settled = serializers.SerializerMethodField()
    payments = DebtPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Debt
        fields = (
            "id",
            "direction",
            "counterparty",
            "counterparty_detail",
            "affects_wallet",
            "wallet",
            "wallet_detail",
            "principal",
            "note",
            "incurred_date",
            "paid",
            "remaining",
            "settled",
            "payments",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def _paid(self, obj):
        return _sum(obj.payments)

    def get_paid(self, obj):
        return money(self._paid(obj))

    def get_remaining(self, obj):
        return money(obj.principal - self._paid(obj))

    def get_settled(self, obj):
        return self._paid(obj) >= obj.principal

    def validate_principal(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def _resolved(self, attrs, field):
        if field in attrs:
            return attrs[field]
        if self.instance is not None:
            return getattr(self.instance, field)
        return None

    def validate(self, attrs):
        user = self.context["request"].user
        counterparty = attrs.get("counterparty")
        if counterparty is not None and counterparty.user_id != user.id:
            raise serializers.ValidationError({"counterparty": "Invalid counterparty."})

        affects_wallet = self._resolved(attrs, "affects_wallet")
        if affects_wallet is None:
            affects_wallet = True
            attrs["affects_wallet"] = True

        wallet = attrs.get("wallet")
        if self.instance is not None and "wallet" not in attrs:
            wallet = self.instance.wallet

        if affects_wallet:
            if wallet is None:
                raise serializers.ValidationError(
                    {"wallet": "Please choose a wallet when balance is affected."}
                )
            if wallet.user_id != user.id:
                raise serializers.ValidationError({"wallet": "Invalid wallet."})
        else:
            attrs["wallet"] = None

        return attrs


class CreditSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()
    available = serializers.SerializerMethodField()
    paid = serializers.SerializerMethodField()
    cycle_charges = serializers.SerializerMethodField()
    cycle_start = serializers.SerializerMethodField()
    cycle_end = serializers.SerializerMethodField()

    class Meta:
        model = Credit
        fields = (
            "id",
            "name",
            "color",
            "credit_limit",
            "statement_day",
            "balance",
            "available",
            "paid",
            "cycle_charges",
            "cycle_start",
            "cycle_end",
            "created_at",
        )
        read_only_fields = (
            "id",
            "balance",
            "available",
            "paid",
            "cycle_charges",
            "cycle_start",
            "cycle_end",
            "created_at",
        )

    def _charged(self, obj):
        return _sum(obj.charges)

    def _paid(self, obj):
        return _sum(obj.payments)

    def get_balance(self, obj):
        return money(self._charged(obj) - self._paid(obj))

    def get_paid(self, obj):
        return money(self._paid(obj))

    def get_available(self, obj):
        return money(obj.credit_limit - (self._charged(obj) - self._paid(obj)))

    def _cycle_bounds(self, obj):
        return billing_cycle_bounds(obj.statement_day)

    def get_cycle_charges(self, obj):
        start, end = self._cycle_bounds(obj)
        qs = obj.charges.filter(charged_date__gte=start, charged_date__lte=end)
        return money(_sum(qs))

    def get_cycle_start(self, obj):
        start, _ = self._cycle_bounds(obj)
        return start.isoformat()

    def get_cycle_end(self, obj):
        _, end = self._cycle_bounds(obj)
        return end.isoformat()

    def validate_statement_day(self, value):
        if value is None:
            return 1
        value = int(value)
        if value < 1 or value > 28:
            raise serializers.ValidationError(
                "Statement day must be between 1 and 28."
            )
        return value

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please enter a name.")
        user = self.context["request"].user
        qs = Credit.objects.filter(user=user, name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This credit card already exists.")
        return value

    def validate_credit_limit(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Credit limit must be greater than 0.")
        return value


class CreditChargeSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source="category", read_only=True)
    credit_detail = CreditSerializer(source="credit", read_only=True)

    class Meta:
        model = CreditCharge
        fields = (
            "id",
            "credit",
            "credit_detail",
            "category",
            "category_detail",
            "title",
            "amount",
            "note",
            "charged_date",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please enter a title.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        credit = attrs.get("credit")
        category = attrs.get("category")
        amount = attrs.get("amount", Decimal("0"))

        if credit is not None and credit.user_id != user.id:
            raise serializers.ValidationError({"credit": "Invalid credit card."})
        if category is not None and category.user_id != user.id:
            raise serializers.ValidationError({"category": "Invalid category."})

        if credit is not None and amount:
            charged = _sum(credit.charges.exclude(pk=getattr(self.instance, "pk", None)))
            paid = _sum(credit.payments)
            balance = charged - paid
            if balance + amount > credit.credit_limit:
                raise serializers.ValidationError(
                    {"amount": "This charge would exceed the credit limit."}
                )
        return attrs


class CreditPaymentSerializer(serializers.ModelSerializer):
    wallet_detail = WalletSerializer(source="wallet", read_only=True)
    credit_detail = CreditSerializer(source="credit", read_only=True)

    class Meta:
        model = CreditPayment
        fields = (
            "id",
            "credit",
            "credit_detail",
            "wallet",
            "wallet_detail",
            "amount",
            "note",
            "paid_date",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        credit = attrs.get("credit")
        wallet = attrs.get("wallet")
        amount = attrs.get("amount", Decimal("0"))

        if credit is not None and credit.user_id != user.id:
            raise serializers.ValidationError({"credit": "Invalid credit card."})
        if wallet is not None and wallet.user_id != user.id:
            raise serializers.ValidationError({"wallet": "Invalid wallet."})

        if credit is not None:
            charged = _sum(credit.charges)
            paid = _sum(credit.payments.exclude(pk=getattr(self.instance, "pk", None)))
            balance = charged - paid
            if amount > balance:
                raise serializers.ValidationError(
                    {"amount": "Amount exceeds the outstanding balance."}
                )
        return attrs


class CreditDetailSerializer(CreditSerializer):
    """Credit card with nested charges and payments (for the credit page)."""

    charges = CreditChargeSerializer(many=True, read_only=True)
    payments = CreditPaymentSerializer(many=True, read_only=True)

    class Meta(CreditSerializer.Meta):
        fields = CreditSerializer.Meta.fields + ("charges", "payments")
