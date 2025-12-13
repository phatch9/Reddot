// App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Suspense, lazy } from "react";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  Outlet,
} from "react-router-dom";

import AppLayout from "./components/MainLayout";
import { AuthProvider } from "./components/AuthContext";
import Error from "./components/Error";
import Loader from "./components/Loader";
import RequireAuth from "./components/Route";
import Login from "./pages/Signin/Login";
import Signup from "./pages/Signup/Signup";

// Lazy-loaded pages (TSX)
const Feed = lazy(() => import("./pages/newfeed/Newfeed"));
const Profile = lazy(() => import("./pages/UserProfile/Profile"));
const FullPost = lazy(() => import("./pages/Post/FullPost"));
const Inbox = lazy(() => import("./pages/Inbox/Inbox"));
const SavedPosts = lazy(() => import("./pages/Saved/SavedPost"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <Error />,
    children: [
      {
        path: "/",
        element: <Outlet />,
        children: [
          { path: "/", element: <Navigate to="/all" /> },
          { path: "/:feedName", element: <Feed /> },
          { path: "/post/:postId", element: <FullPost /> },
        ],
      },
      { path: "/u/:username", element: <Profile /> },
      // Route removed: component not present. Add back when implemented.
      {
        path: "/saved",
        element: (
          <RequireAuth>
            <SavedPosts />
          </RequireAuth>
        ),
      },
      {
        path: "/inbox",
        element: (
          <RequireAuth>
            <Inbox />
          </RequireAuth>
        ),
      },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
]);

// React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120000, // 2 minutes
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <AuthProvider>
        <Suspense fallback={<Loader />}>
          <RouterProvider router={router} fallbackElement={<Loader />} />
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
