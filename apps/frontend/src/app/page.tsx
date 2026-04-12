import Hero from "@/components/Hero";
import BestProducts from "@/components/BestProducts";
import ConcernStrip from "@/components/ConcernStrip";
import GlowRoutine from "@/components/GlowRoutine";
import CategorySection from "@/components/CategorySection";
import AboutPureAstra from "@/components/AboutPureAstra";
import OurPromise from "@/components/OurPromise";

export default function Home() {
  return (
    <>
      {/* <Navbar /> */}
      <Hero />
      <BestProducts />
      {/* <ShopConcern /> */}
      {/* <ConcernSlider /> */}
      <ConcernStrip />
      <GlowRoutine />
      <CategorySection />
      <AboutPureAstra />
      <OurPromise />
      {/* <Transformation /> */}
      {/* <VideoBanner /> */}
      {/* <Testimonial /> */}
      {/* <Footer /> */}
    </>
  );
}
