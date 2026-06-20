import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <h2>InterviewReady</h2>

      <div>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
}

export default Navbar;