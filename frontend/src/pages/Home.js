import React, { useContext } from "react";
import styled from "styled-components";
import RecipeCard from "../components/RecipeCard";
import RegionSelector from "../components/RegionSelector";
import { Link } from "react-router-dom";
import { RecipeContext } from "../context/RecipeContext";

const BannerSection = styled.div`
  background-image: url("https://d1tgh8fmlzexmh.cloudfront.net/ccbp-responsive-website/foodmunch-banner-bg.png");
  height: 100vh;
  background-size: cover;
  display: flex;
  justify-content: center;
  flex-direction: column;
  text-align: center;
`;

const BannerHeading = styled.h1`
  color: white;
  font-family: "Roboto";
  font-size: 45px;
  font-weight: 300;
  margin-bottom: 1rem;
`;

const BannerCaption = styled.p`
  color: #f5f7fa;
  font-family: "Roboto";
  font-size: 24px;
  font-weight: 300;
  margin-bottom: 1rem;
`;

const RegionSelectorWrapper = styled.div`
  padding: 2rem 0;
  background: #f8f9fa;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const ExploreRecipesSection = styled.div`
  padding: 3rem 0;
  background-color: white;
`;

const MenuSectionHeading = styled.h1`
  color: #183b56;
  font-family: "Roboto";
  font-size: 28px;
  font-weight: 700;
`;

const MenuItemCard = styled.div`
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
`;

const CategoryEmoji = styled.div`
  font-size: 3rem;
  margin-bottom: 10px;
`;

const MenuCardTitle = styled.h1`
  color: #333;
  font-family: "Roboto";
  font-size: 18px;
  font-weight: 500;
  margin: 0;
`;

const RecipeCount = styled.p`
  color: #666;
  margin-bottom: 10px;
  font-size: 0.95rem;
`;

const MenuItemLink = styled.div`
  color: #d0b200;
  font-family: "Roboto";
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CategorySection = styled.div`
  background: #f8f9fa;
  padding: 3rem 0;
`;

const HealthyRecipeSection = styled.div`
  background-color: #f9fbfe;
  padding: 3rem 0;
`;

const EmojiLarge = styled.div`
  font-size: 5rem;
  margin-bottom: 20px;
  text-align: center;
`;

const HealthyRecipeSectionHeading = styled.h1`
  color: #183b56;
  font-family: "Roboto";
  font-size: 28px;
  font-weight: 700;
`;

const HealthyRecipeSectionDescription = styled.p`
  color: #5a7184;
  font-family: "Roboto";
  font-size: 16px;
  line-height: 1.6;
`;

const StatsSection = styled.div`
  background: #fff3cd;
  border-top: 3px solid #ffc107;
  border-bottom: 3px solid #ffc107;
  padding: 3rem 0;
`;

const StatNumber = styled.h2`
  color: #d48806;
  font-size: 2rem;
  margin-bottom: 10px;
`;

