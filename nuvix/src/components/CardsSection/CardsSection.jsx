import { useEffect, useState } from "react";
import axios from "axios";
import DashboardCard from "../DashboardCard/DashboardCard";
import { API_BASE_URL } from "../../config/api";

export default function CardsSection() {
  const [stats, setStats] = useState({
    ordersCompleted: 0,
    uniqueDesigns: 0,
    premiumProducts: 0,
    customerRating: "0.0/5",
    ratingSubtitle: "Based on reviews",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/stats`);
        if (res.data) {
          setStats({
            ordersCompleted: res.data.ordersCompleted ?? 0,
            uniqueDesigns: res.data.uniqueDesigns ?? 0,
            premiumProducts: res.data.premiumProducts ?? 0,
            customerRating: res.data.customerRating ?? "0.0/5",
            ratingSubtitle: res.data.ratingSubtitle ?? "Based on reviews",
          });
        }
      } catch (err) {
        console.error("Error loading platform stats:", err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 select-none">
      <DashboardCard
        title="Orders Completed"
        value={stats.ordersCompleted.toLocaleString()}
        subtitle="Happy customers worldwide"
      />

      <DashboardCard
        title="Unique Designs"
        value={stats.uniqueDesigns.toLocaleString()}
        subtitle="Created by our users"
      />

      <DashboardCard
        title="Premium Products"
        value={stats.premiumProducts.toLocaleString()}
        subtitle="High quality T-shirts"
      />

      <DashboardCard
        title="Customer Rating"
        value={stats.customerRating}
        subtitle={stats.ratingSubtitle}
      />
    </div>
  );
}
