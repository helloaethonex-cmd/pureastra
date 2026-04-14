import Hero from "@/components/Hero";
import BestProducts from "@/components/BestProducts";
import ConcernStrip from "@/components/ConcernStrip";
import dynamic from "next/dynamic";

const GlowRoutine = dynamic(() => import("@/components/GlowRoutine"));
const CategorySection = dynamic(() => import("@/components/CategorySection"));
const AboutPureAstra = dynamic(() => import("@/components/AboutPureAstra"));
const OurPromise = dynamic(() => import("@/components/OurPromise"));

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
