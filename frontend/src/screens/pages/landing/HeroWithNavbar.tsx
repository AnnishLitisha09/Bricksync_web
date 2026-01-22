import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../../../assets/logo.png";
import BuildingSVG from "../../../assets/human.svg";
import Decore from "../../../assets/Decore.svg";

const HeroWithNavbar: React.FC = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [showNavbar, setShowNavbar] = useState<boolean>(true);

    // Ref for the section to scroll to
    const nextSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let lastScroll = 0;

        const handleScroll = () => {
            const currentScroll = window.scrollY;
            if (currentScroll > lastScroll && currentScroll > 50) {
                setShowNavbar(false);
            } else {
                setShowNavbar(true);
            }
            lastScroll = currentScroll;
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Scroll function
    const scrollToNextSection = () => {
        if (nextSectionRef.current) {
            nextSectionRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="w-full bg-white overflow-hidden">
            {/* ================= NAVBAR ================= */}
            <header
                className={`w-full fixed top-0 left-0 z-50 transition-transform duration-300 ${showNavbar ? "translate-y-0" : "-translate-y-full"
                    }`}
            >
                <div className="flex items-center px-4 sm:px-6 md:px-20 py-4 bg-white shadow-md">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate("/")}
                    >
                        <img src={Logo} alt="Aswath Bricks" className="w-10 h-10 object-contain" />
                        <h1 className="text-xl font-bold text-orange-500">Aswath Bricks</h1>
                    </div>

                    {/* Desktop Menu */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700 ml-auto">
                        <span onClick={() => navigate("/")} className="hover:text-blue-600 cursor-pointer">
                            Home
                        </span>
                        <span className="hover:text-blue-600 cursor-pointer">About</span>
                        <span className="hover:text-blue-600 cursor-pointer">Products</span>
                        <span className="hover:text-blue-600 cursor-pointer">Services</span>
                        <span className="hover:text-blue-600 cursor-pointer">Contact</span>

                        <button
                            onClick={() => navigate("/login")}
                            className="ml-6 px-5 py-2 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition"
                        >
                            Login
                        </button>

                        <button
                            onClick={() => navigate("/signup")}
                            className="px-5 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition"
                        >
                            Sign up
                        </button>
                    </nav>

                    {/* Mobile Icon */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden ml-auto text-blue-700"
                    >
                        {menuOpen ? <X size={26} /> : <Menu size={26} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden bg-white shadow-lg px-6 py-4 space-y-4">
                        {["Home", "About", "Products", "Services", "Contact"].map((item, index) => (
                            <div
                                key={index}
                                className="cursor-pointer hover:text-blue-600"
                                onClick={() => setMenuOpen(false)}
                            >
                                {item}
                            </div>
                        ))}

                        <button
                            onClick={() => {
                                navigate("/login");
                                setMenuOpen(false);
                            }}
                            className="w-full py-2 rounded-md border border-blue-600 text-blue-600"
                        >
                            Login
                        </button>

                        <button
                            onClick={() => {
                                navigate("/signup");
                                setMenuOpen(false);
                            }}
                            className="w-full py-2 rounded-md bg-orange-500 text-white"
                        >
                            Sign up
                        </button>
                    </div>
                )}
            </header>

            {/* ================= HERO SECTION ================= */}
            <section
                className="relative w-full flex items-center bg-white overflow-hidden
                   pt-12 sm:pt-14 md:pt-28
                   min-h-[calc(100vh-4rem)] md:min-h-screen"
            >
                {/* Decore fixed to top-right corner */}
                <img
                    src={Decore}
                    alt="Decor Background"
                    className="hidden md:block absolute top-0 right-0 w-[75%] h-full object-cover z-0"
                />

                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 items-center px-6 md:px-20 relative z-10">
                    {/* Left Content */}
                    <div className="flex flex-col justify-center">
                        <p className="text-orange-500 font-semibold mb-3">
                            BEST QUALITY BRICKS IN TAMIL NADU
                        </p>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                            Build strong, <br />
                            build smart, <br />
                            build with{" "}
                            <span className="text-orange-500">Aswath Bricks</span>
                        </h1>

                        <p className="text-gray-500 mt-6 max-w-lg">
                            We provide premium hollow bricks and construction materials
                            that ensure durability, strength, and cost efficiency for
                            every project.
                        </p>

                        <div className="flex items-center gap-4 mt-8">
                            <button
                                onClick={scrollToNextSection}
                                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                            >
                                Scroll Down to Explore
                            </button>

                            <button
                                onClick={() =>
                                    window.open(
                                        "https://3dwarehouse.sketchup.com/ar-view/5cf579e8-4080-4b55-b754-7fa4044e8163",
                                        "_blank"
                                    )
                                }
                                className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                            >
                                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-100 text-orange-500">
                                    ▶
                                </span>
                                View AR Brick
                            </button>

                        </div>
                    </div>

                    {/* Right SVG Image */}
                    <div className="relative flex justify-center items-center">
                        <img
                            src={BuildingSVG}
                            alt="Decor Background"
                            className="hidden md:block relative z-10 w-full max-w-4xl lg:max-w-4xl"
                        />
                    </div>
                </div>
            </section>

            {/* ================= NEXT SECTION ================= */}
            <section
                ref={nextSectionRef}
                className="py-20 bg-gray-50 text-center"
            >
                <h2 className="text-3xl font-bold text-gray-900">Explore Our Products</h2>
                <p className="mt-4 text-gray-600">
                    Scroll smoothly down to see all our offerings and details.
                </p>
            </section>
        </div>
    );
};

export default HeroWithNavbar;
