import { useParams } from 'react-router-dom'
import RecipeReviews from '../components/RecipeReviews.jsx'

// Placeholder: to be built next. Keep <RecipeReviews> at the bottom of the
// finished page; it renders the reviews section for this recipe.
export default function RecipeDetail() {
  const { id } = useParams()
  return (
    <>
      <h1>Recipe</h1>
      <RecipeReviews recipeId={id} />
    </>
  )
}