const StatLabel = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 0;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  align-items: ${props => props.alignItems || 'stretch'};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Col = styled.div`
  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const RecipeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 3rem 0;

  .spinner-border {
    border: 0.25em solid rgba(0, 0, 0, 0.1);
    border-right-color: #ffc107;
    animation: spinner-border 0.75s linear infinite;
  }

  @keyframes spinner-border {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Home = () => {
  const { recipes = [], loading, error } = useContext(RecipeContext);

  // Get all categories from recipes - with safety check
  const categories = recipes && Array.isArray(recipes) 
    ? [...new Set(recipes.map(r => r.category))] 
    : [];

  const icons = {
    'Breakfast': '🌅',
    'Lunch': '🍱',
    'Dinner': '🌙',
    'Dessert': '🍰',
    'Snacks': '🥨',
    'Non-Vegetarian': '🍗'
  };

  return (
    <div>
      {/* ==================== BANNER SECTION ==================== */}
      <BannerSection>
        <div>
          <BannerHeading>🍳 Get Delicious Food Recipes Anytime</BannerHeading>
          <BannerCaption>Eat Smart & Healthy</BannerCaption>
        </div>
      </BannerSection>

      {/* ==================== REGION SELECTOR ==================== */}
      <RegionSelectorWrapper>
        <Container>
          <RegionSelector />
        </Container>
      </RegionSelectorWrapper>

      {/* ==================== ALL RECIPES SECTION ==================== */}
      <ExploreRecipesSection>
        <Container>
          <div style={{ marginBottom: '2rem' }}>
            <MenuSectionHeading>
              📚 Explore Recipes
              {loading && <span style={{ color: '#999', fontSize: '0.8em' }}> (Loading...)</span>}
            </MenuSectionHeading>
            <p style={{ color: '#999' }}>Total Recipes: <strong>{recipes.length}</strong></p>
            {error && <div style={{ color: '#721c24', background: '#f8d7da', padding: '1rem', borderRadius: '4px' }}>{error}</div>}
          </div>

          {/* Display all recipes in a grid */}
          {!loading && recipes.length > 0 ? (
            <RecipeGrid>
              {recipes.map((recipe) => (
                <div key={recipe._id}>
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </RecipeGrid>
          ) : loading ? (
            <LoadingSpinner>
              <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem', margin: '0 auto' }}>
                <span style={{ visibility: 'hidden' }}>Loading...</span>
              </div>
              <p style={{ marginTop: '1rem' }}>Loading recipes...</p>
            </LoadingSpinner>
          ) : (
            <div style={{ background: '#d1ecf1', color: '#0c5460', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
              No recipes found. Try different filters!
            </div>
          )}
        </Container>
      </ExploreRecipesSection>

      {/* ==================== CATEGORY CARDS SECTION ==================== */}
      <CategorySection>
        <Container>
          <div style={{ marginBottom: '2rem' }}>
            <MenuSectionHeading>🍽️ Browse by Category</MenuSectionHeading>
            <p style={{ color: '#999' }}>Find recipes by meal type</p>
          </div>

          <RecipeGrid>
            {categories.map((category) => {
              const recipeCount = recipes.filter(r => r.category === category).length;

              return (
                <div key={category}>
                  <Link to={`/category/${category}`} style={{ textDecoration: 'none' }}>
                    <MenuItemCard>
                      <CategoryEmoji>
                        {icons[category] || '🍳'}
                      </CategoryEmoji>
                      <MenuCardTitle>
                        {category}
                      </MenuCardTitle>
                      <RecipeCount>
                        {recipeCount} recipes
                      </RecipeCount>
                      <MenuItemLink>
                        View All
                        <svg width="16px" height="16px" viewBox="0 0 16 16" fill="#d0b200" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '5px' }}>
                          <path
                            fillRule="evenodd"
                            d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z"
                          />
                        </svg>
                      </MenuItemLink>
                    </MenuItemCard>
                  </Link>
                </div>
              );
            })}
          </RecipeGrid>
        </Container>
      </CategorySection>

      {/* ==================== HEALTHY RECIPE SECTION ==================== */}
      <HealthyRecipeSection>
        <Container>
          <Row alignItems="center">
            <Col>
              <EmojiLarge>🥗</EmojiLarge>
            </Col>
            <Col>
              <HealthyRecipeSectionHeading>
                Fresh, Healthy, Organic, Delicious Ingredients
              </HealthyRecipeSectionHeading>
              <HealthyRecipeSectionDescription>
                Say goodbye to harmful chemicals and embrace the goodness of organic produce.
                Our platform offers a collection of fresh, healthy, and organic fruits and vegetables
                that bring the authentic flavors of nature to your kitchen. Pamper your body and taste
                buds with the purest ingredients, perfect for creating delicious and wholesome recipes that nourish
                both the body and soul. Share, cook, and enjoy the true gifts of Mother Nature with every dish!
              </HealthyRecipeSectionDescription>
              <Link to="/upload" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1rem', background: '#ffc107', color: '#333', borderRadius: '4px', textDecoration: 'none', fontWeight: '500' }}>
                📤 Share Your Recipe
              </Link>
            </Col>
          </Row>
        </Container>
      </HealthyRecipeSection>

      {/* ==================== STATS SECTION ==================== */}
      <StatsSection>
        <Container>
          <Row>
            <Col style={{ textAlign: 'center' }}>
              <StatNumber>{recipes?.length || 0}+</StatNumber>
              <StatLabel>Recipes Available</StatLabel>
            </Col>
            <Col style={{ textAlign: 'center' }}>
              <StatNumber>{categories.length}</StatNumber>
              <StatLabel>Categories</StatLabel>
            </Col>
            <Col style={{ textAlign: 'center' }}>
              <StatNumber>{Array.isArray(recipes) ? [...new Set(recipes.map(r => r.state))].length : 0}</StatNumber>
              <StatLabel>States Covered</StatLabel>
            </Col>
          </Row>
        </Container>
      </StatsSection>
    </div>
  );
};

export default Home;