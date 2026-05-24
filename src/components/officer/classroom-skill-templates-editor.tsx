"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  resetClassroomSkillTemplatesToDefault,
  saveClassroomSkillTemplates,
} from "@/app/actions/classroom-skills";
import {
  defaultTemplateInputs,
  normalizeMetricKey,
  type ClassroomSkillTemplateRow,
} from "@/lib/skills/classroom-skills";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

type EditableTemplate = {
  metricKey: string;
  label: string;
  description: string;
  tooltip: string;
  multiplier: number;
  sortOrder: number;
};

function toEditable(rows: ClassroomSkillTemplateRow[]): EditableTemplate[] {
  return rows.map((row) => ({
    metricKey: row.metricKey,
    label: row.label,
    description: row.description ?? "",
    tooltip: row.tooltip ?? "",
    multiplier: row.multiplier,
    sortOrder: row.sortOrder,
  }));
}

function fromDefaults(): EditableTemplate[] {
  return defaultTemplateInputs().map((t) => ({
    metricKey: t.metricKey,
    label: t.label,
    description: t.description ?? "",
    tooltip: t.tooltip ?? "",
    multiplier: t.multiplier,
    sortOrder: t.sortOrder,
  }));
}

interface ClassroomSkillTemplatesEditorProps {
  classroomId: string;
  subject: string | null;
  initialTemplates: ClassroomSkillTemplateRow[];
}

export function ClassroomSkillTemplatesEditor({
  classroomId,
  subject,
  initialTemplates,
}: ClassroomSkillTemplatesEditorProps) {
  const [templates, setTemplates] = useState<EditableTemplate[]>(() =>
    initialTemplates.length > 0 ? toEditable(initialTemplates) : fromDefaults()
  );
  const [isPending, startTransition] = useTransition();

  const subjectHint = useMemo(() => {
    if (!subject) return null;
    const normalized = subject.toLowerCase();
    if (
      normalized.includes("software") ||
      normalized.includes("engineering") ||
      normalized.includes("cs")
    ) {
      return "Tip: For Software Engineering, try Technical ×2 and Teamwork ×1.5.";
    }
    return null;
  }, [subject]);

  const updateRow = (index: number, patch: Partial<EditableTemplate>) => {
    setTemplates((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const addRow = () => {
    if (templates.length >= 12) {
      toast.error("Maximum 12 skills per classroom.");
      return;
    }
    setTemplates((rows) => [
      ...rows,
      {
        metricKey: `custom_${rows.length + 1}`,
        label: "New skill",
        description: "",
        tooltip: "",
        multiplier: 1,
        sortOrder: rows.length,
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (templates.length <= 1) {
      toast.error("Keep at least one skill metric.");
      return;
    }
    setTemplates((rows) =>
      rows
        .filter((_, i) => i !== index)
        .map((row, i) => ({ ...row, sortOrder: i }))
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveClassroomSkillTemplates({
        classroomId,
        templates: templates.map((row, index) => ({
          metricKey: normalizeMetricKey(row.metricKey) || row.metricKey,
          label: row.label.trim(),
          description: row.description.trim() || undefined,
          tooltip: row.tooltip.trim() || undefined,
          multiplier: row.multiplier,
          sortOrder: index,
        })),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Onboarding skills saved for this classroom.");
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetClassroomSkillTemplatesToDefault(classroomId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTemplates(fromDefaults());
      toast.success("Restored default skill metrics.");
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[#c3c6d7] bg-white p-6",
        cardShadow
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#191b23]">
            Onboarding skills
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-[#434655]">
            Customize self-assessment metrics and multipliers for this classroom.
            Weighted scores (rating × multiplier) drive group balancing.
          </p>
          {subjectHint && (
            <p className="mt-2 text-sm text-[#004ac6]">{subjectHint}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#c3c6d7] px-3 py-2 text-sm font-medium text-[#434655] hover:bg-[#f3f3fe] disabled:opacity-60"
          >
            <RotateCcw className="size-4" />
            Reset defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-medium text-white hover:bg-[#004ac6] disabled:opacity-60"
          >
            <Save className="size-4" />
            {isPending ? "Saving…" : "Save skills"}
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {templates.map((row, index) => (
          <div
            key={`${row.metricKey}-${index}`}
            className="rounded-lg border border-[#e7e7f3] bg-[#faf8ff] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#505f76]">
                Skill {index + 1}
              </p>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="rounded p-1 text-[#737686] hover:bg-[#e7e7f3] hover:text-[#191b23]"
                aria-label="Remove skill"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-[#191b23]">Label</span>
                <input
                  value={row.label}
                  onChange={(e) => updateRow(index, { label: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#c3c6d7] bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-[#191b23]">Key</span>
                <input
                  value={row.metricKey}
                  onChange={(e) =>
                    updateRow(index, { metricKey: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-[#c3c6d7] bg-white px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium text-[#191b23]">Description</span>
                <input
                  value={row.description}
                  onChange={(e) =>
                    updateRow(index, { description: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-[#c3c6d7] bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium text-[#191b23]">Tooltip</span>
                <input
                  value={row.tooltip}
                  onChange={(e) => updateRow(index, { tooltip: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#c3c6d7] bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-[#191b23]">
                  Multiplier
                </span>
                <input
                  type="number"
                  min={0.25}
                  max={10}
                  step={0.25}
                  value={row.multiplier}
                  onChange={(e) =>
                    updateRow(index, {
                      multiplier: Number.parseFloat(e.target.value) || 1,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-[#c3c6d7] bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        disabled={isPending}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#004ac6] hover:underline disabled:opacity-60"
      >
        <Plus className="size-4" />
        Add skill metric
      </button>
    </div>
  );
}
