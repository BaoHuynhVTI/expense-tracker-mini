"""Tests for the expenses app."""
import unittest

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

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
)


class HealthTests(APITestCase):
    def test_health_returns_ok_without_auth(self):
        url = reverse("health")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")


def make_user(email="alice@example.com"):
    return User.objects.create_user(username=email, email=email, password="supersecret")


class CategoryTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_create_category(self):
        url = reverse("category-list-create")
        response = self.client.post(
            url, {"name": "Food", "color": "#f59e0b"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.filter(user=self.user).count(), 1)

    def test_cannot_create_duplicate_category_name(self):
        Category.objects.create(user=self.user, name="Food")
        url = reverse("category-list-create")
        response = self.client.post(url, {"name": "food"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_categories_are_scoped_to_user(self):
        other = make_user("bob@example.com")
        Category.objects.create(user=other, name="Other-Food")
        Category.objects.create(user=self.user, name="My-Food")
        response = self.client.get(reverse("category-list-create"))
        names = [c["name"] for c in response.data]
        self.assertEqual(names, ["My-Food"])

    def test_cannot_delete_category_in_use(self):
        category = Category.objects.create(user=self.user, name="Food")
        wallet = Wallet.objects.create(user=self.user, name="Cash")
        Expense.objects.create(
            user=self.user,
            wallet=wallet,
            category=category,
            title="Lunch",
            amount="1000.00",
            spent_date="2026-06-01",
        )
        url = reverse("category-detail", args=[category.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Category.objects.filter(id=category.id).exists())


class WalletTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_create_wallet_with_initial_balance(self):
        url = reverse("wallet-list-create")
        response = self.client.post(
            url, {"name": "Cash", "initial_balance": "5000.00"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["balance"], "5000.00")
        self.assertEqual(response.data["spent"], "0.00")

    def test_wallet_balance_reflects_expenses(self):
        wallet = Wallet.objects.create(
            user=self.user, name="Cash", initial_balance="5000.00"
        )
        category = Category.objects.create(user=self.user, name="Food")
        Expense.objects.create(
            user=self.user,
            wallet=wallet,
            category=category,
            title="Lunch",
            amount="1200.00",
            spent_date="2026-06-01",
        )
        response = self.client.get(reverse("wallet-detail", args=[wallet.id]))
        self.assertEqual(response.data["spent"], "1200.00")
        self.assertEqual(response.data["balance"], "3800.00")

    def test_cannot_delete_wallet_in_use(self):
        wallet = Wallet.objects.create(user=self.user, name="Cash")
        category = Category.objects.create(user=self.user, name="Food")
        Expense.objects.create(
            user=self.user,
            wallet=wallet,
            category=category,
            title="Lunch",
            amount="1000.00",
            spent_date="2026-06-01",
        )
        response = self.client.delete(reverse("wallet-detail", args=[wallet.id]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Wallet.objects.filter(id=wallet.id).exists())


class WalletTransferTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.cash = Wallet.objects.create(
            user=self.user, name="Cash", initial_balance="5000.00"
        )
        self.bank = Wallet.objects.create(
            user=self.user, name="Bank", initial_balance="10000.00"
        )

    def test_transfer_updates_balances(self):
        url = reverse("wallet-transfer-list-create")
        response = self.client.post(
            url,
            {
                "from_wallet": self.cash.id,
                "to_wallet": self.bank.id,
                "amount": "1500.00",
                "transfer_date": "2026-06-01",
                "note": "Top up bank",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        cash = self.client.get(reverse("wallet-detail", args=[self.cash.id])).data
        bank = self.client.get(reverse("wallet-detail", args=[self.bank.id])).data
        self.assertEqual(cash["balance"], "3500.00")
        self.assertEqual(bank["balance"], "11500.00")

    def test_cannot_transfer_to_same_wallet(self):
        url = reverse("wallet-transfer-list-create")
        response = self.client.post(
            url,
            {
                "from_wallet": self.cash.id,
                "to_wallet": self.cash.id,
                "amount": "100.00",
                "transfer_date": "2026-06-01",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_transfer_more_than_source_balance(self):
        url = reverse("wallet-transfer-list-create")
        response = self.client.post(
            url,
            {
                "from_wallet": self.cash.id,
                "to_wallet": self.bank.id,
                "amount": "6000.00",
                "transfer_date": "2026-06-01",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ExpenseCreateTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(user=self.user, name="Food")
        self.wallet = Wallet.objects.create(
            user=self.user, name="Cash", initial_balance="5000.00"
        )

    def _payload(self, **overrides):
        payload = {
            "title": "Lunch",
            "amount": "1200.00",
            "category": self.category.id,
            "wallet": self.wallet.id,
            "spent_date": "2026-06-01",
            "note": "Ramen",
        }
        payload.update(overrides)
        return payload

    def test_authenticated_user_can_create_expense(self):
        url = reverse("expense-list-create")
        response = self.client.post(url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Expense.objects.count(), 1)
        expense = Expense.objects.first()
        self.assertEqual(expense.user, self.user)
        self.assertEqual(expense.category, self.category)
        self.assertEqual(expense.wallet, self.wallet)
        # The response includes nested detail for display.
        self.assertEqual(response.data["category_detail"]["name"], "Food")
        self.assertEqual(response.data["wallet_detail"]["name"], "Cash")

    def test_reject_amount_zero_or_negative(self):
        url = reverse("expense-list-create")
        for bad_amount in ("0.00", "-5.00"):
            response = self.client.post(
                url, self._payload(amount=bad_amount), format="json"
            )
            self.assertEqual(
                response.status_code, status.HTTP_400_BAD_REQUEST, bad_amount
            )
        self.assertEqual(Expense.objects.count(), 0)

    def test_create_requires_authentication(self):
        self.client.force_authenticate(user=None)
        url = reverse("expense-list-create")
        response = self.client.post(url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_use_another_users_category_or_wallet(self):
        other = make_user("bob@example.com")
        other_category = Category.objects.create(user=other, name="Bob-Food")
        other_wallet = Wallet.objects.create(user=other, name="Bob-Cash")
        url = reverse("expense-list-create")

        response = self.client.post(
            url, self._payload(category=other_category.id), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post(
            url, self._payload(wallet=other_wallet.id), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ExpenseScopingTests(APITestCase):
    def setUp(self):
        self.alice = make_user("alice@example.com")
        self.bob = make_user("bob@example.com")

        self.alice_category = Category.objects.create(user=self.alice, name="Food")
        self.alice_wallet = Wallet.objects.create(user=self.alice, name="Cash")
        self.bob_category = Category.objects.create(user=self.bob, name="Transport")
        self.bob_wallet = Wallet.objects.create(user=self.bob, name="Bank")

        Expense.objects.create(
            user=self.alice,
            wallet=self.alice_wallet,
            category=self.alice_category,
            title="Alice lunch",
            amount="1000.00",
            spent_date="2026-06-01",
        )
        self.bob_expense = Expense.objects.create(
            user=self.bob,
            wallet=self.bob_wallet,
            category=self.bob_category,
            title="Bob taxi",
            amount="3000.00",
            spent_date="2026-06-01",
        )

    def test_user_cannot_see_another_users_expenses(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get(reverse("expense-list-create"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.data]
        self.assertIn("Alice lunch", titles)
        self.assertNotIn("Bob taxi", titles)

    def test_user_cannot_delete_another_users_expense(self):
        self.client.force_authenticate(user=self.alice)
        url = reverse("expense-detail", args=[self.bob_expense.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Expense.objects.filter(id=self.bob_expense.id).exists())

    def test_summary_only_counts_current_user_expenses(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get(reverse("summary"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["expense_count"], 1)
        self.assertEqual(response.data["total_spent"], "1000.00")
        self.assertEqual(response.data["top_category"], "Food")
        self.assertIn("Food", response.data["totals_by_category"])
        self.assertNotIn("Transport", response.data["totals_by_category"])


class IncomeTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.source = IncomeSource.objects.create(user=self.user, name="Salary")
        self.wallet = Wallet.objects.create(
            user=self.user, name="Bank", initial_balance="1000.00"
        )

    def test_income_increases_wallet_balance(self):
        url = reverse("income-list-create")
        response = self.client.post(
            url,
            {
                "title": "March salary",
                "amount": "5000.00",
                "source": self.source.id,
                "wallet": self.wallet.id,
                "received_date": "2026-03-01",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        wallet = self.client.get(reverse("wallet-detail", args=[self.wallet.id])).data
        self.assertEqual(wallet["total_income"], "5000.00")
        self.assertEqual(wallet["balance"], "6000.00")

    def test_cannot_delete_income_source_in_use(self):
        Income.objects.create(
            user=self.user,
            wallet=self.wallet,
            source=self.source,
            title="Salary",
            amount="100.00",
            received_date="2026-03-01",
        )
        response = self.client.delete(
            reverse("income-source-detail", args=[self.source.id])
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


def make_counterparty(user, name="Friend"):
    return Counterparty.objects.create(user=user, name=name)


class CounterpartyTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.wallet = Wallet.objects.create(user=self.user, name="Cash")
        self.cp = make_counterparty(self.user, "Alice")

    def test_counterparty_totals(self):
        Debt.objects.create(
            user=self.user,
            counterparty=self.cp,
            wallet=self.wallet,
            direction=Debt.Direction.PAYABLE,
            principal="1000.00",
            incurred_date="2026-03-01",
        )
        Debt.objects.create(
            user=self.user,
            counterparty=self.cp,
            wallet=self.wallet,
            direction=Debt.Direction.RECEIVABLE,
            principal="400.00",
            incurred_date="2026-03-02",
        )
        response = self.client.get(reverse("counterparty-list-create"))
        row = next(item for item in response.data if item["id"] == self.cp.id)
        self.assertEqual(row["payable_remaining"], "1000.00")
        self.assertEqual(row["receivable_remaining"], "400.00")


class DebtTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.wallet = Wallet.objects.create(
            user=self.user, name="Cash", initial_balance="1000.00"
        )
        self.counterparty = make_counterparty(self.user, "Friend")

    def test_borrowing_increases_wallet_then_repayment_decreases(self):
        debt = Debt.objects.create(
            user=self.user,
            wallet=self.wallet,
            counterparty=self.counterparty,
            direction=Debt.Direction.PAYABLE,
            principal="2000.00",
            incurred_date="2026-03-01",
        )
        wallet = self.client.get(reverse("wallet-detail", args=[self.wallet.id])).data
        self.assertEqual(wallet["balance"], "3000.00")  # 1000 + 2000 borrowed

        # Repay 500 from the wallet.
        response = self.client.post(
            reverse("debt-payment-list-create"),
            {
                "debt": debt.id,
                "wallet": self.wallet.id,
                "amount": "500.00",
                "paid_date": "2026-03-10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        wallet = self.client.get(reverse("wallet-detail", args=[self.wallet.id])).data
        self.assertEqual(wallet["balance"], "2500.00")  # 3000 - 500 repaid

        debt_data = self.client.get(reverse("debt-detail", args=[debt.id])).data
        self.assertEqual(debt_data["remaining"], "1500.00")

    def test_lending_decreases_wallet(self):
        buddy = make_counterparty(self.user, "Buddy")
        Debt.objects.create(
            user=self.user,
            wallet=self.wallet,
            counterparty=buddy,
            direction=Debt.Direction.RECEIVABLE,
            principal="300.00",
            incurred_date="2026-03-01",
        )
        wallet = self.client.get(reverse("wallet-detail", args=[self.wallet.id])).data
        self.assertEqual(wallet["balance"], "700.00")  # 1000 - 300 lent

    def test_tracking_only_debt_does_not_change_wallet(self):
        response = self.client.post(
            reverse("debt-list-create"),
            {
                "direction": "payable",
                "counterparty": self.counterparty.id,
                "principal": "5000.00",
                "affects_wallet": False,
                "incurred_date": "2026-03-01",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        wallet = self.client.get(reverse("wallet-detail", args=[self.wallet.id])).data
        self.assertEqual(wallet["balance"], "1000.00")

    def test_payment_cannot_exceed_remaining(self):
        debt = Debt.objects.create(
            user=self.user,
            wallet=self.wallet,
            counterparty=self.counterparty,
            direction=Debt.Direction.PAYABLE,
            principal="100.00",
            incurred_date="2026-03-01",
        )
        response = self.client.post(
            reverse("debt-payment-list-create"),
            {
                "debt": debt.id,
                "wallet": self.wallet.id,
                "amount": "150.00",
                "paid_date": "2026-03-10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(DebtPayment.objects.count(), 0)


class CreditBillingTests(unittest.TestCase):
    def test_cycle_bounds_before_close_day(self):
        from datetime import date

        from expenses.credit_billing import billing_cycle_bounds

        start, end = billing_cycle_bounds(25, date(2026, 6, 2))
        self.assertEqual(start, date(2026, 5, 26))
        self.assertEqual(end, date(2026, 6, 25))

    def test_cycle_bounds_after_close_day(self):
        from datetime import date

        from expenses.credit_billing import billing_cycle_bounds

        start, end = billing_cycle_bounds(25, date(2026, 6, 28))
        self.assertEqual(start, date(2026, 6, 26))
        self.assertEqual(end, date(2026, 7, 25))


class CreditTests(APITestCase):
    def setUp(self):
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.wallet = Wallet.objects.create(
            user=self.user, name="Cash", initial_balance="10000.00"
        )
        self.category = Category.objects.create(user=self.user, name="Food")
        self.credit = Credit.objects.create(
            user=self.user, name="SMBC Card", credit_limit="500000.00"
        )

    def test_create_credit_card(self):
        response = self.client.post(
            reverse("credit-list-create"),
            {"name": "Rakuten", "credit_limit": "300000.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["balance"], "0.00")
        self.assertEqual(response.data["available"], "300000.00")

    def test_charge_increases_balance_owed(self):
        response = self.client.post(
            reverse("credit-charge-list-create"),
            {
                "credit": self.credit.id,
                "category": self.category.id,
                "title": "Groceries",
                "amount": "5000.00",
                "charged_date": "2026-06-01",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        credit = self.client.get(reverse("credit-detail", args=[self.credit.id])).data
        self.assertEqual(credit["balance"], "5000.00")
        self.assertEqual(credit["available"], "495000.00")

    def test_cycle_charges_only_include_current_billing_period(self):
        from unittest.mock import patch

        self.credit.statement_day = 25
        self.credit.save(update_fields=["statement_day"])
        CreditCharge.objects.create(
            user=self.user,
            credit=self.credit,
            category=self.category,
            title="Old cycle",
            amount="1000.00",
            charged_date="2026-05-20",
        )
        CreditCharge.objects.create(
            user=self.user,
            credit=self.credit,
            category=self.category,
            title="Current cycle",
            amount="3000.00",
            charged_date="2026-06-10",
        )
        with patch("expenses.serializers.billing_cycle_bounds") as bounds:
            from datetime import date

            bounds.return_value = (date(2026, 5, 26), date(2026, 6, 25))
            credit = self.client.get(reverse("credit-detail", args=[self.credit.id])).data
        self.assertEqual(credit["cycle_charges"], "3000.00")
        self.assertEqual(credit["cycle_start"], "2026-05-26")
        self.assertEqual(credit["cycle_end"], "2026-06-25")

    def test_payment_decreases_wallet_and_credit_balance(self):
        CreditCharge.objects.create(
            user=self.user,
            credit=self.credit,
            category=self.category,
            title="Groceries",
            amount="5000.00",
            charged_date="2026-06-01",
        )
        response = self.client.post(
            reverse("credit-payment-list-create"),
            {
                "credit": self.credit.id,
                "wallet": self.wallet.id,
                "amount": "2000.00",
                "paid_date": "2026-06-15",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        wallet = self.client.get(reverse("wallet-detail", args=[self.wallet.id])).data
        self.assertEqual(wallet["balance"], "8000.00")
        credit = self.client.get(reverse("credit-detail", args=[self.credit.id])).data
        self.assertEqual(credit["balance"], "3000.00")

    def test_charge_cannot_exceed_credit_limit(self):
        CreditCharge.objects.create(
            user=self.user,
            credit=self.credit,
            category=self.category,
            title="Big buy",
            amount="499000.00",
            charged_date="2026-06-01",
        )
        response = self.client.post(
            reverse("credit-charge-list-create"),
            {
                "credit": self.credit.id,
                "category": self.category.id,
                "title": "Extra",
                "amount": "2000.00",
                "charged_date": "2026-06-02",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(CreditCharge.objects.count(), 1)

    def test_summary_spending_includes_charges_not_payments(self):
        from datetime import date

        today = date.today().isoformat()
        Expense.objects.create(
            user=self.user,
            wallet=self.wallet,
            category=self.category,
            title="Cash lunch",
            amount="1000.00",
            spent_date=today,
        )
        CreditCharge.objects.create(
            user=self.user,
            credit=self.credit,
            category=self.category,
            title="Groceries",
            amount="5000.00",
            charged_date=today,
        )
        CreditPayment.objects.create(
            user=self.user,
            credit=self.credit,
            wallet=self.wallet,
            amount="2000.00",
            paid_date=today,
        )
        response = self.client.get(reverse("summary"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["spent_wallet"], "1000.00")
        self.assertEqual(response.data["spent_on_card"], "5000.00")
        self.assertEqual(response.data["total_spent"], "6000.00")
        self.assertEqual(response.data["charge_count"], 1)

    def test_monthly_stats_include_card_charges(self):
        from datetime import date

        today = date.today()
        month_key = f"{today.year:04d}-{today.month:02d}"
        CreditCharge.objects.create(
            user=self.user,
            credit=self.credit,
            category=self.category,
            title="Groceries",
            amount="3000.00",
            charged_date=today,
        )
        response = self.client.get(reverse("stats-monthly"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = next(item for item in response.data if item["month"] == month_key)
        self.assertEqual(row["expense"], "3000.00")
