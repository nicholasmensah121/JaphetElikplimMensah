const baseUrl = 'http://localhost:5000/api';
const fetch = globalThis.fetch;
const log = (label, value) => console.log(`${label}:`, JSON.stringify(value, null, 2));

(async () => {
  try {
    const headers = { Accept: 'application/json' };
    const health = await fetch(`${baseUrl}/health`, { method: 'GET', headers });
    const csrf = health.headers.get('x-csrf-token');
    log('health', await health.json());
    if (!csrf) throw new Error('No CSRF token from health endpoint');

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
        Accept: 'application/json',
      },
      body: JSON.stringify({ email: 'demo@example.com', password: 'Demo@123456' }),
    });
    const loginBody = await loginRes.json();
    log('login', loginBody);
    if (!loginBody.success || !loginBody.token) throw new Error('Login failed');

    const token = loginBody.token;
    const newFirst = 'QA' + Date.now().toString().slice(-5);
    const newLast = 'User' + Math.floor(Math.random() * 1000);

    const updateRes = await fetch(`${baseUrl}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ firstName: newFirst, lastName: newLast }),
    });

    const updateBody = await updateRes.json();
    log('update', updateBody);

    const profileRes = await fetch(`${baseUrl}/auth/profile`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const profileBody = await profileRes.json();
    log('profile', profileBody);

    console.log('Profile firstName matches:', profileBody.user.firstName === newFirst);
    console.log('Profile lastName matches:', profileBody.user.lastName === newLast);

  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 2;
  }
})();
