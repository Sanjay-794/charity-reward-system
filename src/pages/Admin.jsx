import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "./Admin.css";

function Admin() {
    const [profile, setProfile] = useState(null);
    const [winners, setWinners] = useState([]);
    const [draw, setDraw] = useState(null);

    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const { data: userData } = await supabase.auth.getUser();

            // ❌ Not logged in
            if (!userData.user) {
                window.location.href = "/login";
                return;
            }

            const uid = userData.user.id;

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", uid)
                .single();

            setProfile(profileData);
            setLoading(false);

            fetchUsers();
            fetchWinners();
            fetchLatestDraw();
        };

        init();

    }, []);

    // fetch winners
    const fetchWinners = async () => {
        const { data } = await supabase
            .from("winners")
            .select(`
    *,
    profiles ( name )
  `);

        console.log("WINNERS DATA:", data);
        console.log("WINNERS ERROR:", error);
        // const { data } = await supabase
        //     .from("winners")
        //     .select("*");

        setWinners(data || []);
    };

    const fetchUsers = async () => {
        const { data } = await supabase
            .from("profiles")
            .select("*");

        setUsers(data || []);
    };
    // fetch latest draw
    const fetchLatestDraw = async () => {
        const { data } = await supabase
            .from("draws")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1);

        setDraw(data[0]);
    };

    // generate draw numbers
    const generateDrawNumbers = () => {
        let nums = new Set();

        while (nums.size < 5) {
            nums.add(Math.floor(Math.random() * 45) + 1);
        }

        return Array.from(nums);
    };

    // run draw
    const handleRunDraw = async () => {
        // const numbers = generateDrawNumbers();

        const numbers = [10, 20, 30, 40, 5];

        const { data: drawData } = await supabase
            .from("draws")
            .insert([
                {
                    numbers,
                    draw_date: new Date()
                }
            ])
            .select();

        const drawId = drawData[0].id;

        const { data: allScores } = await supabase
            .from("scores")
            .select("*");

        console.log("ALL SCORES:", allScores);

        const userMap = {};

        allScores.forEach((s) => {
            if (!userMap[s.user_id]) {
                userMap[s.user_id] = [];
            }
            userMap[s.user_id].push(s.score);
        });

        console.log("USER MAP:", userMap);

        for (let user in userMap) {
            console.log("CURRENT USER:", user);
            console.log("USER SCORES:", userMap[user]);
            const matches = userMap[user].filter((s) =>
                numbers.includes(Number(s))
            ).length;

            console.log("MATCHES:", matches);

            if (matches >= 3) {
                const { error } = await supabase.from("winners").insert([
                    {
                        user_id: user,
                        draw_id: drawId,
                        match_count: matches,
                        prize_amount: matches * 100
                    }
                ]);

                if (error) {
                    console.log("INSERT ERROR:", error);
                }
            }
        }

        alert("Draw Completed!");
        fetchWinners();
        fetchLatestDraw();
    };

    // approve winner
    const handleApprove = async (id) => {
        await supabase
            .from("winners")
            .update({ status: "approved" })
            .eq("id", id);

        fetchWinners();
    };

    // reject winner
    const handleReject = async (id) => {
        await supabase
            .from("winners")
            .update({ status: "rejected" })
            .eq("id", id);

        fetchWinners();
    };

    // upload proof
    // const handleUpload = async (file) => {
    //     const { data: userData } = await supabase.auth.getUser();
    //     const userId = userData.user.id;

    //     const fileName = `${userId}-${Date.now()}`;

    //     const { error } = await supabase.storage
    //         .from("proofs")
    //         .upload(fileName, file);

    //     if (error) {
    //         console.log(error);
    //         return;
    //     }

    //     const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/proofs/${fileName}`;

    //     await supabase
    //         .from("winners")
    //         .update({ proof_url: url })
    //         .eq("user_id", userId);

    //     alert("Proof uploaded!");
    // };

    // protect admin
    if (!profile) return <h2>Loading...</h2>;

    if (!profile.is_admin) {
        window.location.href = "/login";
        return null;
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    const toggleAdmin = async (id, current) => {
        await supabase
            .from("profiles")
            .update({ is_admin: !current })
            .eq("id", id);

        fetchUsers();
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                <h2>Loading Admin Dashboard...</h2>
            </div>
        );
    }

    if (!profile?.is_admin) {
        return <h2>Access Denied</h2>;
    }

    return (
        <div className="admin-dashboard">

            {/* HEADER */}
            <div className="admin-header">
                <h2>Admin Center</h2>

                <div>
                    <a href="/dashboard">Dashboard</a>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </div>

            {/* TOP SECTION */}
            <div className="admin-top">

                {/* CARD 1 */}
                <div className="stat-card">
                    <p>Total Winners</p>
                    <h2>{winners.length}</h2>
                </div>

                {/* CARD 2 */}
                <div className="stat-card">
                    <p>Draw Status</p>
                    <h2>{draw ? "Verified ✅" : "No Draw ❌"}</h2>
                </div>

                {/* CARD 3 */}
                <div className="draw-card blue-card">
                    <h3>Draw Control</h3>

                    <p>Execute and manage the monthly charity reward sequence.</p>

                    {/* DRAW NUMBERS */}
                    {draw && (
                        <div className="draw-numbers">
                            {draw.numbers.map((n) => (
                                <div className="circle" key={n}>
                                    {n}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* BUTTON */}
                    <button className="draw-btn" onClick={handleRunDraw}>
                        Run Monthly Draw
                    </button>
                </div>

            </div>

            <div className="admin-section">
                <h3>Winners Management</h3>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Matches</th>
                            <th>Prize</th>
                            <th>Status</th>
                            <th>Proof</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {(winners || []).map((w) => (
                            <tr key={w.id}>
                                <td>{w.profiles?.name || "Unknown"}</td><td>{w.user_id.slice(0, 6)}...</td>
                                <td>{w.match_count}</td>
                                <td>₹{w.prize_amount}</td>

                                {/* STATUS */}
                                <td>
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
                                </td>

                                {/* PROOF */}
                                <td>
                                    {w.proof_url ? (
                                        <a href={w.proof_url} target="_blank">
                                            View
                                        </a>
                                    ) : (
                                        "—"
                                    )}
                                </td>

                                {/* ACTIONS */}
                                <td>
                                    <button onClick={() => handleApprove(w.id)}>
                                        Approve
                                    </button>

                                    <button onClick={() => handleReject(w.id)}>
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="admin-section">
                <h3>User Management</h3>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Subscription</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {(users || []).map((u) => (
                            <tr key={u.id}>
                                <td>{u.name}</td>

                                {/* ROLE */}
                                <td>
                                    <span className={u.is_admin ? "status approved" : "status pending"}>
                                        {u.is_admin ? "Admin" : "User"}
                                    </span>
                                </td>

                                {/* SUBSCRIPTION */}
                                <td>
                                    {u.is_subscribed ? "Active ✅" : "Inactive ❌"}
                                </td>

                                {/* ACTION */}
                                <td>
                                    <button onClick={() => toggleAdmin(u.id, u.is_admin)}>
                                        {u.is_admin ? "Remove Admin" : "Make Admin"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );

    // return (

    //     <div>
    //         <div style={{ marginBottom: "20px" }}>
    //             <a href="/dashboard">Dashboard</a> |{" "}
    //             <a href="/admin">Admin</a>
    //         </div>
    //         <h1>Admin Panel</h1>

    //         <button onClick={handleLogout}>
    //             Logout
    //         </button>

    //         <button onClick={handleRunDraw}>
    //             Run Monthly Draw
    //         </button>

    //         <hr />

    //         {draw && (
    //             <div>
    //                 <h3>Latest Draw</h3>
    //                 <p>{draw.numbers.join(", ")}</p>
    //             </div>
    //         )}

    //         <h3>All Users</h3>

    //         <ul>
    //             {users.map((u) => (
    //                 <li key={u.id}>
    //                     {u.id} | Admin: {u.is_admin ? "Yes" : "No"}

    //                     <button onClick={() => toggleAdmin(u.id, u.is_admin)}>
    //                         Toggle Admin
    //                     </button>
    //                 </li>
    //             ))}
    //         </ul>

    //         <h3>Winners</h3>

    //         <ul>
    //             {winners.map((w) => (
    //                 <li key={w.id}>
    //                     {w.user_id} | Matches: {w.match_count} | Status: {w.status}

    //                     {w.proof_url && (
    //                         <a href={w.proof_url} target="_blank">
    //                             View Proof
    //                         </a>
    //                     )}

    //                     <button onClick={() => handleApprove(w.id)}>
    //                         Approve
    //                     </button>

    //                     <button onClick={() => handleReject(w.id)}>
    //                         Reject
    //                     </button>
    //                 </li>
    //             ))}
    //         </ul>

    //         {/* <h3>Upload Proof</h3>
    //         <input
    //             type="file"
    //             onChange={(e) => handleUpload(e.target.files[0])}
    //         /> */}

    //         <hr />

    //         <h3>Analytics</h3>
    //         <p>Total Winners: {winners.length}</p>
    //         <p>Latest Draw: {draw ? "Available" : "No draw yet"}</p>
    //     </div>
    // );
}

export default Admin;