export const CREATE_CLASSROOM_SUBJECTS = [
  { value: "", label: "Select an academic discipline" },
  { value: "sciences", label: "Natural Sciences" },
  { value: "humanities", label: "Humanities" },
  { value: "engineering", label: "Engineering" },
  { value: "mathematics", label: "Mathematics" },
  { value: "computer-science", label: "Computer Science" },
  { value: "business", label: "Business & Management" },
  { value: "other", label: "Other" },
] as const;

export const createClassroomInputClass =
  "w-full rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-4 py-2.5 text-base text-[#191b23] transition-colors placeholder:text-[#737686] focus:border-[#004ac6] focus:outline-none focus:ring-1 focus:ring-[#004ac6]";

export const createClassroomCardClass =
  "relative overflow-hidden rounded-xl border border-[#c3c6d7] bg-white p-6 shadow-sm";
