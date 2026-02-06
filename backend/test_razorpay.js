const Razorpay = require('razorpay');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log('Testing Razorpay Key:', process.env.RAZORPAY_KEY_ID);

instance.orders.all({ count: 1 })
    .then(res => {
        console.log('✅ Authentication Successful!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Authentication Failed!');
        console.error('Error:', err.error ? err.error.description : err.message);
        console.error('Status Code:', err.statusCode);
        process.exit(1);
    });
