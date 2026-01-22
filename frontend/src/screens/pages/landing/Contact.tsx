import { MapPin, Phone, Mail } from "lucide-react";

const Contact = () => {
  return (
    <section className="relative py-24 px-6 overflow-hidden bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600">
      {/* Decorative shapes */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-orange-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-orange-600 rounded-full blur-3xl opacity-30"></div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start text-white">
        {/* Left Side - Contact Info */}
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
            What can we do for you?
          </h2>
          <p className="text-orange-100 mb-8">
            Ready to work together? Let’s build something great.
          </p>

          {/* Location */}
          <div className="flex items-start gap-4">
            <MapPin className="mt-1 text-orange-100 w-5 h-5" />
            <p className="text-orange-100">
              SS Tower, Pandian Nagar Bus Stop, Tiruppur 641602
            </p>
          </div>

          {/* Phone Numbers */}
          <div className="flex items-start gap-4">
            <Phone className="mt-1 text-orange-100 w-5 h-5" />
            <div className="flex flex-col text-orange-100">
              <span>9842048181</span>
              <span>9843083521</span>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4">
            <Mail className="mt-1 text-orange-100 w-5 h-5" />
            <p className="text-orange-100">maswath55@gmail.com</p>
          </div>
        </div>

        {/* Right Side - Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-left">
          <div className="flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Submit Button */}
            <button
              className="mt-4 w-full bg-gradient-to-r from-orange-500 to-orange-400 
                         text-white py-3 rounded-lg font-semibold
                         hover:from-orange-600 hover:to-orange-500
                         transition duration-300 transform hover:scale-105 shadow-lg"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <p className="mt-12 text-sm text-orange-100 text-center md:text-left">
        We usually respond within 24 hours 🚀
      </p>
    </section>
  );
};

export default Contact;
