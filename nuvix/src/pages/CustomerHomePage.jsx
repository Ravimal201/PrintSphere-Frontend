import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import CardsSection from "../components/CardsSection/CardsSection";
import PopularProducts from "../components/PopularProducts/PopularProducts";
import Testimonials from "../components/Testimonials/Testimonials";
import HowItWorks from "../components/HowItWorks/HowItWorks";
import HeroSection from "../components/HeroSection/HeroSection";
import BannerSection from "../components/BannerSection/BannerSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        <Sidebar />

        <main className="flex-1 overflow-auto p-8 lg:ml-72">

          <HeroSection />

          {/* Cards */}
          <CardsSection />

          {/* How It Works */}
          <HowItWorks />

          <PopularProducts />

          <Testimonials />

          <BannerSection />

        </main>

      </div>

      <Footer withSidebarOffset />

    </div>
  );
}