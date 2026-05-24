import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import DashboardCard from "../components/DashboardCard/DashboardCard";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      <Navbar />

      <div className="flex flex-1">

        <Sidebar />

        <main className="flex-1 p-8">

          {/* Hero */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 text-white mb-8">

            <h1 className="text-4xl font-bold mb-4">
              3D T-Shirt Customization Platform
            </h1>

            <p className="text-lg text-indigo-100">
              Customize your T-shirts in real-time with 3D preview.
            </p>

          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

            <DashboardCard
              title="Orders"
              value="1,240"
            />

            <DashboardCard
              title="Revenue"
              value="$12,430"
            />

            <DashboardCard
              title="Designs"
              value="846"
            />

            <DashboardCard
              title="Products"
              value="120"
            />

          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

            <DashboardCard
              title="Orders"
              value="1,240"
            />

            <DashboardCard
              title="Revenue"
              value="$12,430"
            />

            <DashboardCard
              title="Designs"
              value="846"
            />

            <DashboardCard
              title="Products"
              value="120"
            />

          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

            <DashboardCard
              title="Orders"
              value="1,240"
            />

            <DashboardCard
              title="Revenue"
              value="$12,430"
            />

            <DashboardCard
              title="Designs"
              value="846"
            />

            <DashboardCard
              title="Products"
              value="120"
            />

          </div>

        </main>

      </div>

      <Footer />

    </div>
  );
}