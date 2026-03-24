import AuthModal from "@/components/AuthModal";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BestProducts from "@/components/BestProducts";
import ShopConcern from "@/components/ShopConcern";
import ConcernSlider from "@/components/ConcernSlider";
import ConcernStrip from "@/components/ConcernStrip";
import GlowRoutine from "@/components/GlowRoutine";
import CategorySection from "@/components/CategorySection";
import AboutPureAstra from "@/components/AboutPureAstra";
import Transformation from "@/components/Transformation";
import VideoBanner from "@/components/VideoBanner";
import Testimonial from "@/components/Testimonial";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
    <AuthModal />
      {/* <Navbar /> */}
      <Hero />
      <BestProducts />
      <ShopConcern />
      <ConcernSlider />
      <ConcernStrip />
      <GlowRoutine />
      <CategorySection />
      <AboutPureAstra />
      <Transformation />
      <VideoBanner />
      <Testimonial />
      {/* <Footer /> */}
    </>
  );
}
