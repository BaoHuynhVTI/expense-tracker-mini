import CreditCardList from "../../components/CreditCardList/CreditCardList.jsx";
import Loading from "../../components/Loading/Loading.jsx";
import MonthlyChart from "../../components/MonthlyChart/MonthlyChart.jsx";
import SummaryCards from "../../components/SummaryCards/SummaryCards.jsx";
import WalletList from "../../components/WalletList/WalletList.jsx";
import { useMinLoading } from "../../utils/useMinLoading.js";
import { useDashboardData } from "./useDashboard.js";
import "./Dashboard.scss";

export default function Dashboard() {
  const { summary, wallets, credits, monthly, loading, error } = useDashboardData();
  const showLoading = useMinLoading(loading);

  if (showLoading) {
    return <Loading fill label="Loading dashboard..." />;
  }

  return (
    <div className="dashboard">
      {error && <div className="alert alert--error">{error}</div>}

      <SummaryCards summary={summary} />

      <section className="panel">
        <h2 className="panel__title">Income vs. spending (last 6 months)</h2>
        <MonthlyChart data={monthly} />
      </section>

      <section className="panel">
        <h2 className="panel__title">Wallets</h2>
        <WalletList wallets={wallets} />
      </section>

      <section className="panel">
        <h2 className="panel__title">Credit cards</h2>
        <CreditCardList credits={credits} />
      </section>
    </div>
  );
}
