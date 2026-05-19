export default function DashboardCard({ title, value }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border">

      <p className="text-gray-500 mb-2">
        {title}
      </p>

      <h3 className="text-3xl font-bold text-gray-800">
        {value}
      </h3>

    </div>
  );
}