import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "MCQ Test Practice Room | Ahmad Foundation",
    description: "Launch timed school mock tests, attempt multiple-choice questions, and get automated server-side scorecard grading under secure environments.",
};

export default function UserTestLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
