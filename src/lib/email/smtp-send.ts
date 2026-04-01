import nodemailer from "nodemailer";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/** 英文逗号分隔；trim；去空；单邮箱原样兼容 */
export function parseDailyReportRecipients(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function sendMailSmtp(input: SendMailInput): Promise<{
  ok: boolean;
  message: string;
}> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !from) {
    return {
      ok: false,
      message: "缺少 SMTP_HOST 或 SMTP_FROM",
    };
  }

  const recipients = parseDailyReportRecipients(input.to);
  if (recipients.length === 0) {
    return {
      ok: false,
      message: "无有效收件人（请检查 DAILY_REPORT_TO）",
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  try {
    await transporter.sendMail({
      from,
      to: recipients,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true, message: `sent to ${recipients.length} recipient(s)` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}
