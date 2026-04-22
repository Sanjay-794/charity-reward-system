import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    // 🔥 get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // 🔥 role-based redirect
    if (profile.is_admin) {
      window.location.href = "/admin";
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="login-container">

      {/* LEFT SIDE */}
      <div className="login-left">

        <div className="login-box">
          <h2>CharityRewards</h2>

          <h1>Welcome back</h1>
          <p>Log in to your account to continue</p>

          {/* EMAIL */}
          <label>Email address</label>
          <input
            type="email"
            placeholder="name@company.com"
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PASSWORD */}
          <label>Password</label>
          <input
            type="password"
            placeholder="********"
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* LOGIN BUTTON */}
          <button onClick={handleLogin}>
            Login →
          </button>

          {/* SIGNUP LINK */}
          <p className="signup-text">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/signup")}>
              Sign up
            </span>
          </p>

        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">

        <div className="right-content">

          <h1>Every transaction transforms a life.</h1>

          <p>
            Join thousands of donors turning everyday rewards
            into meaningful change for communities worldwide.
          </p>

          {/* STATS */}
          <div className="stats">
            <div>
              <h3>$12M+</h3>
              <p>Raised This Year</p>
            </div>

            <div>
              <h3>850+</h3>
              <p>Charity Partners</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );

  // return (
  //   <div>
  //     <h2>Login</h2>
  //     <input
  //       placeholder="Email"
  //       onChange={(e) => setEmail(e.target.value)}
  //     />
  //     <input
  //       type="password"
  //       placeholder="Password"
  //       onChange={(e) => setPassword(e.target.value)}
  //     />
  //     <button onClick={handleLogin}>Login</button>
  //   </div>
  // );
}

export default Login;