import { createBrowserRouter, Navigate } from "react-router-dom";
import { Login } from "../pages/login-password/Login";
import { ForgotPassword } from "../pages/login-password/ForgotPassword";
import { ResetPassword } from "../pages/login-password/ResetPassword";
import { AdminLayout } from "../layouts/AdminLayout";
import { CoachLayout } from "../layouts/CoachLayout";
import { AdminDashboard } from "../pages/web-admin-coatch/admin/AdminDashboard";
import { CoachDashboard } from "../pages/web-admin-coatch/coach/CoachDashboard";
import { MembersManagement } from "../pages/web-admin-coatch/MembersManagement";
import { MemberDetails } from "../pages/web-admin-coatch/MemberDetails";
import { ContentManagement } from "../pages/web-admin-coatch/ContentManagement";
import { InjuryPrevention } from "../pages/web-admin-coatch/InjuryPrevention";
import { AdminFeedback } from "../pages/web-admin-coatch/admin/AdminFeedback";
import { NewsManagement } from "../pages/web-admin-coatch/NewsManagement";
import { ExercisesPage } from "../pages/web-admin-coatch/ExercisesPage";
import { NutritionLibrary } from "../pages/web-admin-coatch/NutritionLibrary";
import { SubscriptionsManagement } from "../pages/web-admin-coatch/admin/SubscriptionsManagement";
import { CoachesManagement } from "../pages/web-admin-coatch/admin/CoachesManagement";
import { NutritionFoods } from "../pages/web-admin-coatch/NutritionFoods";
import { AIPlanRequests } from "../pages/web-admin-coatch/coach/AIPlanRequests";
import AINutritionRequests from "../pages/web-admin-coatch/coach/AINutritionRequests";
import { AdminCoachSessions } from "../pages/web-admin-coatch/admin/AdminCoachSessions";
import { CoachSessions } from "../pages/web-admin-coatch/coach/CoachSessions";
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
        path: "coaches",
        element: <CoachesManagement />,
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
      {
        path: "coach-sessions",
        element: <AdminCoachSessions />,
      },
    ],
  },
  {
    path: "/dashboard/coach",
    element: <CoachLayout />,
    children: [
      {
        index: true,
        element: <CoachDashboard />,
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
      {
        path: "ai-plan-requests",
        element: <AIPlanRequests />,
      },
      {
        path: "ai-nutrition-requests",
        element: <AINutritionRequests />,
      },
      {
        path: "coach-sessions",
        element: <CoachSessions />,
      }
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
