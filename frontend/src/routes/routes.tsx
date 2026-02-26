import { useRoutes } from "react-router-dom";
import Layout from "../layout/layout";
import { privateRoutes, publicRoutes } from "./allRoute";
import { ProtectedRoute, PublicRoute } from "./middleware";
import ViewInvoicePublic from "../screens/pages/invoices/ViewInvoicePublic";

export const AppRoutes = () => {
  const routes = useRoutes([
    // 🔐 Protected Routes (Need Token)
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: "/",
          element: <Layout />,
          children: privateRoutes,
        },
      ],
    },

    // 🌍 Public Routes (No Token Needed — redirects logged-in users)
    {
      element: <PublicRoute />,
      children: publicRoutes,
    },

    // 📄 Open Routes (Accessible by anyone, no redirect)
    {
      path: "/view/invoice/*",
      element: <ViewInvoicePublic />,
    },
  ]);

  return routes;
};
