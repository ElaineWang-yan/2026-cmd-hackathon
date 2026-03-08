import { useRef } from "react";

function Navbar() {
  const searchRef = useRef(null);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchRef.current.value.trim()) {
      window.location.href = '/feed?medicine=' + encodeURIComponent(searchRef.current.value.trim());
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      padding: "12px 40px",
      borderBottom: "1px solid #ddd",
      background: "white",
      gap: "20px",
      position: "sticky",
      top: 0,
      zIndex: 10
    }}>

      <div
        style={{ fontWeight: "bold", fontSize: "20px", cursor: "pointer" }}
        onClick={() => window.location.href = '/home'}
      >
        MedExperience
      </div>

      <button
        style={{
          padding: "8px 16px",
          borderRadius: "20px",
          border: "1px solid #ccc",
          background: "#f5f5f5",
          cursor: "pointer"
        }}
        onClick={() => window.location.href = '/create-post'}
      >
        New Post
      </button>

      <input
        ref={searchRef}
        type="text"
        placeholder="Search drugs, side effects..."
        onKeyDown={handleSearch}
        style={{
          flex: 1,
          padding: "10px 20px",
          borderRadius: "25px",
          border: "1px solid #ccc",
          outline: "none"
        }}
      />

      <div
        style={{ cursor: "pointer" }}
        onClick={() => window.location.href = '/login'}
      >
        Login
      </div>

    </div>
  );
}

export default Navbar;