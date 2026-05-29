import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Student Sign In | Ahmad Foundation Preparation Portal",
    description: "Sign in to your student account to access timed mock exams, practice MCQ rooms, download study notes, and view your scorecards.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
