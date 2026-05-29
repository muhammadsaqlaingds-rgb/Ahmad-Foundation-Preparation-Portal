import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Student Hub Dashboard | Ahmad Foundation Portal",
    description: "Welcome to your tuition portal. Track exam statistics, enter mock test rooms, and access study notes files.",
};

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
