from django.contrib import admin

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


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "user", "created_at")
    search_fields = ("name", "user__email")


@admin.register(IncomeSource)
class IncomeSourceAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "user", "created_at")
    search_fields = ("name", "user__email")


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("name", "initial_balance", "color", "user", "created_at")
    search_fields = ("name", "user__email")


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "amount",
        "category",
        "wallet",
        "spent_date",
        "user",
        "created_at",
    )
    list_filter = ("category", "wallet", "spent_date")
    search_fields = ("title", "note", "user__email")


@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "amount",
        "source",
        "wallet",
        "received_date",
        "user",
        "created_at",
    )
    list_filter = ("source", "wallet", "received_date")
    search_fields = ("title", "note", "user__email")


class DebtPaymentInline(admin.TabularInline):
    model = DebtPayment
    extra = 0


@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = (
        "counterparty",
        "direction",
        "principal",
        "wallet",
        "incurred_date",
        "user",
    )
    list_filter = ("direction", "wallet", "incurred_date")
    search_fields = ("counterparty", "note", "user__email")
    inlines = [DebtPaymentInline]


@admin.register(DebtPayment)
class DebtPaymentAdmin(admin.ModelAdmin):
    list_display = ("debt", "amount", "wallet", "paid_date", "user", "created_at")
    list_filter = ("wallet", "paid_date")


@admin.register(Credit)
class CreditAdmin(admin.ModelAdmin):
    list_display = ("name", "credit_limit", "color", "user", "created_at")
    search_fields = ("name", "user__email")


@admin.register(CreditCharge)
class CreditChargeAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "amount",
        "credit",
        "category",
        "charged_date",
        "user",
        "created_at",
    )
    list_filter = ("credit", "category", "charged_date")
    search_fields = ("title", "note", "user__email")


@admin.register(CreditPayment)
class CreditPaymentAdmin(admin.ModelAdmin):
    list_display = ("credit", "amount", "wallet", "paid_date", "user", "created_at")
    list_filter = ("credit", "wallet", "paid_date")
