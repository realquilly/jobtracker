export type Stage = {
  name: string;
  link?: string; // e.g. the online assessment URL
  deadline?: string; // yyyy-mm-dd
};

export type Application = {
  id: string;
  company: string;
  logo?: string; // small PNG data URL
  role?: string; // missing on entries saved before this field existed
  appliedOn: string; // yyyy-mm-dd
  stages: Stage[];
  currentStage: number; // index into stages; where progress stops if rejected
  rejected?: boolean;
};
