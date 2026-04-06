import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../services/api";

export const useRecipes = (filters = {}, page = 1, limit = 10) => {
  const params = new URLSearchParams();

  if (filters.equipment?.length > 0) {
    params.append("equipment", filters.equipment.join(","));
  }
  if (filters.maxPrepTime) params.append("maxPrepTime", filters.maxPrepTime);
  if (filters.maxCookTime) params.append("maxCookTime", filters.maxCookTime);
  if (filters.difficulty) params.append("difficulty", filters.difficulty);
  if (filters.minRating) params.append("minRating", filters.minRating);
  if (filters.search) params.append("search", filters.search);
  params.append("page", page);
  params.append("limit", limit);

  return useQuery({
    queryKey: ["recipes", filters, page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/recipes?${params.toString()}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRecipeById = (id) => {
  return useQuery({
    queryKey: ["recipe", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/recipes/${id}`);
      return data.data || data;
    },
    enabled: !!id,
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipe) => {
      const { data } = await apiClient.post("/recipes", recipe);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
};
