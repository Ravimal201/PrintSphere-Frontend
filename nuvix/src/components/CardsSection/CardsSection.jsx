import DashboardCard from "../DashboardCard/DashboardCard";

export default function CardsSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <DashboardCard title="Orders Completed" value="1,240" />

      <DashboardCard title="Unique Designs" value="846" />

      <DashboardCard title="Premium Products" value="120" />

      <DashboardCard title="Customer Rating" value="4.8/5" />
    </div>
  );
}
