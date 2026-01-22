import { Truck, Users, Layout } from "lucide-react"; // Import relevant icons

const Reputation = () => {
  const items = [
    {
      title: "High Quality Bricks",
      desc: "Premium bricks manufactured with precision and durability.",
      icon: <Layout className="w-10 h-10 text-orange-500 mx-auto" />,
    },
    {
      title: "Best Support",
      desc: "Our team provides excellent customer support and guidance.",
      icon: <Users className="w-10 h-10 text-orange-500 mx-auto" />,
    },
    {
      title: "Timely Delivery",
      desc: "Fast and reliable delivery with our dedicated trucks.",
      icon: <Truck className="w-10 h-10 text-orange-500 mx-auto" />,
    },
  ];

  return (
    <section className="py-16 text-center bg-gray-50">
      <h2 className="text-2xl font-bold mb-10">Our Reputation</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 md:px-20">
        {items.map((item, i) => (
          <div
            key={i}
            className="border rounded-xl p-6 hover:shadow-lg transition flex flex-col items-center gap-4"
          >
            {item.icon}
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Reputation;
