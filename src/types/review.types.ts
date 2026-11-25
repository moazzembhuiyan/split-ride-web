export interface Review {
  _id: string;
  id: string;
  user: string;
  reviewer: string;
  comment: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewPayload {
  user: string;
  comment: string;
  rating: number;
}
