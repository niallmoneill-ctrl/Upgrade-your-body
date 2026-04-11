import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
export async function notifyAdmin(subject: string, body: string) {
  try {
    await resend.emails.send({
      from: 'Upgrade Your Body <reminders@updates.oneill-labs.com>',
      to: ['niallmoneill@gmail.com'],
      subject,
      html: '<div style="font-family:sans-serif;padding:20px;background:#08111f;color:#f4f7fb;"><h2 style="color:#41d98a;">' + subject + '</h2><p style="color:#b7c3d3;line-height:1.6;">' + body + '</p><hr style="border-color:#222;"><p style="color:#666;font-size:12px;">Upgrade Your Body - Admin</p></div>',
    });
  } catch (err) { console.error('Admin notification failed:', err); }
}
