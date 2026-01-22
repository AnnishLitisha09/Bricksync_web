const Projects = () => {
  return (
    <section className="py-16 px-6 md:px-20">
      <h2 className="text-2xl font-bold mb-8">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="h-40 bg-gray-300"></div>
            <div className="p-4">
              <h3 className="font-semibold">Project Title</h3>
              <p className="text-sm text-gray-500">Project Location</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projects;
