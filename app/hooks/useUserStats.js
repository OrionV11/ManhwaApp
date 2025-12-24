import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:3000"; // adjust if needed

export default function useUserStats(userId) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/stats/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, [userId]);

  return stats;
}
