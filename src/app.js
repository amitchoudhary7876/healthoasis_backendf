 // Import wallet models
const AdminWallet = require('./models/adminWallet.model');
const DoctorWallet = require('./models/doctorWallet.model');
const PatientWallet = require('./models/patientWallet.model');
const Transaction = require('./wallet/transaction.model');
const StripePayment = require('./models/stripePayment.model');

// Import express
const express = require('express');
require('dotenv').config();

// Import cors
const cors = require('cors');

// Import http and Socket.io for real-time communication
const http = require('http');
const { Server } = require('socket.io');

// Import error handler
const errorHandler = require('./middleware/errorHandler');

// Import sequelize
const sequelize = require('./config/database');

// Stripe integration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Import routes
const checkupBenefitsRoutes = require('./routes/checkupBenefits');
const checkupPackagesRoutes = require('./routes/checkupPackages');
const labAppointmentsRoutes = require('./routes/labAppointments');
const labServicesRoutes = require('./routes/labServices');
const labTestsRoutes = require('./routes/labTests');
const packageTestsRoutes = require('./routes/packageTests');
const resultsRoutes = require('./routes/results');
const specializedProgramsRoutes = require('./routes/specializedPrograms');
const vaccinationProcessRoutes = require('./routes/vaccinationProcess');
const vaccinationServicesRoutes = require('./routes/vaccinationServices');
const vaccinesRoutes = require('./routes/vaccines');
const emergencyServicesRoutes = require('./routes/emergencyServices');
const doctorDepartmentRoutes = require('./routes/doctorDepartment');
const appointmentRoutes = require('./routes/appointmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
// Removed patientRoutes — not needed anymore
const departmentRoutes = require('./routes/departmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const messageRoutes = require('./routes/messageRoutes');
const contactInfoRoutes = require('./routes/contactInfoRoutes');
const workingHoursRoutes = require('./routes/workingHoursRoutes');
// const sampleRoutes = require('./routes/Sample');
const walletRoutes = require('./routes/wallet.routes');
const enhancedWalletRoutes = require('./routes/enhanced-wallet.routes');
const stripeRoutes = require('./routes/stripe.routes');
const videoCallRoutes = require('./routes/videoCall');
// const notifyDoctorRoutes = require('./routes/notifyDoctor.routes'); // Video call notification removed
const app = express();

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for testing
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: false // Set to false to avoid CORS issues
    }
});

// Initialize socket service
const socketService = require('./services/socketService');
socketService(io);

// Use a different port to avoid conflicts
const PORT = parseInt(process.env.PORT, 10) || 3001;
// Set up CORS middleware before any routes
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Also use the cors middleware for good measure
app.use(cors());

// Middleware
app.use(express.json());

// Special handling for Stripe webhook
app.use('/api/wallet/webhook', express.raw({ type: 'application/json' }));
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Stripe webhook handler
app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { client_reference_id, amount_total, customer } = session;
      const wallet = await PatientWallet.findOneAndUpdate(
        { userId: client_reference_id },
        { $inc: { balance: amount_total / 100 } },
        { new: true, upsert: true }
      );
      await Transaction.create({
        wallet: wallet._id,
        type: 'payment',
        amount: amount_total / 100,
        stripeCustomer: customer,
        stripeSessionId: session.id,
      });
      break;
    }
    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      await Transaction.create({
        type: 'payment_intent',
        amount: intent.amount_received / 100,
        stripeIntentId: intent.id,
        status: intent.status,
      });
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  res.json({ received: true });
});

