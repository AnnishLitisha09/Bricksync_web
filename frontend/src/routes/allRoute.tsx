import { Navigate } from "react-router-dom";
import ForgotPassword from "../screens/auth/ForgotPassword";
import Login from "../screens/auth/Login";
import ResetPassword from "../screens/auth/ResetPassword";
import SignUp from "../screens/auth/SignUp";
import NotFound from "../screens/NotFound";
import Banks from "../screens/pages/banks/banks";
import TransactionsPage from "../screens/pages/banks/TransactionsPage";
import { Dashboard } from "../screens/pages/dashBoard";
import LandingPage from "../screens/pages/landing/LandingPage";
import ProfilePage from "../screens/pages/profiles/profile";
import ShopPage from "../screens/pages/shops/ShopPage";
import AddDriverPage from "../screens/pages/staff/AddDriverPage";
import Staff from "../screens/pages/staff/staff";
import AddVehicle from "../screens/pages/Vehicles/AddVehicle";
import AddFuelPage from "../screens/pages/Vehicles/Fuel/AddFuelPage";
import FuelPage from "../screens/pages/Vehicles/Fuel/FuelPage";
import VehicleList from "../screens/pages/Vehicles/Vehicle";
import ViewVehicle from "../screens/pages/Vehicles/viewVehicle";
import ContactPage from "../screens/pages/ContactPage";
import AddBunkPage from "../screens/pages/shops/bunks/AddBunkPage";
import BunkPage from "../screens/pages/shops/bunks/bunkPage";
import FuelHistoryPage from "../screens/pages/shops/bunks/FuelHistoryPage";
import AddServiceShopPage from "../screens/pages/shops/services/AddServiceShopPage";
import ServiceHistoryPage from "../screens/pages/shops/services/ServiceHistoryPage";
import ServiceShopPage from "../screens/pages/shops/services/ServiceShopPage";
import ViewStaffDetail from "../screens/pages/staff/ViewStaffDetail";
import AddServicePage from "../screens/pages/Vehicles/service/AddServicePage";
import ServicePage from "../screens/pages/Vehicles/service/ServicePage";

// --- MATERIAL SHOP IMPORTS ---
import MaterialManagement from "../screens/pages/shops/material/MaterialManagement";
import MaterialHistoryPage from "../screens/pages/shops/material/MaterialHistoryPage";
import StockInventory from "../screens/pages/stock/StockInventory";
import AddProductPage from "../screens/pages/stock/AddProductPage";
import ProductionHistoryPage from "../screens/pages/stock/ProductionHistoryPage";
import CustomerHub from "../screens/pages/customers/CustomerPage";
import CustomerDetails from "../screens/pages/customers/LedgerDetail";
import CallLogHistoryPage from "../screens/pages/customers/CallLogHistoryPage";
import BusinessNotepad from "../screens/pages/notepage/BusinessNotepad";
import NotepadHistory from "../screens/pages/notepage/NotepadHistory";
import AddInvoice from "../screens/pages/invoices/AddInvoice";
import InvoiceHistory from "../screens/pages/invoices/InvoiceHistory";
import SettingsPage from "../screens/pages/settings/SettingsPage";
import NotificationPage from "../screens/pages/notifications/NotificationPage";
import DailyAttendance from "../screens/pages/staff/DailyAttendance";

// --- CUSTOMER & LEDGER IMPORTS ---


const privateRoutes = [
  {
    path: "/",
    element: <Navigate to={"/landing"} />,
  },
  {
    path: "/notifications",
    element: <NotificationPage />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/vehicles",
    element: <VehicleList />,
  },
  {
    path: "/add-vehicle",
    element: <AddVehicle />,
  },
  {
    path: "/view-vehicle/:hashId",
    element: <ViewVehicle />,
  },
  {
    path: "/driver/view/:id",
    element: <ViewStaffDetail />
  },
  {
    path: "/profile",
    element: <ProfilePage />,
  },
  {
    path: "/vehicles/fuel",
    element: <FuelPage />,
  },
  {
    path: "/vehicles/fuel/add",
    element: <AddFuelPage />,
  },
  // --- BUNK ROUTES ---
  {
    path: "/shop/bunks",
    element: <BunkPage />,
  },
  {
    path: "/shop/bunks/add",
    element: <AddBunkPage />,
  },
  {
    path: "/shop/bunks/history",
    element: <FuelHistoryPage />,
  },
  // --- SERVICE SHOP ROUTES ---
  {
    path: "/shop/services",
    element: <ServiceShopPage />,
  },
  {
    path: "/shop/services/add",
    element: <AddServiceShopPage />,
  },
  {
    path: "/shop/services/history",
    element: <ServiceHistoryPage />,
  },
  {
    path: "/shop/materials",
    element: <MaterialManagement />,
  },
  {
    path: "/shop/materials/history",
    element: <MaterialHistoryPage />,
  },
  // --- CUSTOMER ROUTES ---
  {
    path: "/customers",
    element: <CustomerHub />, // The main grid/list of clients
  },
  {
    path: "/customer/details/:id",
    element: <CustomerDetails />, // The individual ledger view
  },
  {
    path: "/call-logs",
    element: <CallLogHistoryPage />,
  },
  // --- STAFF & OTHERS ---
  {
    path: "/driver/add",
    element: <AddDriverPage />,
  },
  {
    path: "/banks",
    element: <Banks />,
  },
  {
    path: "/staff",
    element: <Staff />,
  },
  {
    path: "/staff/attendance",
    element: <DailyAttendance />,
  },
  {
    path: "/shop",
    element: <ShopPage />,
  },
  {
    path: "/transactions",
    element: <TransactionsPage />,
  },
  {
    path: "/vehicles/services",
    element: <ServicePage />,
  },
  {
    path: "/vehicles/services/add",
    element: <AddServicePage />,
  },
  {
    path: "/contact",
    element: <ContactPage />,
  },
  {
    path: "/inventory/history",
    element: <ProductionHistoryPage />,
  },
  {
    path: "/inventory/add",
    element: <AddProductPage />,
  },
  {
    path: "/notepad",
    element: <BusinessNotepad />,
  },
  {
    path: "/view-notepad",
    element: <NotepadHistory />,
  },
  {
    path: "/invoices/add",
    element: <AddInvoice />,
  },
  {
    path: "/invoices/history",
    element: <InvoiceHistory />,
  },
  {
    path: "/stock",
    element: <StockInventory />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

const publicRoutes = [
  {
    path: "/landing",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password/:token", element: <ResetPassword /> },
];

export { privateRoutes, publicRoutes };