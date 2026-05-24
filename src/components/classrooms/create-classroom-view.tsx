"use client";

import { CreateClassroomForm } from "@/components/classrooms/create-classroom-form";

export function CreateClassroomView() {
  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-[#191b23] sm:text-5xl">
          Create Classroom
        </h1>
        <p className="mt-3 max-w-[720px] text-lg text-[#434655]">
          Establish a new academic space for structured learning, collaboration,
          and resource distribution.
        </p>
      </div>

      <CreateClassroomForm variant="page" />
    </div>
  );
}
