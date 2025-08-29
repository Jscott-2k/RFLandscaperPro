import { SendMailOptions } from 'nodemailer';
import { InvitationRole } from '../../../companies/entities/invitation.entity';

function formatRole(role: InvitationRole): string {
  return role === 'ADMIN' ? 'Admin' : 'Worker';
}

export function invitationMail(
  to: string,
  token: string,
  companyName: string,
  role: InvitationRole,
  expiresAt: Date,
): SendMailOptions {
  const baseUrl =
    process.env.APP_BASE_URL ?? 'https://app.rflandscaperpro.com';
  const link = `${baseUrl}/invite/accept?token=${token}`;
  const roleName = formatRole(role);
  const expiry = expiresAt.toDateString();
  return {
    to,
    subject: 'Company Invitation',
    text: `You have been invited to join ${companyName} as ${roleName}. This invitation expires on ${expiry}. Accept here: ${link}`,
    html: `<p>You have been invited to join <strong>${companyName}</strong> as <strong>${roleName}</strong>.</p><p>This invitation expires on <strong>${expiry}</strong>.</p><p><a href="${link}">Accept Invitation</a></p>`,
  };
}