// Routes
app.use('/api/checkup-benefits', checkupBenefitsRoutes);
app.use('/api/checkup-packages', checkupPackagesRoutes);
app.use('/api/lab-appointments', labAppointmentsRoutes);
app.use('/api/lab-services', labServicesRoutes);
app.use('/api/lab-tests', labTestsRoutes);
app.use('/api/package-tests', packageTestsRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/specialized-programs', specializedProgramsRoutes);
app.use('/api/vaccination-process', vaccinationProcessRoutes);
app.use('/api/vaccination-services', vaccinationServicesRoutes);
app.use('/api/vaccines', vaccinesRoutes);
app.use('/api/emergency-services', emergencyServicesRoutes);
app.use('/api/doctor-department', doctorDepartmentRoutes);
// app.use('/api/notify-doctor', notifyDoctorRoutes); // Removed video call notification
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
// Removed: app.use('/api/patients', patientRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contact-info', contactInfoRoutes);
app.use('/api/working-hours', workingHoursRoutes);
// app.use('/api/samples', sampleRoutes);
app.use('/api/wallet', enhancedWalletRoutes); // Using enhanced wallet routes
app.use('/api/stripe', stripeRoutes);
app.use('/api/video-call', videoCallRoutes); // Video call routes

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Healthcare Management System API',
        endpoints: {
            checkupBenefits: '/api/checkup-benefits',
            checkupPackages: '/api/checkup-packages',
            labAppointments: '/api/lab-appointments',
            labServices: '/api/lab-services',
            labTests: '/api/lab-tests',
            packageTests: '/api/package-tests',
            results: '/api/results',
            specializedPrograms: '/api/specialized-programs',
            vaccinationProcess: '/api/vaccination-process',
            vaccinationServices: '/api/vaccination-services',
            vaccines: '/api/vaccines',
            emergencyServices: '/api/emergency-services',
            doctorDepartment: '/api/doctor-department',
            appointments: '/api/appointments',
            doctors: '/api/doctors',
            departments: '/api/departments',
            medicalRecords: '/api/medical-records',
            messages: '/api/messages',
            contactInfo: '/api/contact-info',
            workingHours: '/api/working-hours',
            wallet: {
                login: '/api/wallet/login [POST]',
                balance: '/api/wallet/balance?email=user@example.com [GET]',
                addMoney: '/api/wallet/add-money [POST]',
                book: '/api/wallet/book [POST]',
                patientHistory: '/api/wallet/patient-history?email=user@example.com [GET]',
                doctorHistory: '/api/wallet/doctor-history?doctorId=1 [GET]',
                adminHistory: '/api/wallet/admin-history [GET]',
                transfer: '/api/wallet/transfer [POST]',
                createPaymentIntent: '/api/wallet/create-payment-intent [POST]',
                webhook: '/api/wallet/webhook [POST]'
            }
        }
    });
});

// Error handling middleware
app.use(errorHandler);

// Setup wallet tables before starting the server
async function setupWalletTables() {
    try {
        // Setting up wallet tables
        
        // Sync wallet models
        await AdminWallet.sync({ alter: true });
        
        
        await DoctorWallet.sync({ alter: true });
        
        
        await PatientWallet.sync({ alter: true });
        

        await Transaction.sync({ alter: true });
        
        
        await StripePayment.sync({ alter: true });
        

        // Create default admin wallet if it doesn't exist
        const adminWallet = await AdminWallet.findOne({ where: { id: 1 } });
        if (!adminWallet) {
            await AdminWallet.create({
                id: 1,
                balance: 0,
                transactions: []
            });
            
        }

        // Wallet tables setup completed
        return true;
    } catch (error) {
        console.error('Error setting up wallet tables:', error);
        return false;
    }
}

// Database connection and server start
sequelize
    .authenticate()
    .then(() => {
        // Database connected successfully
        return setupWalletTables();
    })
    .then(() => {
        // Syncing database models with a more cautious approach
        return sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
          .then(() => {
            // Use a more cautious sync approach - don't alter tables
            return sequelize.sync({ alter: false });
          })
          .then(() => {
            // Re-enable foreign key checks
            return sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
          })
          .then(() => {
            console.log('Database synchronized successfully');
          })
          .catch(err => {
            console.error('Error during database sync:', err.message);
            // Try to re-enable foreign key checks even if sync failed
            return sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
              .then(() => {
                console.log('Foreign key checks re-enabled after error');
                // Continue with app startup even if sync failed
                return Promise.resolve();
              });
          });
    })
    .then(() => {
        // All database tables synchronized
        // Start server with automatic port fallback on EADDRINUSE
        const startServer = (port) => {
            server.listen(port, '0.0.0.0', () => {
                console.log(`Server running on http://0.0.0.0:${port}`);
                console.log('Socket.io server initialized for video calls');
            });
            
        };
        startServer(PORT);
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err.message);
        process.exit(1);
    });

module.exports = app;
