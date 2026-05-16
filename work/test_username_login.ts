import axios from 'axios';

async function testUsernameLogin() {
  const username = 'user_' + Math.random().toString(36).substring(7);
  const email = 'test_' + Math.random().toString(36).substring(7) + '@example.com';
  const password = 'Password123!';

  console.log('1. Registering user...');
  await axios.post('http://localhost:3001/api/v1/auth/register', {
    name: 'Test User',
    email,
    username,
    password,
    role: 'guest'
  });

  console.log('2. Attempting login with USERNAME...');
  try {
    const res = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: username, // Sending username in the "email" field
      password
    });
    console.log('USERNAME LOGIN SUCCESS:', !!res.data.token);
  } catch (error: any) {
    console.error('USERNAME LOGIN FAILED:', error.response?.data || error.message);
  }
}

testUsernameLogin();
