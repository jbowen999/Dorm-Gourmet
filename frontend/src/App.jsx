import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import HomePage from "./pages/HomePage.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import RecipeDetail from "./pages/RecipeDetail.jsx";
import RecipeForm from "./pages/RecipeForm.jsx";
import RecipeList from "./pages/RecipeList.jsx";
import Register from "./pages/Register.jsx";
import ReviewDetailPage from "./pages/ReviewDetailPage.jsx";
import ReviewFormPage from "./pages/ReviewFormPage.jsx";
import ReviewsPage from "./pages/ReviewsPage.jsx";

/** Wraps a page so logged-out users are sent to /login and brought back after. */
const protect = (page) => <RequireAuth>{page}</RequireAuth>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />

        {/* Recipes (Jerith) */}
        <Route path="recipes" element={<RecipeList />} />
        <Route path="recipes/new" element={protect(<RecipeForm />)} />
        <Route path="recipes/:id" element={<RecipeDetail />} />
        <Route path="recipes/:id/edit" element={protect(<RecipeForm />)} />

        {/* Reviews (Julian) */}
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="reviews/new" element={protect(<ReviewFormPage />)} />
        <Route path="reviews/:id" element={<ReviewDetailPage />} />
        <Route path="reviews/:id/edit" element={protect(<ReviewFormPage />)} />

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
