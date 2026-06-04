from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("expenses", "0006_counterparty"),
    ]

    operations = [
        migrations.AddField(
            model_name="credit",
            name="statement_day",
            field=models.PositiveSmallIntegerField(default=1),
        ),
    ]
