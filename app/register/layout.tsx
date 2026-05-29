import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Student Registration | Ahmad Foundation Preparation Portal",
    description: "Create your student account to unlock class study notes, practice mock tests, track your performance, and prepare for your exams.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
