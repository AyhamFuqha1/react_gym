import { createBrowserRouter, Navigate } from "react-router-dom";
import { Login } from "../pages/login-password/Login";
import { ForgotPassword } from "../pages/login-password/ForgotPassword";
import { ResetPassword } from "../pages/login-password/ResetPassword";
import { AdminLayout } from "../layouts/AdminLayout";
import { CoachLayout } from "../layouts/CoachLayout";
import { AdminDashboard } from "../pages/web-admin-coatch/admin/AdminDashboard";
import { MembersManagement } from "../pages/web-admin-coatch/MembersManagement";
import { MemberDetails } from "../pages/web-admin-coatch/MemberDetails";
import { ContentManagement } from "../pages/web-admin-coatch/ContentManagement";
import { InjuryPrevention } from "../pages/web-admin-coatch/InjuryPrevention";
import { AdminFeedback } from "../pages/web-admin-coatch/admin/AdminFeedback";
import { NewsManagement } from "../pages/web-admin-coatch/NewsManagement";
import { ExercisesPage } from "../pages/web-admin-coatch/ExercisesPage";
import { NutritionLibrary } from "../pages/web-admin-coatch/NutritionLibrary";
import { SubscriptionsManagement } from "../pages/web-admin-coatch/admin/subscriptions-management";
import { NutritionFoods } from "../pages/web-admin-coatch/NutritionFoods";

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
      {
        path: "subscriptions",
        element: <SubscriptionsManagement />,
      },
    ],
  },
  {
    path: "/dashboard/manager",
    element: <DashboardMessage title="Navigated to Manager Dashboard" />,
  },
  {
    path: "/dashboard/coach",
    element: <CoachLayout />,
    children: [
      {
        index: true,
        element: <DashboardMessage title="Coach Dashboard" />,
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
        path: "news",
        element: <NewsManagement />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);