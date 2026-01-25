import { Navigate } from "react-router-dom";
import { Dashboard } from "../screens/pages/dashBoard";
import NotFound from "../screens/NotFound";
import VehicleList from "../screens/pages/Vehicles/Vehicle";
import Login from "../screens/auth/Login";
import ProfilePage from "../screens/pages/profiles/profile";
import AddVehicle from "../screens/pages/Vehicles/AddVehicle";
import ViewVehicle from "../screens/pages/Vehicles/viewVehicle";
import FuelPage from "../screens/pages/Vehicles/Fuel/FuelPage";
import ShopPage from "../screens/pages/shops/ShopPage";
import BunkList from "../screens/pages/shops/bunkPage";
import AddFuelPage from "../screens/pages/Vehicles/Fuel/AddFuelPage";
import BunkPage from "../screens/pages/shops/bunkPage";
import AddBunkPage from "../screens/pages/shops/AddBunkPage";
import Banks from "../screens/pages/banks/banks";
import TransactionsPage from "../screens/pages/banks/TransactionsPage";
import LandingPage from "../screens/pages/landing/LandingPage";
import SignUp from "../screens/auth/SignUp";
import ResetPassword from "../screens/auth/ResetPassword";
import ForgotPassword from "../screens/auth/ForgotPassword";
import Staff from "../screens/pages/staff/staff";
import AddDriverPage from "../screens/pages/staff/AddDriverPage";


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
  // {
  //   path: "/driver/view/:hashId",
  //   element: <ViewDriver />
  // },
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
  {
    path: "/shop",
    element: <ShopPage />,
  },
  {
    path: "/shop/bunks",
    element: <BunkList />,
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
    path: "*",
    element: <NotFound />,
  },

  {
    path: "/shop/bunks",
    element: <BunkPage />,
  },
  {
    path: "/transactions",
    element: <TransactionsPage transactions={[]} />,
  },

  {
    path: "/shop/bunks/add",
    element: <AddBunkPage />,
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