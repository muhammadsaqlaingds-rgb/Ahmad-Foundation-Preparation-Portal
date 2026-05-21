import connectToDatabase from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function ensureAdminFromEnv() {
    const rawEmail = process.env.ADMIN_EMAIL;
    const rawPassword = process.env.ADMIN_PASSWORD;

    const email = rawEmail ? rawEmail.trim() : "";
    const password = rawPassword ? rawPassword.trim() : "";

    if (!email || !password) {
        console.warn("ADMIN_EMAIL or ADMIN_PASSWORD is not set in environment variables.");
        return;
    }

    await connectToDatabase();

    const existing = await Admin.findOne({ email });

    if (!existing) {
        await Admin.create({ email, password });
        console.log("Admin created from env.", { email });
        return;
    }

    if (existing.password !== password) {
        existing.password = password;
        await existing.save();
        console.log("Admin password updated from env.", { email });
        return;
    }

    console.log("Admin from env already exists with same credentials.", { email });
}

export async function validateAdminCredentials(email: string, password: string) {
    const inputEmail = email.trim();
    const inputPassword = password.trim();

    if (!inputEmail || !inputPassword) return false;

    await connectToDatabase();

    const admin = await Admin.findOne({ email: inputEmail });
    if (!admin) return false;

    const dbPassword = typeof admin.password === "string" ? admin.password.trim() : "";

    const match = dbPassword === inputPassword;

    if (!match) {
        console.warn("Admin login failed: password mismatch for email", {
            email: inputEmail,
            inputLength: inputPassword.length,
            storedLength: dbPassword.length,
        });
    }

    return match;
}

