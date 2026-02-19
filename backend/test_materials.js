// Use built-in fetch in Node 22+

const API_URL = 'http://localhost:3000/api';
let token = '';

async function login() {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'admin',
            password: 'password'
        })
    });
    const data = await res.json();
    token = data.token;
}

async function testMaterials() {
    await login();
    console.log('Logged in...');

    // 1. Create Supplier
    const supplierRes = await fetch(`${API_URL}/materials/suppliers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            shop_name: 'Test Supplier',
            owner_name: 'John Doe',
            category: 'Cement',
            phone_no: '1234567890',
            address: '123 Test St',
            balance: 0,
            additional_fields: ['GSTIN', 'License']
        })
    });
    const supplier = await supplierRes.json();
    console.log('Supplier created:', supplier.success);
    const supplierId = supplier.data.id;

    // 2. Add Material Entry
    const entryRes = await fetch(`${API_URL}/materials/entries`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            supplier_id: supplierId,
            product_id: 1, // Assumptions: product 1 exists
            office_id: 1,  // Assumption: office 1 exists
            units: 100,
            amount: 50000,
            date: new Date().toISOString().split('T')[0],
            fields: { 'Challan No': 'CH-999', 'Vehicle': 'KA-01-1234' }
        })
    });
    const entry = await entryRes.json();
    console.log('Entry created:', entry.success);

    // 3. Record Payment
    const paymentRes = await fetch(`${API_URL}/materials/statements`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            supplier_id: supplierId,
            amount: 20000,
            bank_id: 1, // Corrected from bankId to bank_id
            payment_mode: 'Bank Transfer',
            description: 'Test Payment'
        })
    });
    const payment = await paymentRes.json();
    console.log('Payment recorded:', payment.success);
    if (!payment.success) console.log('Payment Error:', payment.message);

    // 4. Verify Supplier Balance
    const verifyRes = await fetch(`${API_URL}/materials/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const verifyData = await verifyRes.json();
    const updatedSupplier = verifyData.data.find(s => s.id === supplierId);
    console.log('Updated Balance (Expected 30000):', updatedSupplier.balance);
}

testMaterials().catch(console.error);
