async function testInventory() {
  try {
    console.log('Testing Inventory GET (native fetch)...');
    const res = await fetch('http://localhost:5001/api/inventory/materials');
    console.log('GET Status:', res.status);
    const data = await res.json();
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Test Failed:', err.message);
  }
}

testInventory();
