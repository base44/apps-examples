import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <span className="brand-mark">BE</span>
              <span>
                Base44&nbsp;<em>Estates</em>
              </span>
            </div>
            <p className="footer-note" style={{ maxWidth: 340 }}>
              A boutique agency pairing local expertise with a modern,
              server-rendered search experience. Homes across San Francisco, Los
              Angeles, New York, Miami, and Austin.
            </p>
          </div>

          <div>
            <h4>Explore</h4>
            <Link to="/listings">All listings</Link>
            <Link to="/listings?status=for_sale">For sale</Link>
            <Link to="/favorites">Saved homes</Link>
            <Link to="/agent">Agent dashboard</Link>
          </div>

          <div>
            <h4>Company</h4>
            <a href="mailto:hello@base44estates.com">hello@base44estates.com</a>
            <a href="tel:+18005550142">+1 (800) 555-0142</a>
            <a
              href="https://base44.com"
              target="_blank"
              rel="noreferrer"
            >
              Built on Base44
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Base44 Estates. Demo application.</span>
          <span>Server-rendered with React Router 7 on Base44 hosting.</span>
        </div>
      </div>
    </footer>
  );
}
