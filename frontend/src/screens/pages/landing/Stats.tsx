const Stats = () => {
  const stats = [
    { value: "123", label: "Projects Completed" },
    { value: "84", label: "Happy Clients" },
    { value: "30", label: "Years Experience" },
    { value: "37", label: "Awards Won" },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center px-6 md:px-20">
        {stats.map((s, i) => (
          <div key={i}>
            <h3 className="text-3xl font-bold text-blue-700">{s.value}</h3>
            <p className="text-sm text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
