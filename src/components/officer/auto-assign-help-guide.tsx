import {
  GREEDY_ASSIGNMENT_SECTIONS,
  type DocSection,
} from "@/lib/docs/greedy-assignment-sections";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

function SectionBlock({ section }: { section: DocSection }) {
  return (
    <section id={section.id} className="scroll-mt-24">
      <h2 className="text-lg font-semibold text-[#191b23]">{section.title}</h2>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph.slice(0, 32)} className="mt-3 text-sm leading-relaxed text-[#434655]">
          {paragraph}
        </p>
      ))}
      {section.bullets && (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#434655]">
          {section.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {section.table && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-[#c3c6d7]">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-[#f3f3fe]">
              <tr>
                {section.table.headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-2.5 font-semibold text-[#191b23]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e7f3]">
              {section.table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="bg-white">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-2.5 text-[#434655] align-top"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

interface AutoAssignHelpGuideProps {
  className?: string;
  compact?: boolean;
}

export function AutoAssignHelpGuide({
  className,
  compact = false,
}: AutoAssignHelpGuideProps) {
  const sections = compact
    ? GREEDY_ASSIGNMENT_SECTIONS.filter((s) =>
        ["summary", "prerequisites", "steps", "limitations"].includes(s.id)
      )
    : GREEDY_ASSIGNMENT_SECTIONS;

  return (
    <article
      className={cn(
        "flex flex-col gap-8 rounded-xl border border-[#c3c6d7] bg-white p-6 md:p-8",
        cardShadow,
        className
      )}
    >
      {!compact && (
        <header className="border-b border-[#e7e7f3] pb-6">
          <p className="text-sm font-medium text-[#004ac6]">Instructor guide</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-[#191b23] md:text-3xl">
            How auto-assign works
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#505f76]">
            A plain-language explanation of the Hungarian matcher used when you
            click Auto assign or Reassign all on the task management screen.
          </p>
        </header>
      )}
      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}
    </article>
  );
}
