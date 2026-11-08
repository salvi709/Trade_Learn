import { isAuthorizedAdminEmail, ADMIN_AUTHORIZED_EMAILS } from '../serverAdmin';

async function testApiSecurity() {
  console.log('Testing security boundaries...');

  // 1. Authorized email check
  for (const email of ADMIN_AUTHORIZED_EMAILS) {
    if (!isAuthorizedAdminEmail(email)) {
      throw new Error(`Expected ${email} to be authorized`);
    }
  }

  // 2. Unauthorized emails
  const badEmails = ['test@example.com', 'hacker@dark.net', '', null, undefined];
  for (const bad of badEmails) {
    if (isAuthorizedAdminEmail(bad as any)) {
      throw new Error(`Expected ${bad} to be REJECTED`);
    }
  }

  console.log('✅ API Security tests passed successfully.');
}

testApiSecurity().catch((e) => {
  console.error(e);
  process.exit(1);
});
