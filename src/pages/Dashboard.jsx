import { useEffect, useState } from "react";
import "./Dashboard.css";
import { supabase } from "../services/supabase";

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [charities, setCharities] = useState([]);
  const [selectedCharity, setSelectedCharity] = useState("");

  const [plan, setPlan] = useState("monthly");

  const [scoreValue, setScoreValue] = useState("");
  const [scoreDate, setScoreDate] = useState("");
  const [scores, setScores] = useState([]);

  const [winners, setWinners] = useState([]);

  const [draw, setDraw] = useState(null);

  const [charityPercent, setCharityPercent] = useState(10);

  useEffect(() => {
    const init = async () => {
      // Get logged-in user
      const { data: userData } = await supabase.auth.getUser();

      // 🔥 NOT LOGGED IN
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }
      const uid = userData.user.id;
      setUserId(uid);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();

      setProfile(profileData);

      // Fetch charities
      const { data: charityData } = await supabase
        .from("charities")
        .select("*");



      console.log("CHARITIES:", charityData);

      setCharities(charityData);

      // fetch scores
      const { data: scoreData } = await supabase
        .from("scores")
        .select("*")
        .eq("user_id", uid)
        .order("date", { ascending: false });

      setScores(scoreData);

      const fetchLatestDraw = async () => {
        const { data } = await supabase
          .from("draws")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        setDraw(data[0]);
      };

      fetchLatestDraw();

      fetchWinners();
    };

    init();
  }, []);

  // ✅ STEP 6: Subscribe
  const handleSubscribe = async () => {
    if (!userId) {
      alert("User not loaded yet");
      return;
    }

    let renewalDate;

    if (plan === "monthly") {
      renewalDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
    } else {
      renewalDate = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        is_subscribed: true,
        subscription_type: plan,
        renewal_date: renewalDate
      })
      .eq("id", userId);

    if (error) {
      console.log(error);
      alert("Subscription failed");
      return;
    }

    alert(`Subscribed to ${plan} plan!`);

    // refresh profile
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(data);
  };

  // ✅ STEP 7: Select Charity
  const handleSelectCharity = async () => {
    if (!selectedCharity) {
      alert("Please select a charity");
      return;
    }

    if (charityPercent < 10) {
      alert("Minimum contribution is 10%");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        charity_id: selectedCharity,
        charity_percent: charityPercent
      })
      .eq("id", userId);

    if (error) {
      console.log(error);
      alert("Failed to save");
      return;
    }

    alert("Charity and contribution saved!");

    // refresh profile
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(data);
  };

  // handle add score

  const handleAddScore = async () => {
    if (!scoreValue || !scoreDate) {
      alert("Enter score and date");
      return;
    }

    if (scoreValue < 1 || scoreValue > 45) {
      alert("Score must be between 1 and 45");
      return;
    }

    // Check duplicate date
    const { data: existing } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .eq("date", scoreDate);

    if (existing.length > 0) {
      alert("Score for this date already exists");
      return;
    }

    // Get current scores
    const { data: currentScores } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    // If already 5 scores → delete oldest
    if (currentScores.length >= 5) {
      const oldest = currentScores[0];

      await supabase
        .from("scores")
        .delete()
        .eq("id", oldest.id);
    }

    // Insert new score
    await supabase
      .from("scores")
      .insert([
        {
          user_id: userId,
          score: scoreValue,
          date: scoreDate
        }
      ]);

    alert("Score added!");

    // Refresh scores
    const { data: updatedScores } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    setScores(updatedScores);
  };

  const fetchWinners = async () => {
    const { data } = await supabase
      .from("winners")
      .select("*");

    setWinners(data);
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  if (!profile) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  const handleUploadProof = async (file, winnerId) => {
    if (!file) {
      alert("Select file first");
      return;
    }

    const fileName = `${userId}-${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("proofs")
      .upload(fileName, file);

    console.log("UPLOAD DATA:", data);
    console.log("UPLOAD ERROR:", error);

    if (error) {
      alert("Upload failed");
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("proofs")
      .getPublicUrl(fileName);

    await supabase
      .from("winners")
      .update({ proof_url: publicUrl.publicUrl })
      .eq("id", winnerId);

    alert("Proof uploaded!");
  };

  const selectedCharityObj = charities.find(
    (c) => c.id === profile?.charity_id
  );

  const userScores = scores.map(s => Number(s.score));

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="header">
        <h2>Charity Reward System</h2>

        <div>
          <a href="/dashboard">Dashboard</a> |{" "}
          {profile?.is_admin && <a href="/admin">Admin</a>}
        </div>

        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* TOP 3 CARDS */}
      <div className="top-cards">

        <div className="card">
          <h3>Subscription</h3>
          <p>
            Status:{" "}
            {profile?.is_subscribed ? "Active ✅" : "Inactive ❌"}
          </p>

          {profile?.is_subscribed && (
            <>
              <p>Plan: {profile.subscription_type}</p>
              <p>
                Renewal:{" "}
                {new Date(profile.renewal_date).toLocaleDateString()}
              </p>
            </>
          )}

          <hr />

          <h4>Change Plan</h4>

          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="monthly">Monthly ₹100</option>
            <option value="yearly">Yearly ₹1000</option>
          </select>

          <button onClick={handleSubscribe}>
            Update Subscription
          </button>
        </div>

        <div className="card">
          <h3>Preferred Charity</h3>
          <select
            value={selectedCharity}
            onChange={(e) => setSelectedCharity(e.target.value)}
          >
            <option value="">Select Charity</option>
            {charities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <h4>Contribution %</h4>

          <input
            type="number"
            min="10"
            max="100"
            value={charityPercent}
            onChange={(e) => setCharityPercent(e.target.value)}
          />

          <button onClick={handleSelectCharity}>
            Save Preferences
          </button>

          <hr />

          {/* SHOW CURRENT SELECTION */}
          {/* {profile?.charity_id && (
            <p>
              Selected Charity ID: {profile.charity_id}
            </p>
          )} */}

          {selectedCharityObj && (
            <p>Selected Charity: {selectedCharityObj.name}</p>
          )}

          {/* <p>Charity: {selectedCharityObj?.name}</p> */}

          {profile?.charity_percent && (
            <p>
              Contribution: {profile.charity_percent}%
            </p>
          )}
        </div>

        <div className="card">
          <h3>Weekly Score</h3>

          <input
            type="number"
            placeholder="1–45"
            value={scoreValue}
            onChange={(e) => setScoreValue(e.target.value)}
          />

          <input
            type="date"
            value={scoreDate}
            onChange={(e) => setScoreDate(e.target.value)}
          />

          <button onClick={handleAddScore}>
            Add Score
          </button>

          <hr />

          <h4>Recent Entries</h4>

          <ul>
            {scores.slice(0, 5).map((s) => (
              <li key={s.id}>
                {s.score} — {s.date}
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* BOTTOM SECTION */}
      <div className="bottom-section">

        <div className="draw-card">
          <h3>Latest Draw Results</h3>

          {draw && (
            <div className="draw-numbers">
              {draw.numbers.map((n) => (
                <div
                  className="circle"
                  key={n}
                  style={{
                    background: userScores.includes(n)
                      ? "#22c55e"   // green for match
                      : "#1e3a8a"   // blue default
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="winner-card">
          <h3>Victory Center</h3>

          {winners
            .filter((w) => w.user_id === userId)
            .map((w) => (
              <div key={w.id} className="winner-item">

                <p>🎯 Matches: {w.match_count}</p>
                <p>💰 Prize: ₹{w.prize_amount}</p>

                {/* STATUS */}
                <p>
                  Status:{" "}
                  <span
                    className={
                      w.status === "approved"
                        ? "status approved"
                        : w.status === "rejected"
                          ? "status rejected"
                          : "status pending"
                    }
                  >
                    {w.status || "pending"}
                  </span>
                </p>

                {/* UPLOAD */}
                {!w.proof_url && (
                  <label className="upload-btn">
                    Upload Proof
                    <input
                      type="file"
                      hidden
                      onChange={(e) =>
                        handleUploadProof(e.target.files[0], w.id)
                      }
                    />
                  </label>
                )}

                {w.proof_url && (
                  <p>📄 Proof Uploaded ✅</p>
                )}

                <hr />
              </div>
            ))}

          {winners.filter((w) => w.user_id === userId).length === 0 && (
            <p>No winnings yet 😔</p>
          )}
        </div>

      </div>

    </div>
  );

  //   return (
  //     <div>

  //       <div style={{ marginBottom: "20px" }}>
  //         <a href="/dashboard">Dashboard</a> |{" "}
  //         {profile?.is_admin && <a href="/admin">Admin</a>}
  //       </div>

  //       <h1>Dashboard</h1>

  //       <button onClick={handleLogout}>
  //         Logout
  //       </button>

  //       {/* Subscription Status */}
  //       {profile && (
  //         <>
  //           <p>
  //             Subscription:{" "}
  //             {profile.is_subscribed ? "Active ✅" : "Inactive ❌"}
  //           </p>

  //           {profile.is_subscribed && (
  //             <>
  //               <p>Plan: {profile.subscription_type}</p>
  //               <p>
  //                 Renewal:{" "}
  //                 {new Date(profile.renewal_date).toLocaleDateString()}
  //               </p>
  //             </>
  //           )}
  //         </>
  //       )}
  //       {/* {profile && (
  //         <p>
  //           Subscription:{" "}
  //           {profile.is_subscribed ? "Active ✅" : "Inactive ❌"}
  //         </p>

  // {profile.is_subscribed && (
  //         <>
  //           <p>Plan: {profile.subscription_type}</p>
  //           <p>
  //             Renewal:{" "}
  //             {new Date(profile.renewal_date).toLocaleDateString()}
  //           </p>
  //         </>
  //       )}
  //       )} */}

  //       {/* Subscribe Button */}
  //       <h3>Choose Subscription Plan</h3>

  //       <select
  //         value={plan}
  //         onChange={(e) => setPlan(e.target.value)}
  //       >
  //         <option value="monthly">Monthly</option>
  //         <option value="yearly">Yearly</option>
  //       </select>

  //       <button onClick={handleSubscribe}>
  //         Subscribe
  //       </button>

  //       <hr />

  //       {profile?.charity_percent && (
  //         <p>
  //           Charity Contribution: {profile.charity_percent}%
  //         </p>
  //       )}

  //       {/* Charity Selection */}
  //       <h3>Select Charity</h3>

  //       <select
  //         value={selectedCharity}
  //         onChange={(e) => setSelectedCharity(e.target.value)}
  //       >
  //         <option value="">-- Select Charity --</option>
  //         {charities.map((charity) => (
  //           <option key={charity.id} value={charity.id}>
  //             {charity.name}
  //           </option>
  //         ))}
  //       </select>

  //       <h4>Contribution Percentage</h4>

  //       <input
  //         type="number"
  //         min="10"
  //         max="100"
  //         value={charityPercent}
  //         onChange={(e) => setCharityPercent(e.target.value)}
  //       />

  //       <button onClick={handleSelectCharity}>
  //         Save Charity
  //       </button>
  //       {/* add score section */}
  //       <h3>Add Score</h3>

  //       <input
  //         type="number"
  //         placeholder="Score (1-45)"
  //         value={scoreValue}
  //         onChange={(e) => setScoreValue(e.target.value)}
  //       />

  //       <input
  //         type="date"
  //         value={scoreDate}
  //         onChange={(e) => setScoreDate(e.target.value)}
  //       />

  //       <button onClick={handleAddScore}>Add Score</button>

  //       <h3>Your Scores</h3>

  //       <ul>
  //         {scores.map((s) => (
  //           <li key={s.id}>
  //             {s.score} - {s.date}
  //           </li>
  //         ))}
  //       </ul>
  //       {/* 
  //       <button onClick={handleRunDraw}>
  //         Run Draw (Admin)
  //       </button> */}

  //       {draw && (
  //         <div>
  //           <h3>Latest Draw</h3>
  //           <p>{draw.numbers.join(", ")}</p>
  //         </div>
  //       )}

  //       <h3>Winners</h3>

  //       <ul>
  //         {winners
  //           .filter((w) => w.user_id === userId)
  //           .map((w) => (
  //             <li key={w.id}>
  //               Matches: {w.match_count} | Prize: ₹{w.prize_amount}

  //               {/* Upload proof */}
  //               {!w.proof_url && (
  //                 <input
  //                   type="file"
  //                   onChange={(e) =>
  //                     handleUploadProof(e.target.files[0], w.id)
  //                   }
  //                 />
  //               )}

  //               {w.proof_url && (
  //                 <p>Proof uploaded ✅</p>
  //               )}
  //             </li>
  //           ))}
  //       </ul>



  //     </div>

  //   );


}

export default Dashboard;