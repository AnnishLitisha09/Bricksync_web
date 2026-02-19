// src/services/customerService.ts

const dummyData = [
  {
    _id: "AATHI-01",
    name: "AATHI & CO",
    email: "billing@aathi.co",
    phoneNumber: "+91 98422 12345",
    category: "Commercial",
    ledger: [
      {
        id: "00023",
        date: "02-04-2025",
        type: "Delivery",
        items: [
          { 
            particulars: "1/4 JALLI Qty: 0.100 unit @Rate: 3500.00", 
            amount: 350.00, 
            vehicleNumber: "TN-37-BY-1234",
            driverName: "Rajesh Kumar",
            loadingNames: ["Senthil", "Mani", "Arun"] // Array for multiple loaders
          },
          { 
            particulars: "M SAND Qty: 0.250 unit @Rate: 5600.00", 
            amount: 1400.00, 
            vehicleNumber: "TN-37-BY-1234",
            driverName: "Rajesh Kumar",
            loadingNames: ["Senthil"] 
          },
          { particulars: "AUTO RENT Qty: 1.000 load @Rate: 250.00", amount: 250.00, vehicleNumber: null },
          { particulars: "DALMIA BBC Qty: 2.000 pack @Rate: 320.00", amount: 640.00, vehicleNumber: null }
        ],
        totalDebit: 0,
        totalCredit: 2640.00
      },
      {
        id: "00150",
        date: "15-04-2025",
        type: "Payment",
        items: [
          { particulars: "Paid via CASH - Received at Office", amount: 1500.00, vehicleNumber: null }
        ],
        totalDebit: 1500.00,
        totalCredit: 0
      }
    ]
  }
];

export const getAllCustomers = async () => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return dummyData;
};

export const getCustomerById = async (id: string) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return dummyData.find((c) => c._id === id) || null;
};