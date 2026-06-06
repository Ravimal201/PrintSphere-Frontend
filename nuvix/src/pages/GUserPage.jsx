import Navbar from "../components/Navbar/GNavbar";
import Footer from "../components/Footer/Footer";
import CardsSection from "../components/CardsSection/CardsSection";
import PopularProducts from "../components/PopularProducts/PopularProducts";
import Testimonials from "../components/Testimonials/Testimonials";
import HowItWorks from "../components/HowItWorks/HowItWorks";
import HeroSection from "../components/HeroSection/HeroSection";
import BannerSection from "../components/BannerSection/BannerSection";

export default function GUserPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        <main className="flex-1 overflow-auto p-8">

          <div className="mx-auto w-full max-w-screen-2xl">
            <HeroSection />

            {/* Cards */}
            <CardsSection />

            {/* How It Works */}
            <HowItWorks />

            <PopularProducts />

            <Testimonials />

            <BannerSection />
          </div>

        </main>

      </div>

      <Footer />

    </div>
  );
}