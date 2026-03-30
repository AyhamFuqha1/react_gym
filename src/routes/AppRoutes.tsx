import { createBrowserRouter, Navigate } from "react-router-dom";
import { Login } from "../pages/login-password/Login";
import { ForgotPassword } from "../pages/login-password/ForgotPassword";
import { ResetPassword } from "../pages/login-password/ResetPassword";
import { WebProfile } from "../pages/web-user/WebProfile";
import { AdminLayout } from "../layouts/AdminLayout";
import { AdminDashboard } from "../pages/web-admin/AdminDashboard";
import { MembersManagement } from "../pages/web-admin/MembersManagement";
import { MemberDetails } from "../pages/web-admin/MemberDetails";
import { ContentManagement } from "../pages/web-admin/ContentManagement";
import { InjuryPrevention } from "../pages/web-admin/InjuryPrevention";
import { AdminFeedback } from "../pages/web-admin/AdminFeedback";
import { NewsManagement } from "../pages/web-admin/NewsManagement";
import { ExercisesPage } from "../pages/web-admin/ExercisesPage";
import { NutritionLibrary } from "../pages/web-admin/NutritionLibrary";
import { NutritionFoods } from "../pages/web-admin/NutritionFoods";

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
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: "members",
        element: <MembersManagement />,
      },
      {
        path: "members/:memberId",
        element: <MemberDetails />,
      },
      {
        path: "content",
        element: <ContentManagement />,
      },
      {
        path: "nutrition",
        element: <NutritionLibrary />,
      },
      {
        path: "nutrition/:categoryId",
        element: <NutritionFoods />,
      },
      {
        path: "exercises/:categoryId",
        element: <ExercisesPage />,
      },
      {
        path: "injury-prevention",
        element: <InjuryPrevention />,
      },
      {
        path: "feedback",
        element: <AdminFeedback />,
      },
      {
        path: "news",
        element: <NewsManagement />,
      },
    ],
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
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);