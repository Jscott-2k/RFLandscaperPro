import { SendMailOptions } from 'nodemailer';
import { InvitationRole } from '../../../companies/entities/invitation.entity';

function formatRole(role: InvitationRole): string {
  return role === 'ADMIN' ? 'Admin' : 'Worker';
}

export function addedToCompanyMail(
  to: string,
  companyName: string,
  role: InvitationRole,
): SendMailOptions {
  const roleName = formatRole(role);
  return {
    to,
    subject: 'You were added to a company',
    text: `You have been added to ${companyName} as ${roleName}.`,
    html: `<p>You have been added to <strong>${companyName}</strong> as <strong>${roleName}</strong>.</p>`,
  };
}
