import { createBrowserRouter } from "react-router-dom";
import { Login } from "../pages/login-password/Login";
import { ForgotPassword } from "../pages/login-password/ForgotPassword";
import { ResetPassword } from "../pages/login-password/ResetPassword";
import { WebProfile } from "../pages/web-user/WebProfile";

function DashboardMessage({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FB] p-8">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center max-w-lg w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-500">The real dashboard will be added here later.</p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/dashboard/admin",
    element: <DashboardMessage title="Navigated to Admin Dashboard" />,
  },
  {
    path: "/dashboard/manager",
    element: <DashboardMessage title="Navigated to Manager Dashboard" />,
  },
  {
    path: "/dashboard/coach",
    element: <DashboardMessage title="Navigated to Coach Dashboard" />,
  },
  {
  path: "/dashboard/user",
  element: <WebProfile />,
  },
]);