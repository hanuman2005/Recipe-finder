import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext";

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

const Wrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 30px;
  text-align: center;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 10px 0;
    letter-spacing: -0.5px;
  }

  p {
    font-size: 1.1rem;
    margin: 0;
    opacity: 0.9;
    font-weight: 300;
  }
`;

const AlertBox = styled.div`
  margin: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const AlertError = styled(AlertBox)`
  background-color: #fee;
  color: #c33;
  border-left: 4px solid #c33;
`;

const AlertSuccess = styled(AlertBox)`
  background-color: #efe;
  color: #3c3;
  border-left: 4px solid #3c3;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 1;
  }
`;

const Form = styled.form`
  padding: 30px;
`;

const FormSection = styled.div`
  margin-bottom: 35px;
  padding-bottom: 35px;
  border-bottom: 2px solid #f0f0f0;

  &:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 3px solid #667eea;
  display: inline-block;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    font-size: 0.95rem;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.3s ease;
  background-color: #fafafa;

  &:focus {
    outline: none;
    border-color: #667eea;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #999;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.3s ease;
  background-color: #fafafa;

  &:focus {
    outline: none;
    border-color: #667eea;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: all 0.3s ease;
  background-color: #fafafa;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #667eea;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #999;
  }
`;

const HintText = styled.small`
  display: block;
  margin-top: 6px;
  color: #666;
  font-size: 0.85rem;
  font-style: italic;
`;

const ImagePreviewWrapper = styled.div`
  position: relative;
`;

const ImagePreview = styled.div`
  margin-top: 12px;
  border-radius: 6px;
  overflow: hidden;
  background: #f0f0f0;
  max-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const BtnPrimary = styled.button`
  flex: 1;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const BtnSecondary = styled.button`
  flex: 1;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  background-color: #e0e0e0;
  color: #333;

  &:hover {
    background-color: #d0d0d0;
    transform: translateY(-2px);
  }
`;

