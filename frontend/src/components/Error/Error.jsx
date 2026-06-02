// Catch-all / fallback page for unmatched routes.
import { Link } from "react-router-dom";

import "./Error.scss";

export default function Error() {
  return (
    <div className="error-page">
      <div className="error-page__code">404</div>
      <p className="error-page__message">Page not found.</p>
      <Link to="/" className="btn btn--primary">
        Back to dashboard
      </Link>
    </div>
  );
}
