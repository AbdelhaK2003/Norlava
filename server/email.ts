import { Resend } from 'resend';

// Initialize Resend safely
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
    console.warn("⚠️ RESEND_API_KEY is missing. Email service will not function.");
}
const resend = new Resend(resendApiKey || 're_123456789'); // Dummy key to prevent crash, check in sendEmail

interface SendEmailProps {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailProps) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is missing. Email not sent.");
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
