
import Reputation from "./Reputation";
import About from "./About";
import Services from "./Services";
import Contact from "./Contact";
import HeroWithNavbar from "./HeroWithNavbar";
import AppComingSoon from "./AppComingSoon";
import ProductsPage from "./ProductsPage";

const LandingPage = () => {
  return (
    <div className="w-full bg-white text-gray-900">
      {/* <Navbar />
      <Hero /> */}
      <HeroWithNavbar/>
      <Reputation />
      <About />
      <Services />
      {/* <Stats /> */}
      {/* <Projects /> */}
      <ProductsPage/>
      <Contact />
      <AppComingSoon/>
    </div>
  );
};

export default LandingPage;
