import axios from 'axios';

async function testRegister() {
  const payload = {
    name: 'Test User',
    email: 'test_' + Math.random().toString(36).substring(7) + '@example.com',
    username: 'user_' + Math.random().toString(36).substring(7),
    password: 'password123',
    role: 'host'
  };

  console.log('Testing registration with payload:', payload);

  try {
    const res = await axios.post('http://localhost:3001/api/v1/auth/register', payload);
    console.log('SUCCESS:', res.data);
  } catch (error: unknown) {
    const err = error as { response?: { status: number; data: unknown }; message: string };
    if (err.response) {
      console.error('FAILURE Status:', err.response.status);
      console.error('FAILURE Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('FAILURE Message:', err.message);
    }
  }
}

testRegister();
