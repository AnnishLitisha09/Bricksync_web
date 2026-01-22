import {
  HomeModernIcon,
  BuildingLibraryIcon,
  LightBulbIcon,
  WrenchIcon,
  PencilIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";

const services = [
  { name: "Construction", icon: HomeModernIcon },
  { name: "Renovation", icon: BuildingLibraryIcon },
  { name: "Consultation", icon: LightBulbIcon },
  { name: "Repair Services", icon: WrenchIcon },
  { name: "Architecture", icon: PencilIcon },
  { name: "Manufacturing", icon: Cog6ToothIcon },
];

// Services that get orange gradient background
const orangeBgServices = ["Renovation", "Repair Services", "Manufacturing"];

const Services = () => {
  return (
    <section className="py-20 bg-gray-50 text-center">
      <h2 className="text-3xl md:text-4xl font-extrabold mb-3 relative inline-block">
        Services
        <span className="block w-16 h-1 bg-orange-500 rounded-full mt-1 mx-auto"></span>
      </h2>
      <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
        Explore our wide range of services designed to meet your construction and design needs.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-6 md:px-20">
        {services.map(({ name, icon: Icon }, i) => {
          const isOrange = orangeBgServices.includes(name);
          return (
            <div
              key={i}
              className={`rounded-xl py-10 px-6 flex flex-col items-center justify-center
                          transition transform hover:scale-105 hover:shadow-2xl duration-300
                          ${
                            isOrange
                              ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                              : "bg-white text-orange-500 shadow-md"
                          }`}
            >
              <div
                className={`w-16 h-16 mb-5 flex items-center justify-center rounded-full
                            ${
                              isOrange
                                ? "bg-white/20" // slight contrast circle
                                : "bg-orange-100"
                            }`}
              >
                <Icon
                  className={`w-8 h-8 ${
                    isOrange ? "text-white" : "text-orange-500"
                  }`}
                />
              </div>
              <h3 className="text-lg font-semibold">{name}</h3>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Services;
