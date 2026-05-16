import axios from 'axios';

async function testAuthFlow() {
  const email = 'flow_test_' + Math.random().toString(36).substring(7) + '@example.com';
  const password = 'Password123!';
  const payload = {
    name: 'Flow Test User',
    email,
    username: 'flow_' + Math.random().toString(36).substring(7),
    password,
    role: 'guest'
  };

  console.log('1. Testing registration...');
  try {
    const regRes = await axios.post('http://localhost:3001/api/v1/auth/register', payload);
    console.log('REGISTRATION SUCCESS');

    console.log('2. Testing login...');
    const loginRes = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email,
      password
    });
    console.log('LOGIN SUCCESS:', !!loginRes.data.token);
  } catch (error: any) {
    if (error.response) {
      console.error('FAILURE Status:', error.response.status);
      console.error('FAILURE Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('FAILURE Message:', error.message);
    }
  }
}

testAuthFlow();
