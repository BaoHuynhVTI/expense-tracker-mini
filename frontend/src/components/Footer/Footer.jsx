import "./Footer.scss";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span>Expense Tracker Mini</span>
        <span>&copy; {year}</span>
      </div>
    </footer>
  );
}
