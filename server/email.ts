import { Resend } from 'resend';

// Initialize Resend safely - avoid server crash if key is missing
// We use a dummy key if missing, so the object exists, but we block sending in the function below
const resendApiKey = process.env.RESEND_API_KEY || 're_123456789';
const resend = new Resend(resendApiKey);

interface SendEmailProps {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailProps) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️  RESEND_API_KEY is missing. Email skipped.");
        console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
        // Return false but don't crash, so the app handles it gracefully
        return { success: false, error: "Missing API Configuration" };
    }

    try {
        const data = await resend.emails.send({
            from: 'Norlava <onboarding@resend.dev>', // Default testing domain
            to,
            subject,
            html,
        });

        return { success: true, data };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
};
