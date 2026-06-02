import { createBrowserRouter } from "react-router-dom";

import DefaultLayout from "./components/DefaultLayout/DefaultLayout.jsx";
import Error from "./components/Error/Error.jsx";
import RootApplication from "./components/RootApplication/RootApplication.jsx";
import Authentication from "./view/Authentication/Authentication.jsx";
import Credit from "./view/Credit/Credit.jsx";
import Dashboard from "./view/Dashboard/Dashboard.jsx";
import Debts from "./view/Debts/Debts.jsx";
import Expenses from "./view/Expenses/Expenses.jsx";
import Income from "./view/Income/Income.jsx";
import Settings from "./view/Settings/Settings.jsx";

const route = createBrowserRouter([
  {
    path: "/",
    element: <RootApplication />,
    children: [
      {
        path: "/",
        element: <DefaultLayout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: "expenses",
            element: <Expenses />,
          },
          {
            path: "income",
            element: <Income />,
          },
          {
            path: "debts",
            element: <Debts />,
          },
          {
            path: "credit",
            element: <Credit />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
        ],
      },
      {
        path: "login",
        element: <Authentication />,
      },
    ],
  },
  {
    path: "*",
    element: <Error />,
  },
]);

export default route;
