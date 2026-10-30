import { BASE_URL, getAuthHeader } from "./base";

export interface UnitEconomics {
  cement: number;
  stoneDust: number;
  electricity: number;
  loaderWages: number;
  dieselAndDelivery: number;
  totalCostPerBrick: number;
  sellingPricePerBrick: number;
  profitPerBrick: number;
  marginPercent: number;
}

export interface BreakEvenTracker {
  dailyFixedOverhead: number;
  contributionMargin: number;
  breakEvenTargetBricks: number;
  todayProduction: number;
  breakEvenProgress: number;
  status: string;
}

export interface FleetProfitabilityItem {
  id: number;
  vehicleNumber: string;
  vehicleName: string;
  revenue: number;
  fuelCost: number;
  serviceCost: number;
  totalOperatingCost: number;
  netProfit: number;
  kmDriven: number;
  cpkm: number;
  kmpl: number;
  pilferageRisk: "Optimal" | "Moderate Alert" | "High Alert (Pilferage Risk)";
}

export interface AgingBucket {
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface AtRiskCustomer {
  id: number;
  name: string;
  phone_no: string;
  balance: number;
  creditLimit: number;
  daysOld: number;
  isCreditLocked: boolean;
}

export interface FactoryOperations {
  todayTarget: number;
  todayProduced: number;
  todayDispatched: number;
  todayGrossRevenue: number;
  fleetOnRoadCount: number;
  fleetLoadingCount: number;
  fleetIdleCount: number;
}

export interface BiOverviewResponse {
  success: boolean;
  unitEconomics: UnitEconomics;
  breakEven: BreakEvenTracker;
  fleetProfitability: FleetProfitabilityItem[];
  customerAging: {
    totalReceivables: number;
    buckets: AgingBucket[];
    topAtRisk: AtRiskCustomer[];
  };
  factoryOperations: FactoryOperations;
}

export interface BomMaterial {
  name: string;
  quantity: number;
  unit: string;
}

export interface BomRecipe {
  productId: number;
  productName: string;
  baseUnits: number;
  materials: BomMaterial[];
}

export interface RawMaterialStock {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  dailyBurnRate: number;
  daysRemaining: number;
  reorderThreshold: number;
  status: string;
  severity: "danger" | "warning" | "success";
}

export interface BomDepletionResponse {
  success: boolean;
  recipes: BomRecipe[];
  rawMaterialsStock: RawMaterialStock[];
  autoDeductionEnabled: boolean;
}

export interface CreditCheckResponse {
  success: boolean;
  customerId: number;
  customerName: string;
  balance: number;
  creditLimit: number;
  isLocked: boolean;
  exceededBy: number;
  remainingCredit: number;
  agingDays: number;
  agingCategory: string;
  warning: string | null;
}

export interface KioskLiveResponse {
  success: boolean;
  timestamp: string;
  production: {
    target: number;
    completed: number;
    progressPercent: number;
  };
  dispatch: {
    dispatchedCount: number;
    activeLoads: number;
    todayGrossRevenue: number;
  };
  fleet: {
    id: number;
    vehicleNumber: string;
    vehicleName: string;
    status: string;
    location: string;
  }[];
  cementStockDays: number;
}

export const fetchBiOverview = async (): Promise<BiOverviewResponse> => {
  const response = await fetch(`${BASE_URL}/analytics/bi-overview`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch BI Overview data");
  }
  return response.json();
};

export const fetchBomDepletion = async (): Promise<BomDepletionResponse> => {
  const response = await fetch(`${BASE_URL}/analytics/bom-depletion`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch BOM depletion data");
  }
  return response.json();
};

export const fetchCreditCheck = async (
  customerId: string | number
): Promise<CreditCheckResponse> => {
  const response = await fetch(`${BASE_URL}/analytics/credit-check/${customerId}`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) {
    throw new Error("Failed to perform credit risk check");
  }
  return response.json();
};

export const fetchKioskLive = async (): Promise<KioskLiveResponse> => {
  const response = await fetch(`${BASE_URL}/analytics/kiosk-live`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Live Kiosk broadcast");
  }
  return response.json();
};
