import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // ✅ Validation
    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    if (!accepted) {
      alert("Please accept terms & conditions");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    // ✅ Insert profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          name: name
        }
      ]);

    if (profileError) {
      console.log("Profile Error:", profileError);
    }

    setLoading(false);

    alert("Signup successful!");
    navigate("/login");
  };



  // const handleSignup = async () => {
  //   const { data, error } = await supabase.auth.signUp({
  //     email,
  //     password
  //   });

  //   if (error) {
  //     alert(error.message);
  //   } else {
  //     const user = data.user;

  //     // Insert into profiles
  //     await supabase.from("profiles").insert([
  //       {
  //         id: user.id,
  //         name: name
  //       }
  //     ]);
  //     alert("Signup successful!");
  //     navigate("/login");
  //   }
  // };

  return (
    <div className="login-container">

      {/* LEFT SIDE */}
      <div className="login-left">
        <div className="login-box">
          <h2>CharityRewards</h2>

          <h1>Join the Impact</h1>
          <p>Create your account to start earning rewards</p>

          {/* FULL NAME */}
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* EMAIL */}
          <label>Email address</label>
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PASSWORD */}
          <label>Password</label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="terms">
            <input
              type="checkbox"
              checked={accepted}
              onChange={() => setAccepted(!accepted)}
            />
            <p>
              I agree to the{" "}
              <span>Terms & Conditions</span>
            </p>
          </div>

          {/* BUTTON */}
          <button onClick={handleSignup} disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up →"}
          </button>

          {/* LOGIN LINK */}
          <p className="signup-text">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>
              Login
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">

        <div className="glass-card">

          <span className="badge">Top Rated Philanthropy Platform</span>

          <h1>Your kindness, rewarded.</h1>

          <p>
            Join over 50,000 members who are making a real difference.
            We bridge the gap between institutional giving and everyday impact.
          </p>

          {/* STATS */}
          <div className="stats">
            <div>
              <h3>$12.4M</h3>
              <p>Total Impact Value</p>
            </div>

            <div>
              <h3>850+</h3>
              <p>Global Charities</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );

  // return (
  //   <div>
  //     <h2>Signup</h2>
  //     <input
  //       placeholder="Email"
  //       onChange={(e) => setEmail(e.target.value)}
  //     />
  //     <input
  //       type="password"
  //       placeholder="Password"
  //       onChange={(e) => setPassword(e.target.value)}
  //     />
  //     <button onClick={handleSignup}>Signup</button>
  //   </div>
  // );
}

export default Signup;