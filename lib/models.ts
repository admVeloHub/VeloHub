export interface Article {
  _id?: string;
  title: string;
  content: string;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VeloNews {
  _id?: string;
  title: string;
  content: string;
  is_critical: 'Y' | 'N';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatbotFAQ {
  _id?: string;
  topic: string;
  context: string;
  keywords?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  _id?: string;
  key: string;
  title: string;
  articles: Article[];
}

export interface VelotaxDB {
  [key: string]: Category;
}
