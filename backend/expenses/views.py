"""Expense views: lookups, expenses, income, debts, summary, stats, health."""
from collections import defaultdict
from datetime import date
from decimal import Decimal

from django.db.models import ProtectedError, Sum
from django.db.models.functions import TruncMonth
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Category,
    Credit,
    CreditCharge,
    CreditPayment,
    Debt,
    DebtPayment,
    Expense,
    Income,
    IncomeSource,
    Wallet,
)
from .serializers import (
    CategorySerializer,
    CreditChargeSerializer,
    CreditDetailSerializer,
    CreditPaymentSerializer,
    CreditSerializer,
    DebtPaymentSerializer,
    DebtSerializer,
    ExpenseSerializer,
    IncomeSerializer,
    IncomeSourceSerializer,
    WalletSerializer,
)
from .utils import money


class OwnedListCreateView(generics.ListCreateAPIView):
    """List/create objects scoped to the current user."""

    model = None

    def get_queryset(self):
        return self.model.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class OwnedDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve/update/delete an owned object, blocking protected deletes."""

    model = None

    def get_queryset(self):
        return self.model.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(
                "Cannot delete because this item is still used by other records."
            )


class CategoryListCreateView(OwnedListCreateView):
    model = Category
    serializer_class = CategorySerializer


class CategoryDetailView(OwnedDetailView):
    model = Category
    serializer_class = CategorySerializer


class IncomeSourceListCreateView(OwnedListCreateView):
    model = IncomeSource
    serializer_class = IncomeSourceSerializer


class IncomeSourceDetailView(OwnedDetailView):
    model = IncomeSource
    serializer_class = IncomeSourceSerializer


class WalletListCreateView(OwnedListCreateView):
    model = Wallet
    serializer_class = WalletSerializer


class WalletDetailView(OwnedDetailView):
    model = Wallet
    serializer_class = WalletSerializer


class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user).select_related(
            "category", "wallet"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user)


class IncomeListCreateView(generics.ListCreateAPIView):
    serializer_class = IncomeSerializer

    def get_queryset(self):
        return Income.objects.filter(user=self.request.user).select_related(
            "source", "wallet"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class IncomeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = IncomeSerializer

    def get_queryset(self):
        return Income.objects.filter(user=self.request.user)


class DebtListCreateView(generics.ListCreateAPIView):
    serializer_class = DebtSerializer

    def get_queryset(self):
        return Debt.objects.filter(user=self.request.user).select_related("wallet")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DebtDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DebtSerializer

    def get_queryset(self):
        return Debt.objects.filter(user=self.request.user)


class DebtPaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = DebtPaymentSerializer

    def get_queryset(self):
        qs = DebtPayment.objects.filter(user=self.request.user).select_related("wallet")
        debt_id = self.request.query_params.get("debt")
        if debt_id:
            qs = qs.filter(debt_id=debt_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DebtPaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DebtPaymentSerializer

    def get_queryset(self):
        return DebtPayment.objects.filter(user=self.request.user)


class CreditListCreateView(OwnedListCreateView):
    model = Credit
    serializer_class = CreditSerializer


class CreditDetailView(OwnedDetailView):
    model = Credit
    serializer_class = CreditSerializer


class CreditWithActivityListView(generics.ListAPIView):
    """List credit cards with nested charges and payments."""

    serializer_class = CreditDetailSerializer

    def get_queryset(self):
        return (
            Credit.objects.filter(user=self.request.user)
            .prefetch_related("charges__category", "payments__wallet")
        )


class CreditChargeListCreateView(generics.ListCreateAPIView):
    serializer_class = CreditChargeSerializer

    def get_queryset(self):
        qs = CreditCharge.objects.filter(user=self.request.user).select_related(
            "credit", "category"
        )
        credit_id = self.request.query_params.get("credit")
        if credit_id:
            qs = qs.filter(credit_id=credit_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CreditChargeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CreditChargeSerializer

    def get_queryset(self):
        return CreditCharge.objects.filter(user=self.request.user)


class CreditPaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = CreditPaymentSerializer

    def get_queryset(self):
        qs = CreditPayment.objects.filter(user=self.request.user).select_related(
            "credit", "wallet"
        )
        credit_id = self.request.query_params.get("credit")
        if credit_id:
            qs = qs.filter(credit_id=credit_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CreditPaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CreditPaymentSerializer

    def get_queryset(self):
        return CreditPayment.objects.filter(user=self.request.user)


class SummaryView(APIView):
    """GET /api/summary/ — income vs spending for the current user.

    Spending = wallet expenses + credit card charges. Paying a card bill
    is a transfer (wallet down, card balance down) and is not extra spending.
    """

    def get(self, request):
        user = request.user
        expenses = Expense.objects.filter(user=user)
        charges = CreditCharge.objects.filter(user=user)
        incomes = Income.objects.filter(user=user)

        spent_wallet = expenses.aggregate(t=Sum("amount"))["t"] or Decimal("0")
        spent_on_card = charges.aggregate(t=Sum("amount"))["t"] or Decimal("0")
        total_spent = spent_wallet + spent_on_card
        total_income = incomes.aggregate(t=Sum("amount"))["t"] or Decimal("0")

        totals_by_category = self._totals_by_category(user)
        top_category = (
            max(totals_by_category, key=totals_by_category.get)
            if totals_by_category
            else None
        )

        payable_remaining = self._remaining(user, Debt.Direction.PAYABLE)
        receivable_remaining = self._remaining(user, Debt.Direction.RECEIVABLE)
        credit_owed = self._credit_owed(user)

        return Response(
            {
                "total_spent": money(total_spent),
                "spent_wallet": money(spent_wallet),
                "spent_on_card": money(spent_on_card),
                "total_income": money(total_income),
                "net": money(total_income - total_spent),
                "expense_count": expenses.count(),
                "charge_count": charges.count(),
                "income_count": incomes.count(),
                "totals_by_category": {
                    name: money(total) for name, total in totals_by_category.items()
                },
                "top_category": top_category,
                "debt_payable_remaining": money(payable_remaining),
                "debt_receivable_remaining": money(receivable_remaining),
                "credit_owed": money(credit_owed),
            }
        )

    @staticmethod
    def _totals_by_category(user):
        totals = defaultdict(lambda: Decimal("0"))
        for row in (
            Expense.objects.filter(user=user)
            .values("category__name")
            .annotate(total=Sum("amount"))
        ):
            name = row["category__name"]
            if name:
                totals[name] += row["total"] or Decimal("0")
        for row in (
            CreditCharge.objects.filter(user=user)
            .values("category__name")
            .annotate(total=Sum("amount"))
        ):
            name = row["category__name"]
            if name:
                totals[name] += row["total"] or Decimal("0")
        return dict(sorted(totals.items(), key=lambda item: item[1], reverse=True))

    @staticmethod
    def _remaining(user, direction):
        debts = Debt.objects.filter(user=user, direction=direction)
        principal = debts.aggregate(t=Sum("principal"))["t"] or Decimal("0")
        paid = DebtPayment.objects.filter(
            user=user, debt__direction=direction
        ).aggregate(t=Sum("amount"))["t"] or Decimal("0")
        return principal - paid

    @staticmethod
    def _credit_owed(user):
        charged = CreditCharge.objects.filter(user=user).aggregate(t=Sum("amount"))[
            "t"
        ] or Decimal("0")
        paid = CreditPayment.objects.filter(user=user).aggregate(t=Sum("amount"))[
            "t"
        ] or Decimal("0")
        return charged - paid


class MonthlyStatsView(APIView):
    """GET /api/stats/monthly/ — income vs spending for the last N months.

    Monthly spending = wallet expenses + credit card charges (by month).
    """

    def get(self, request):
        user = request.user
        months = self._recent_months(6)

        wallet_map = self._by_month(
            Expense.objects.filter(user=user), "spent_date"
        )
        card_map = self._by_month(
            CreditCharge.objects.filter(user=user), "charged_date"
        )
        income_map = self._by_month(
            Income.objects.filter(user=user), "received_date"
        )

        data = [
            {
                "month": key,
                "income": money(income_map.get(key, Decimal("0"))),
                "expense": money(
                    wallet_map.get(key, Decimal("0"))
                    + card_map.get(key, Decimal("0"))
                ),
            }
            for key in months
        ]
        return Response(data)

    @staticmethod
    def _recent_months(count):
        today = date.today()
        result = []
        year, month = today.year, today.month
        for _ in range(count):
            result.append(f"{year:04d}-{month:02d}")
            month -= 1
            if month == 0:
                month = 12
                year -= 1
        return list(reversed(result))

    @staticmethod
    def _by_month(queryset, date_field):
        rows = (
            queryset.annotate(m=TruncMonth(date_field))
            .values("m")
            .annotate(total=Sum("amount"))
        )
        return {row["m"].strftime("%Y-%m"): row["total"] for row in rows if row["m"]}


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)
