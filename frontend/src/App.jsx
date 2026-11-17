import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import RecipeDetailPage from "./pages/RecipeDetailPage.jsx";
import RecipeFormPage from "./pages/RecipeFormPage.jsx";
import RecipesPage from "./pages/RecipesPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ReviewDetailPage from "./pages/ReviewDetailPage.jsx";
import ReviewFormPage from "./pages/ReviewFormPage.jsx";
import ReviewsPage from "./pages/ReviewsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />

        <Route path="recipes" element={<RecipesPage />} />
        <Route path="recipes/new" element={<RecipeFormPage />} />
        <Route path="recipes/:id" element={<RecipeDetailPage />} />
        <Route path="recipes/:id/edit" element={<RecipeFormPage />} />

        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="reviews/new" element={<ReviewFormPage />} />
        <Route path="reviews/:id" element={<ReviewDetailPage />} />
        <Route path="reviews/:id/edit" element={<ReviewFormPage />} />

        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
