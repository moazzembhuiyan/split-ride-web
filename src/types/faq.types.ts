export type FaqAudience = "user" | "provider";

export interface Faq {
  _id: string;
  id: string;
  audience: FaqAudience;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqPayload {
  audience: FaqAudience;
  question: string;
  answer: string;
}

export interface UpdateFaqPayload {
  question?: string;
  answer?: string;
}

export interface GetFaqQuery {
  audience?: FaqAudience;
}
