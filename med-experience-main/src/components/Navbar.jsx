function Navbar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 40px",
        borderBottom: "1px solid #ddd",
        background: "white",
        gap: "20px"
      }}
    >

      {/* Logo */}
      <div style={{fontWeight:"bold", fontSize:"20px"}}>
        MedExperience
      </div>


      {/* New Post button */}
      <button
        style={{
          padding:"8px 16px",
          borderRadius:"20px",
          border:"1px solid #ccc",
          background:"#f5f5f5",
          cursor:"pointer"
        }}
        onClick={() => window.location.href = '/create-post'}
      >
        New Post
      </button>


      {/* Search bar */}
      <input
        type="text"
        placeholder="Search drugs, side effects..."
        style={{
          flex:1,
          padding:"10px 20px",
          borderRadius:"25px",
          border:"1px solid #ccc",
          outline:"none"
        }}
      />


      {/* Login */}
      <div
        style={{ cursor: "pointer" }}
        onClick={() => window.location.href = '/login'}
      >
        Login
      </div>

    </div>
  )
}

export default Navbar