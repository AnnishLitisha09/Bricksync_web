import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Gauge, Wrench, Car } from "lucide-react";
import { BASE_URL, getAuthHeader } from "../../../../api/base";
// Assuming your utility file is named apiConfig.ts or similar

export default function ServiceHistoryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const shopId = searchParams.get("shopId");
  const shopName = searchParams.get("shopName");

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/vehicle-services`, {
          headers: getAuthHeader(),
        });
        const data = await response.json();
        
        // Filter services by the shopId passed in the URL
        const filtered = data.filter((item: any) => item.serviceShopId === Number(shopId));
        
        // Calculate total spent at this shop
        const total = filtered.reduce((acc: number, curr: any) => acc + curr.amount, 0);
        
        setServices(filtered);
        setTotalSpent(total);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };

    if (shopId) fetchHistory();
  }, [shopId]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-orange-600 transition font-medium"
      >
        <ArrowLeft size={18} /> Back to Service Shops
      </button>

      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-6 border flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
            <Wrench size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{shopName}</h1>
            <p className="text-gray-500">Service Visit History</p>
          </div>
        </div>
        
        <div className="bg-orange-500 rounded-2xl shadow-sm p-6 text-white flex flex-col justify-center">
          <p className="text-orange-100 text-sm font-medium uppercase">Total Spent Here</p>
          <p className="text-3xl font-bold">₹{totalSpent.toLocaleString()}</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          <p className="text-gray-500">Retrieving service logs...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 text-lg font-medium">No service records found for this shop.</p>
          <button 
            onClick={() => navigate("/vehicles/services/add")}
            className="mt-4 text-orange-500 hover:underline font-semibold"
          >
            Add a new service record
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <div 
              key={service.id} 
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{service.topic}</h3>
                    <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold text-lg">
                    ₹{service.amount.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-6 pt-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="text-orange-500" />
                    <span className="text-sm">{new Date(service.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Gauge size={16} className="text-orange-500" />
                    <span className="text-sm font-medium">{service.kilometer.toLocaleString()} KM</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info Card */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-w-[220px]">
                <div className="flex items-center gap-2 mb-2">
                  <Car size={16} className="text-gray-400" />
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Associated Vehicle</span>
                </div>
                <p className="font-bold text-gray-800">{service.vehicle.vehicleName}</p>
                <p className="text-sm font-mono text-orange-600 bg-orange-50 inline-block px-2 rounded mt-1">
                  {service.vehicle.vehicleNumber}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}