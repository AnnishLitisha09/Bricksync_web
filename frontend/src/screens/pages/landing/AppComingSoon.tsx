const AppComingSoon = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 md:px-20 text-center">
      {/* Banner Image */}
      {/* <div className="max-w-3xl w-full mb-10">
        <img
          src="https://i.ibb.co/5vVYtXq/036307f5-925a-42d5-812b-06de09a6b792.png" // Use your uploaded image URL here
          alt="App Banner"
          className="w-full h-auto rounded-xl shadow-lg"
        />
      </div> */}

      {/* Coming Soon Text */}
      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-orange-500">
        Our App is Coming Soon!
      </h1>
      <p className="text-gray-700 mb-8 max-w-lg mx-auto">
        Get ready to experience our services on the go. Download the app when it’s
        live on the Play Store and App Store.
      </p>

      {/* Store Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <a
          href="#"
          className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-lg shadow-lg hover:bg-gray-900 transition"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
            alt="Google Play"
            className="h-6"
          />
        </a>

        <a
          href="#"
          className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-lg shadow-lg hover:bg-gray-900 transition"
        >
          <img
            src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
            alt="App Store"
            className="h-6"
          />
        </a>
      </div>

      {/* Optional Footer */}
      <p className="mt-12 text-sm text-gray-500">
        © {new Date().getFullYear()} Aswath Bricks. All rights reserved.
      </p>
    </section>
  );
};

export default AppComingSoon;
