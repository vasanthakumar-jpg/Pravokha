
const axios = require('axios');

async function testComboOffers() {
  try {
    const response = await axios.get('http://localhost:5000/api/combo-offers');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
  }
}

testComboOffers();
