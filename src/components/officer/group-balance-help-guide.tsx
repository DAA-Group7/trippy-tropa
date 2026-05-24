import { GROUP_BALANCING_SECTIONS } from "@/lib/docs/group-balancing-sections";
import { cn } from "@/lib/utils";

const cardShadow =
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]";

export function GroupBalanceHelpGuide() {
  return (
    <article
      className={cn(
        "flex flex-col gap-8 rounded-xl border border-[#c3c6d7] bg-white p-6 md:p-8",
        cardShadow
      )}
    >
      <header className="border-b border-[#e7e7f3] pb-6">
        <p className="text-sm font-medium text-[#004ac6]">Instructor guide</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-[#191b23] md:text-3xl">
          How group balancing works
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#505f76]">
          Greedy load balancing when you regenerate groups on the generation
          screen.
        </p>
      </header>
      {GROUP_BALANCING_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[#191b23]">
            {section.title}
          </h2>
          {section.paragraphs?.map((p) => (
            <p
              key={p.slice(0, 40)}
              className="mt-3 text-sm leading-relaxed text-[#434655]"
            >
              {p}
            </p>
          ))}
          {section.bullets && (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#434655]">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
