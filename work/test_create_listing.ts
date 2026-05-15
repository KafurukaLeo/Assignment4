import axios from 'axios';
import qs from 'qs';

const API = 'http://localhost:3001/api/v1';

async function registerAndLogin() {
  const email = `host_${Date.now()}@example.com`;
  const username = `host_${Date.now()}`;
  const password = 'password123';
  // register as host
  await axios.post(`${API}/auth/register`, {
    name: 'Test Host',
    email,
    username,
    password,
    role: 'host',
  });
  // login
  const loginRes = await axios.post(`${API}/auth/login`, { email, password });
  const token = loginRes.data.token;
  console.log('Token:', token);
  return token;
}

async function createListing(token: string) {
  const form = new FormData();
  form.append('title', 'Test Listing');
  form.append('description', 'A cozy place for testing');
  form.append('location', 'Test City');
  form.append('pricePerNight', '100');
  form.append('guests', '2');
  form.append('type', 'apartment');
  form.append('amenities', JSON.stringify(['wifi']));
  // skip photos
  const res = await axios.post(`${API}/listings`, form, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  console.log('Create response:', res.data);
}

(async () => {
  try {
    const token = await registerAndLogin();
    await createListing(token);
  } catch (e: unknown) {
    const err = e as { response?: { data: unknown }; message: string };
    console.error('Error:', err.response?.data || err.message);
  }
})();
