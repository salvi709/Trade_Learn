export type FeedbackType = 'experience' | 'learning' | 'product' | 'mentor';

export type FeedbackCategory =
  | 'suggestion'
  | 'bug_report'
  | 'feature_request'
  | 'general'
  | 'compliment'
  | 'overall_experience'
  | 'lesson_understanding'
  | 'mentor_response';

export type FeedbackStatus = 'new' | 'under_review' | 'planned' | 'resolved' | 'rejected';

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  category: FeedbackCategory;
  rating?: number | null; // 1-5 for experience; 3=Yes, 2=Somewhat, 1=Not yet for learning; 1=thumbs up, -1=thumbs down for mentor
  ratingLabel?: string | null;
  comment?: string | null;
  selectedReasons?: string[];
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  isAnonymous: boolean;
  lessonId?: string | null;
  lessonTitle?: string | null;
  stageId?: string | null;
  stageTitle?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  questionExcerpt?: string | null;
  attachmentUrl?: string | null;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string | null;
}

export interface CreateFeedbackInput {
  type: FeedbackType;
  category: FeedbackCategory;
  rating?: number | null;
  ratingLabel?: string | null;
  comment?: string | null;
  selectedReasons?: string[];
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  isAnonymous?: boolean;
  lessonId?: string | null;
  lessonTitle?: string | null;
  stageId?: string | null;
  stageTitle?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  questionExcerpt?: string | null;
  attachmentUrl?: string | null;
}

export interface FeedbackFilters {
  timeRange?: '7d' | '30d' | '90d' | 'all';
  type?: 'all' | FeedbackType;
  category?: 'all' | FeedbackCategory;
  rating?: 'all' | number;
  status?: 'all' | FeedbackStatus;
  search?: string;
  stageId?: string;
}

export interface FeedbackAnalyticsSummary {
  totalCount: number;
  averageRating: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  learningFeedbackCount: number;
  aiMentorFeedbackCount: number;
  aiMentorPositiveCount: number;
  aiMentorNegativeCount: number;
  openBugsCount: number;
  openFeaturesCount: number;
  ratingDistribution: Record<number, number>; // 1: n, 2: n, 3: n, 4: n, 5: n
  categoryDistribution: Record<string, number>;
  stageDistribution: Record<string, { total: number; positive: number; needsImprovement: number }>;
  topComplaints: { reason: string; count: number }[];
  topRequestedImprovements: { reason: string; count: number }[];
  recentTrends: { date: string; positive: number; neutral: number; negative: number }[];
}
