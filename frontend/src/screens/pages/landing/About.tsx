const About = () => {
  return (
    <section className="py-20 bg-gray-50 px-6 md:px-20 flex flex-col md:flex-row items-center gap-12">
      {/* Left Image */}
      <div className="w-full md:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1593642532973-d31b6557fa68?auto=format&fit=crop&w=800&q=80"
          alt="About Us"
          className="w-full h-auto rounded-lg shadow-md"
        />
      </div>

      {/* Right Text */}
      <div className="w-full md:w-1/2 bg-orange-500 text-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-4">About Us</h2>

        <p className="text-sm leading-relaxed mb-4">
          With over <span className="font-semibold">15 years of experience</span>,
          we are a trusted supplier of premium construction materials including{" "}
          <span className="font-semibold">
            M-Sand, P-Sand, mold bricks, hollow blocks, red stones, and fly ash stones
          </span>.
        </p>

        <p className="text-sm leading-relaxed mb-4">
          We manufacture and supply{" "}
          <span className="font-semibold">
            4”, 6”, 8”, and 9” mold bricks
          </span>{" "}
          with consistent quality and strength to meet modern construction needs.
        </p>

        <p className="text-sm leading-relaxed mb-4">
          We are an{" "}
          <span className="font-semibold">official Dalmia Cement dealer</span>{" "}
          and also provide leading brands like{" "}
          <span className="font-semibold">Maha Cement</span> and{" "}
          <span className="font-semibold">Chettinad Cement</span>.
        </p>

        <p className="text-sm leading-relaxed mb-6">
          Known for our{" "}
          <span className="font-semibold">fast delivery, competitive pricing,</span>{" "}
          and reliable service, we support builders and contractors with
          high-quality materials that ensure strong and durable construction.
        </p>

        <ul className="text-sm space-y-2">
          <li>✔ 15+ Years of Industry Experience</li>
          <li>✔ 4”, 6”, 8”, 9” Mold Bricks & Hollow Blocks</li>
          <li>✔ M-Sand, P-Sand, Red Stones & Fly Ash Stones</li>
          <li>✔ Official Dalmia, Maha & Chettinad Cement Dealer</li>
          <li>✔ Fast & Reliable Delivery</li>
        </ul>
      </div>
    </section>
  );
};

export default About;