const UploadRecipe = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [recipe, setRecipe] = useState({
    title: "",
    description: "",
    image: "",
    ingredients: "",
    steps: "",
    category: "",
    state: "",
    benefits: "",
    recommendedHotels: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipe({ ...recipe, [name]: value });
  };

  const validateForm = () => {
    if (!recipe.title.trim()) return "Title is required";
    if (!recipe.description.trim()) return "Description is required";
    if (!recipe.image.trim()) return "Image URL is required";
    if (!recipe.ingredients.trim()) return "Ingredients are required";
    if (!recipe.steps.trim()) return "Steps are required";
    if (!recipe.category.trim()) return "Category is required";
    if (!recipe.state.trim()) return "State/Region is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("You must be logged in to add a recipe!");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...recipe,
          ingredients: recipe.ingredients
            .split(",")
            .map((i) => i.trim())
            .filter((i) => i),
          steps: recipe.steps
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
          recommendedHotels: recipe.recommendedHotels
            .split("\n")
            .map((hotel) => {
              const [name, location, rating] = hotel.split(",");
              return {
                name: name?.trim(),
                location: location?.trim(),
                rating: parseFloat(rating) || 0,
              };
            })
            .filter((h) => h.name && h.location),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload recipe");
      }

      setSuccess("✅ Recipe uploaded successfully! Redirecting...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Wrapper>
        {/* Header */}
        <Header>
          <h1>🍳 Upload Your Recipe</h1>
          <p>Share your favorite recipe with the community</p>
        </Header>

        {/* Error Alert */}
        {error && (
          <AlertError>
            <span>{error}</span>
            <CloseBtn onClick={() => setError("")}>×</CloseBtn>
          </AlertError>
        )}

        {/* Success Alert */}
        {success && (
          <AlertSuccess>
            <span>{success}</span>
          </AlertSuccess>
        )}

        {/* Form */}
        <Form onSubmit={handleSubmit}>
          {/* Section 1: Basic Info */}
          <FormSection>
            <SectionTitle>📝 Basic Information</SectionTitle>

            <FormGroup>
              <label htmlFor="title">Recipe Title *</label>
              <Input
                id="title"
                type="text"
                name="title"
                placeholder="e.g., Homemade Pasta Carbonara"
                value={recipe.title}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="description">Description *</label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your recipe, its origin, and why it's special..."
                value={recipe.description}
                onChange={handleChange}
                rows="4"
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="image">Image URL *</label>
              <ImagePreviewWrapper>
                <Input
                  id="image"
                  type="text"
                  name="image"
                  placeholder="https://example.com/recipe.jpg"
                  value={recipe.image}
                  onChange={handleChange}
                />
                {recipe.image && (
                  <ImagePreview>
                    <img
                      src={recipe.image}
                      alt="Recipe"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </ImagePreview>
                )}
              </ImagePreviewWrapper>
            </FormGroup>
          </FormSection>

          {/* Section 2: Recipe Details */}
          <FormSection>
            <SectionTitle>🏷️ Recipe Details</SectionTitle>

            <FormRow>
              <FormGroup>
                <label htmlFor="category">Category *</label>
                <Select
                  id="category"
                  name="category"
                  value={recipe.category}
                  onChange={handleChange}
                >
                  <option value="">Select a category</option>
                  <option value="Italian">Italian</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Asian">Asian</option>
                  <option value="Indian">Indian</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Other">Other</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <label htmlFor="state">State/Region *</label>
                <Input
                  id="state"
                  type="text"
                  name="state"
                  placeholder="e.g., Maharashtra, California"
                  value={recipe.state}
                  onChange={handleChange}
                />
              </FormGroup>
            </FormRow>
          </FormSection>

          {/* Section 3: Ingredients & Steps */}
          <FormSection>
            <SectionTitle>🥘 Ingredients & Instructions</SectionTitle>

            <FormGroup>
              <label htmlFor="ingredients">
                Ingredients (comma separated) *
              </label>
              <Textarea
                id="ingredients"
                name="ingredients"
                placeholder="e.g., 2 cups flour, 1 egg, 1 tsp salt, 2 tbsp butter"
                value={recipe.ingredients}
                onChange={handleChange}
                rows="4"
              />
              <HintText>💡 Separate each ingredient with a comma</HintText>
            </FormGroup>

            <FormGroup>
              <label htmlFor="steps">
                Steps/Instructions (comma separated) *
              </label>
              <Textarea
                id="steps"
                name="steps"
                placeholder="e.g., Preheat oven to 350°F, Mix dry ingredients, Add wet ingredients, Bake for 30 minutes"
                value={recipe.steps}
                onChange={handleChange}
                rows="4"
              />
              <HintText>💡 Separate each step with a comma</HintText>
            </FormGroup>
          </FormSection>

          {/* Section 4: Additional Info */}
          <FormSection>
            <SectionTitle>⭐ Additional Information</SectionTitle>

            <FormGroup>
              <label htmlFor="benefits">Health Benefits</label>
              <Textarea
                id="benefits"
                name="benefits"
                placeholder="List the health benefits of this recipe..."
                value={recipe.benefits}
                onChange={handleChange}
                rows="3"
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="recommendedHotels">
                Recommended Restaurants (Optional)
              </label>
              <Textarea
                id="recommendedHotels"
                name="recommendedHotels"
                placeholder="Format: Name,Location,Rating (on separate lines)&#10;e.g.,&#10;La Dolce Vita,Rome,4.8&#10;Olive Garden,New York,4.5"
                value={recipe.recommendedHotels}
                onChange={handleChange}
                rows="3"
              />
              <HintText>
                💡 Format: Name,Location,Rating (each on a new line)
              </HintText>
            </FormGroup>
          </FormSection>

          {/* Submit Button */}
          <FormActions>
            <BtnPrimary type="submit" disabled={loading}>
              {loading ? "⏳ Uploading..." : "🚀 Upload Recipe"}
            </BtnPrimary>
            <BtnSecondary type="button" onClick={() => navigate("/")}>
              Cancel
            </BtnSecondary>
          </FormActions>
        </Form>
      </Wrapper>
    </Container>
  );
};

export default UploadRecipe;
