// src/services/customerService.ts

const dummyData = [
  {
    _id: "AATHI-01",
    name: "AATHI & CO",
    email: "billing@aathi.co",
    phoneNumber: "+91 98422 12345",
    category: "Commercial", // enginner shop other 
    ledger: [
      {
        id: "00023",
        date: "02-04-2025",
        type: "Delivery",
        items: [
          { particulars: "1/4 JALLI Qty: 0.100 unit @Rate: 3500.00", amount: 350.00, vehicleNumber: "TN-37-BY-1234" },
          { particulars: "M SAND Qty: 0.250 unit @Rate: 5600.00", amount: 1400.00, vehicleNumber: "TN-37-BY-1234" },
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
      },
      {
        id: "00108",
        date: "19-04-2025",
        type: "Delivery",
        items: [
          { particulars: "P SAND Qty: 1.000 unit @Rate: 6800.00", amount: 6800.00, vehicleNumber: "TN-99-AM-5566" },
          { particulars: "6 MOLD B Qty: 155.000 NOS @Rate: 37.00", amount: 5735.00, vehicleNumber: "TN-40-H-9001" }
        ],
        totalDebit: 0,
        totalCredit: 12535.00
      }
    ]
  },
  {
    _id: "VK-02",
    name: "VK CONSTRUCTIONS",
    email: "contact@vkconstructions.in",
    phoneNumber: "+91 99944 55566",
    category: "Contractor",
    ledger: [
      {
        id: "00912",
        date: "12-05-2025",
        type: "Delivery",
        items: [{ particulars: "M SAND Qty: 2.000 unit @Rate: 5800.00", amount: 11600.00, vehicleNumber: "TN-33-AU-8822" }],
        totalDebit: 0,
        totalCredit: 11600.00
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