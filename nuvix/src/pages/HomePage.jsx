import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import DashboardCard from "../components/DashboardCard/DashboardCard";
import ToolButton from "../components/ToolButton/ToolButton";

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

          {/* Designer Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Tools */}
            <div className="bg-white rounded-3xl p-6 border">

              <h2 className="text-xl font-semibold mb-6">
                Design Tools
              </h2>

              <div className="space-y-4">
                <ToolButton text="Upload Image" />
                <ToolButton text="Add Text" />
                <ToolButton text="Choose Color" />
                <ToolButton text="Templates" />
              </div>

            </div>

            {/* Preview */}
            <div className="xl:col-span-2 bg-white rounded-3xl p-6 border">

              <h2 className="text-2xl font-semibold mb-6">
                3D Preview
              </h2>

              <div className="h-[500px] rounded-3xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">

                <div className="text-center">

                  <div className="w-48 h-56 bg-white rounded-3xl shadow-lg mx-auto mb-6 flex items-center justify-center">
                    3D T-Shirt
                  </div>

                  <p className="text-gray-500">
                    React Three Fiber Preview Area
                  </p>

                </div>

              </div>

            </div>

          </div>

        </main>

      </div>

      <Footer />

    </div>
  );
}