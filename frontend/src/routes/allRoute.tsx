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
// --- IMPORT THE NEW VIEW DETAIL COMPONENT ---
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


const privateRoutes = [
  {
    path: "/",
    element: <Navigate to={"/landing"} />,
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
  // --- ADDED THIS ROUTE TO MATCH YOUR NAVIGATE CALL ---
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
    path: "/shop/services/history",
    element: <ServiceHistoryPage />,
  },
  {
    path: "/shop/bunks/history",
    element: <FuelHistoryPage />,
  },
  {
    path: "/vehicles/fuel/add",
    element: <AddFuelPage />,
  },
  {
    path: "/shop",
    element: <ShopPage />,
  },
  {
    path: "/shop/bunks",
    element: <BunkPage />,
  },
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
    path: "/shop/services",
    element: <ServiceShopPage />,
  },
  {
    path: "/transactions",
    element: <TransactionsPage transactions={[]} />,
  },
  {
    path: "/shop/bunks/add",
    element: <AddBunkPage />,
  },
  {
    path: "/shop/services/add",
    element: <AddServiceShopPage />,
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
