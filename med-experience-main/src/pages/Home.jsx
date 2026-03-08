import { useState, useRef, useEffect } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=Nunito:wght@300;400;500;600&display=swap');

  :root {
    --bg: #f7f6f2;
    --surface: #ffffff;
    --ink: #1a1a18;
    --ink-muted: #7a7a72;
    --ink-faint: #b8b8b0;
    --accent: #2a6b52;
    --accent-hover: #205540;
    --border: #e4e3de;
    --shadow-sm: 0 1px 4px rgba(26,26,24,0.06), 0 4px 16px rgba(26,26,24,0.06);
    --shadow-md: 0 4px 16px rgba(26,26,24,0.1), 0 12px 32px rgba(26,26,24,0.08);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Nunito', sans-serif;
    background: var(--bg);
    min-height: 100vh;
  }

  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image: radial-gradient(circle, #c8c7c0 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: 0.45;
    pointer-events: none;
    z-index: 0;
  }

  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    height: 60px;
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 28px;
    gap: 16px;
  }

  .nav-logo {
    display: flex;
    align-items: baseline;
    gap: 1px;
    text-decoration: none;
    flex-shrink: 0;
    margin-right: 8px;
  }
  .logo-med {
    font-family: 'Lora', serif;
    font-weight: 600;
    font-size: 20px;
    color: var(--ink);
    letter-spacing: -0.01em;
  }
  .logo-ex {
    font-family: 'Lora', serif;
    font-weight: 500;
    font-size: 20px;
    color: var(--accent);
    letter-spacing: -0.01em;
  }
  .logo-dot {
    width: 4px; height: 4px;
    background: var(--accent);
    border-radius: 50%;
    margin-left: 2px;
    margin-bottom: 2px;
    flex-shrink: 0;
  }

  .nav-search {
    flex: 1;
    max-width: 440px;
    position: relative;
  }
  .nav-search svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--ink-faint);
    pointer-events: none;
  }
  .nav-search input {
    width: 100%;
    padding: 8px 14px 8px 36px;
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    color: var(--ink);
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  }
  .nav-search input::placeholder { color: var(--ink-faint); }
  .nav-search input:focus {
    outline: none;
    border-color: var(--accent);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(42,107,82,0.1);
  }

  .nav-spacer { flex: 1; }

  .btn-new-post {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
    box-shadow: 0 2px 8px rgba(42,107,82,0.2);
  }
  .btn-new-post:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(42,107,82,0.28);
  }
  .btn-new-post:active { transform: translateY(0); }

  .nav-profile {
    position: relative;
    flex-shrink: 0;
  }
  .profile-avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: var(--accent);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 600;
    transition: box-shadow 0.18s, transform 0.12s;
  }
  .profile-avatar:hover {
    box-shadow: 0 0 0 3px rgba(42,107,82,0.18);
    transform: scale(1.05);
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-md);
    min-width: 180px;
    overflow: hidden;
    animation: dropIn 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .dropdown-email {
    padding: 12px 16px 10px;
    font-size: 12px;
    color: var(--ink-faint);
    border-bottom: 1px solid var(--border);
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    font-size: 14px;
    font-family: 'Nunito', sans-serif;
    color: var(--ink);
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background 0.12s;
    font-weight: 400;
  }
  .dropdown-item:hover { background: var(--bg); }
  .dropdown-item.danger { color: #c0392b; }
  .dropdown-item.danger:hover { background: #fdf2f2; }
  .dropdown-divider { height: 1px; background: var(--border); }

  .page-content {
    position: relative;
    z-index: 1;
    padding-top: 80px;
    max-width: 720px;
    margin: 0 auto;
    padding-left: 24px;
    padding-right: 24px;
  }
  .placeholder {
    margin-top: 60px;
    text-align: center;
    color: var(--ink-faint);
  }
  .placeholder-icon {
    font-size: 40px;
    margin-bottom: 16px;
    opacity: 0.4;
  }
  .placeholder h2 {
    font-family: 'Lora', serif;
    font-size: 20px;
    font-weight: 500;
    color: var(--ink-muted);
    margin-bottom: 8px;
  }
  .placeholder p {
    font-size: 14px;
    font-weight: 300;
    line-height: 1.6;
  }
`;

export default function Home() {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    window.location.href = "/";
  }

  return (
    <>
      <style>{styles}</style>

      <nav className="navbar">
        <a href="/" className="nav-logo">
          <span className="logo-med">Med</span>
          <span className="logo-ex">Ex</span>
          <div className="logo-dot" />
        </a>

        <div className="nav-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search posts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="nav-spacer" />

        <button className="btn-new-post" onClick={() => alert("New post — coming soon!")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New post
        </button>

        <div className="nav-profile" ref={dropdownRef}>
          <button
            className="profile-avatar"
            onClick={() => setDropdownOpen(o => !o)}
            aria-label="Profile menu"
          >
            U
          </button>

          {dropdownOpen && (
            <div className="dropdown">
              <div className="dropdown-email">user@example.com</div>
              <button className="dropdown-item" onClick={() => alert("Profile — coming soon!")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                My profile
              </button>
              <button className="dropdown-item" onClick={() => alert("Settings — coming soon!")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Settings
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="page-content">
        <div className="placeholder">
          <div className="placeholder-icon">📋</div>
          <h2>No posts yet</h2>
          <p>Be the first to share a medical experience.</p>
        </div>
      </main>
    </>
  );
}