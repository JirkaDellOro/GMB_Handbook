export interface ModuleComponent {
  label?: string;
  name?: string;
  language?: string[];
  contact_hours?: string | number;
  self_study_hours?: string | number;
  class_size?: string | number;
}

export interface ComponentSection { component?: string; items?: string[] }
export interface LearningOutcome { category?: string; items?: string[] }
export interface Assessment {
  component?: string;
  description?: string;
  graded_assessment?: boolean | null;
  credits?: string | number | null;
}
export interface Lecturer { component?: string; names?: string[] }
export interface ReadingItem { component?: string; reference?: string }

export interface ModuleData {
  id: string;
  title: string;
  module_code?: string | null;
  semester?: number | string | null;
  workload_hours?: number | string | null;
  credits?: number | string | null;
  frequency?: string | null;
  duration?: number | string | null;
  components?: ModuleComponent[];
  learning_outcomes_intro?: string;
  learning_outcomes?: LearningOutcome[];
  individual_component_content?: ComponentSection[];
  teaching_methods?: ComponentSection[];
  prerequisites?: ComponentSection[];
  assessment?: Assessment[];
  applicability?: string[];
  responsible_person?: string | null;
  lecturers?: Lecturer[];
  reading_list?: ReadingItem[];
  extraction_note?: string;
}

export interface SemesterGroup {
  title: string;
  modules: string[];
}

export interface CurriculumModulePosition { column: string; block: number | null; style?: 'project' | 'internship'; span?: number; }
export interface CurriculumData { columns: string[]; studyStages: { title: string; firstSemester: number; lastSemester: number }[]; modules: Record<string, CurriculumModulePosition>; }
