import { useRoutes } from "react-router-dom";
import Layout from "../layout/layout";
import { privateRoutes, publicRoutes } from "./allRoute";
import { ProtectedRoute, PublicRoute } from "./middleware";

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

    // 🌍 Public Routes (No Token Needed)
    {
      element: <PublicRoute />,
      children: publicRoutes,
    },
  ]);

  return routes;
};
