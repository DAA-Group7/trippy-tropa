"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SKILL_DEFINITIONS } from "@/lib/constants/skills";
import type { SkillKey } from "@/types/database";

export default function SkillOnboardingPage() {
  const [step, setStep] = useState(0);
  const [ratings, setRatings] = useState<Record<SkillKey, number>>({
    communication: 3,
    leadership: 3,
    technical: 3,
    teamwork: 3,
  });

  const skill = SKILL_DEFINITIONS[step];
  const progress = ((step + 1) / SKILL_DEFINITIONS.length) * 100;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-6 space-y-2">
        <p className="text-sm font-medium text-primary">
          Step {step + 1} of {SKILL_DEFINITIONS.length}
        </p>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Rate your {skill.label.toLowerCase()}</CardTitle>
          <CardDescription>{skill.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                type="button"
                variant={ratings[skill.key] === n ? "default" : "outline"}
                className="flex-1"
                onClick={() =>
                  setRatings((r) => ({ ...r, [skill.key]: n }))
                }
              >
                {n}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={() => {
                if (step < SKILL_DEFINITIONS.length - 1) {
                  setStep((s) => s + 1);
                } else {
                  // TODO: persist to Supabase profiles + skill_ratings
                }
              }}
            >
              {step < SKILL_DEFINITIONS.length - 1 ? "Next" : "Complete"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
