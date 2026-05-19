import axios from 'axios';

async function testAdminLogin() {
  const email = 'admin@airbnb.local';
  const password = 'admin123';

  console.log('Attempting admin login...');
  try {
    const res = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email,
      password
    });
    console.log('ADMIN LOGIN SUCCESS:', !!res.data.token);
    console.log('User Role:', res.data.user.role);
  } catch (error: any) {
    console.error('ADMIN LOGIN FAILED:', error.response?.data || error.message);
  }
}

testAdminLogin();
