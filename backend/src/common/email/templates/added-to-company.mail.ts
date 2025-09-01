import { type SendMailOptions } from 'nodemailer';

import { InvitationRole } from '../../../companies/entities/invitation.entity';

function formatRole(role: InvitationRole): string {
  return role === InvitationRole.ADMIN ? 'Admin' : 'Worker';
}

export function addedToCompanyMail(
  to: string,
  companyName: string,
  role: InvitationRole,
): SendMailOptions {
  const roleName = formatRole(role);
  return {
    html: `<p>You have been added to <strong>${companyName}</strong> as <strong>${roleName}</strong>.</p>`,
    subject: 'You were added to a company',
    text: `You have been added to ${companyName} as ${roleName}.`,
    to,
  };
}
