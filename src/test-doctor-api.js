const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testDoctorAPI() {
  try {
    console.log('Testing doctor API...');
    const response = await axios.get(`${API_URL}/api/doctors`);
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error testing doctor API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDoctorAPI();
