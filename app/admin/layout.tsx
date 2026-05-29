import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Control Center | Ahmad Foundation",
    description: "Super Administrator dashboard to manage classes, subjects, MCQ question banks, study notes, student registrations, and access approval requests.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
