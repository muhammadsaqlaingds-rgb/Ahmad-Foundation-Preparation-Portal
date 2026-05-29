import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Control Panel Sign In | Ahmad Foundation",
    description: "Secure gateway for Ahmad Foundation Portal administrators and instructors to log in and manage curriculum assets.",
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
