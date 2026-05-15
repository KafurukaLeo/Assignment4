import axios from 'axios';

async function testRegister() {
  try {
    const res = await axios.post('http://localhost:3001/api/v1/auth/register', {
      name: 'Test Host',
      email: 'host_' + Date.now() + '@test.com',
      username: 'host_' + Date.now(),
      password: 'password123',
      role: 'host'
    });
    console.log('Success:', res.data);
  } catch (error) {
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testRegister();
