import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { DishesPage } from "../pages/DishesPage";
import { GuestsPage } from "../pages/GuestsPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { MealsPage } from "../pages/MealsPage";
import { SignupPage } from "../pages/SignupPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/guests", element: <GuestsPage /> },
          { path: "/dishes", element: <DishesPage /> },
          { path: "/meals", element: <MealsPage /> },
        ],
      },
    ],
  },
]);
