require('dotenv').config();
const sequelize = require('./src/config/database');
const StripePayment = require('./src/models/stripePayment.model');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB. Seeding stripe_payments...');

    const dummyPayments = [
      {
        stripe_event_id: 'evt_dummy_1',
        stripe_object_id: 'pi_dummy_1',
        event_type: 'payment_intent.succeeded',
        amount: 100,
        currency: 'usd',
        status: 'succeeded',
        customer_email: 'alice@example.com',
        patient_email: 'alice@example.com',
        metadata: { note: 'Dummy payment 1' },
        rawData: JSON.stringify({ id: 'pi_dummy_1', amount: 10000 })
      },
      {
        stripe_event_id: 'evt_dummy_2',
        stripe_object_id: 'pi_dummy_2',
        event_type: 'checkout.session.completed',
        amount: 50,
        currency: 'usd',
        status: 'completed',
        customer_email: 'bob@example.com',
        patient_email: 'bob@example.com',
        metadata: { note: 'Dummy session 2' },
        rawData: JSON.stringify({ id: 'cs_dummy_2', amount_total: 5000 })
      }
    ];

    await StripePayment.bulkCreate(dummyPayments, { ignoreDuplicates: true });
    console.log('Dummy stripe_payments seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding stripe_payments:', error);
    process.exit(1);
  }
})();
