import nodemailer from 'nodemailer';

const isEmailConfigured = () => Boolean(
  process.env.SMTP_HOST
  && process.env.SMTP_USER
  && process.env.SMTP_PASSWORD
  && process.env.EMAIL_FROM
);

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendAttendanceConfirmationEmail = async ({ user, attendance }) => {
  if (!isEmailConfigured()) {
    console.warn('Attendance email skipped: SMTP settings are not configured');
    return false;
  }

  if (!user?.email) {
    console.warn('Attendance email skipped: matched user has no email address');
    return false;
  }

  const safeName = escapeHtml(user.name);
  const safeDate = escapeHtml(new Date(attendance.date).toLocaleDateString());
  const safeTime = escapeHtml(attendance.checkInTime);
  const safeStatus = escapeHtml(attendance.status);

  await createTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `Attendance confirmed - ${safeDate}`,
    text: `Hello ${user.name}, your attendance was marked as ${attendance.status} on ${safeDate} at ${attendance.checkInTime}.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172326">
        <div style="background:#102326;padding:24px;color:#f5f3ed">
          <strong style="font-size:20px">SmartAttend</strong>
        </div>
        <div style="border:1px solid #d8d5cb;border-top:0;padding:28px;background:#fff">
          <p>Hello ${safeName},</p>
          <h2 style="margin:0 0 16px">Attendance confirmed</h2>
          <p>Your face was verified and your attendance was saved automatically.</p>
          <table style="margin-top:20px;border-collapse:collapse;width:100%">
            <tr><td style="padding:8px 0;color:#617174">Date</td><td style="padding:8px 0"><strong>${safeDate}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#617174">Check-in time</td><td style="padding:8px 0"><strong>${safeTime}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#617174">Status</td><td style="padding:8px 0"><strong>${safeStatus}</strong></td></tr>
          </table>
          <p style="margin-top:24px;color:#617174;font-size:13px">This is an automatic notification from SmartAttend.</p>
        </div>
      </div>
    `,
  });

  return true;
};

export const sendAbsentNotificationEmail = async ({ user, date }) => {
  if (!isEmailConfigured() || !user?.email) return false;

  const safeName = escapeHtml(user.name);
  const safeDate = escapeHtml(new Date(date).toLocaleDateString());

  await createTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `Attendance absent - ${safeDate}`,
    text: `Hello ${user.name}, you were marked absent on ${new Date(date).toLocaleDateString()}.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172326"><div style="background:#102326;padding:24px;color:#f5f3ed"><strong style="font-size:20px">SmartAttend</strong></div><div style="border:1px solid #d8d5cb;border-top:0;padding:28px;background:#fff"><p>Hello ${safeName},</p><h2 style="margin:0 0 16px">Attendance marked absent</h2><p>No attendance check-in was recorded for ${safeDate}.</p><p style="margin-top:24px;color:#617174;font-size:13px">This is an automatic notification from SmartAttend.</p></div></div>`,
  });

  return true;
};
