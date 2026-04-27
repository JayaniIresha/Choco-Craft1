const axios = require('axios');

async function testInventory() {
  try {
    console.log('Testing Inventory GET...');
    const res = await axios.get('http://localhost:5001/api/inventory/materials');
    console.log('GET Status:', res.status);
    console.log('Materials Count:', res.data.materials.length);
  } catch (err) {
    console.error('Test Failed:', err.message);
    if (err.response) {
      console.error('Response Data:', err.response.data);
    }
  }
}

testInventory();
