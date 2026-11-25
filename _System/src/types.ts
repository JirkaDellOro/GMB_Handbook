export interface ModuleComponent {
  label?: string;
  name?: string;
  language?: string[];
  contact_hours?: string | number;
  self_study_hours?: string | number;
  class_size?: string | number;
  course_type?: string | null;
  credit_points?: string | number | null;
}
export interface ComponentSection { component?: string; items?: string[] }
export interface LearningOutcome { category?: string; items?: string[] }
export interface Assessment {
  component?: string;
  code?: string | null;
  description?: string;
  graded_assessment?: boolean | null;
  credits?: string | number | null;
}
export interface Lecturer { component?: string; names?: string[] }
export interface ReadingItem { component?: string; reference?: string }
export interface ModuleData {
  id: string;
  sourceRef?: string;
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
}
export interface SemesterGroup { title: string; modules: string[] }
export interface CurriculumModuleEntry {
  id: string;
  file: string;
  column?: string;
  block?: number | null;
  style?: "project" | "internship";
  span?: number;
  track?: string;
}
export interface CurriculumSpecialization { title: string; modules: CurriculumModuleEntry[] }
export type CurriculumItem = CurriculumModuleEntry | CurriculumSpecialization;
export interface CurriculumSemester { semester: number; modules: CurriculumItem[] }
export interface CurriculumStage { title: string; semesters: CurriculumSemester[] }
export interface CurriculumFileData {
  programmeName?: string;
  tableHeadings?: CurriculumTableHeadings;
  studyTables?: StudyTableRange[];
  columns: string[];
  studyStages: CurriculumStage[];
}
export interface CurriculumPlacement {
  column: string;
  semester?: number;
  block?: number | null;
  style?: "project" | "internship";
  span?: number;
  track?: string;
  specializationTitle?: string;
}
export interface CurriculumModulePosition { placements: CurriculumPlacement[] }
export interface StudyTableRange {
  number: 2 | 3;
  firstSemester: number;
  lastSemester: number;
  heading: string;
}
export interface CurriculumTableHeadings { structure?: string; foundation?: string; advanced?: string }
export interface StudyStage { title: string; firstSemester: number; lastSemester: number }
export interface CurriculumData {
  programmeName?: string;
  tableHeadings?: CurriculumTableHeadings;
  studyTables?: StudyTableRange[];
  columns: string[];
  studyStages: StudyStage[];
  semesters: SemesterGroup[];
  modules: Record<string, CurriculumModulePosition>;
}
export interface SpecificSubparagraph { text: string }
export interface SpecificParagraph { text: string; items?: SpecificSubparagraph[] }
export interface SpecificsData {
  section: string;
  title: string;
  code: string;
  programme: string;
  spoVersion: number;
  paragraphs: SpecificParagraph[];
  lastChange?: string;
}
export interface ProgrammeEntry { path: string; specifics: string }
export type DetailGridValue = string | number | boolean | null | undefined;
export type DetailGridRow = DetailGridValue[];
export type DetailGridRows = DetailGridRow[];
export interface StudyTableEntry { module: ModuleData; block?: number | null; specializationTitle?: string; track?: string }
export interface CurriculumCellEntry {
  module: ModuleData;
  semester: number;
  block?: number | null;
  style: string;
  track?: string;
  specializationTitle?: string;
}
export interface CurriculumCell { row: number; gridColumn: string; entries: CurriculumCellEntry[] }
