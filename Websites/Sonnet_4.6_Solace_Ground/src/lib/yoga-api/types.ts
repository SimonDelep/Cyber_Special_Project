export type YogaPose = {
  id: number;
  english_name: string;
  sanskrit_name_adapted: string;
  sanskrit_name?: string;
  category_name?: string;
  translation_name?: string;
  pose_description: string;
  pose_benefits: string;
  url_png: string;
  url_svg: string;
  difficulty_level?: string;
};

export type YogaCategory = {
  id: number;
  category_name: string;
  category_description: string;
  poses: YogaPose[];
};

export type YogaLevel = 'beginner' | 'intermediate' | 'expert';
