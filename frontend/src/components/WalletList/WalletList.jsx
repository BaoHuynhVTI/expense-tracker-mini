import { formatJPY } from "../../utils/format.js";
import "./WalletList.scss";

export default function WalletList({ wallets = [] }) {
  if (!wallets.length) {
    return <p className="muted">No wallets yet. Create one in Settings.</p>;
  }

  return (
    <div className="wallet-list">
      {wallets.map((wallet) => {
        const negative = Number(wallet.balance) < 0;
        return (
          <div key={wallet.id} className="wallet-card">
            <span
              className="wallet-card__dot"
              style={{ background: wallet.color }}
              aria-hidden="true"
            />
            <div className="wallet-card__body">
              <span className="wallet-card__name">{wallet.name}</span>
              <span
                className={`wallet-card__balance${
                  negative ? " wallet-card__balance--negative" : ""
                }`}
              >
                {formatJPY(wallet.balance)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
