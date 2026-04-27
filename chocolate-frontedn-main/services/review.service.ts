import axios from "axios";
import { Review, ReviewList } from "../types/review.types";
import {
  CreateReviewInput,
  UpdateReviewInput,
} from "../validations/review.validation";

const API_URL = "http://localhost:5001/api/reviews";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const reviewApiService = {
  async getReviews(
    page = 1,
    limit = 10,
    orderId?: string,
    minRating?: number,
    maxRating?: number,
    userId?: string
  ) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (orderId) params.append("orderId", orderId);
    if (minRating) params.append("minRating", minRating.toString());
    if (maxRating) params.append("maxRating", maxRating.toString());
    if (userId) params.append("userId", userId);

    const res = await axios.get(`${API_URL}?${params}`, getAuthHeaders());
    return res.data as ReviewList;
  },

  async createReview(data: CreateReviewInput) {
    const res = await axios.post(API_URL, data, getAuthHeaders());
    return res.data as Review;
  },

  async getReviewById(id: string) {
    const res = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return res.data as Review;
  },

  async updateReview(id: string, data: UpdateReviewInput) {
    const res = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
    return res.data as Review;
  },

  async softDeleteReview(id: string) {
    const res = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return res.data;
  },

  async hardDeleteReview(id: string) {
    const res = await axios.delete(`${API_URL}/hard/${id}`, getAuthHeaders());
    return res.data;
  },
};
