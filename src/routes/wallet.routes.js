const express = require('express');
const router = express.Router();
const walletController = require('../wallet/wallet.controller');

// Patient wallet routes
router.post('/login', walletController.login);
router.get('/balance', walletController.getWalletBalance);
router.post('/add-money', walletController.addMoney);
router.post('/book', walletController.bookAppointment);

// Payment history routes
router.get('/patient-history', walletController.getPatientHistory);
router.get('/doctor-history', walletController.getDoctorHistory);
router.get('/admin-history', walletController.getAdminHistory);

// Detailed wallet balance route
router.get('/detailed-balance', walletController.getDetailedWalletBalance);

// Auto-deduct for appointment route
router.post('/auto-deduct', walletController.autoDeductForAppointment);

// Stripe integration routes 
router.post('/create-payment-intent', walletController.createPaymentIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), walletController.handleStripeWebhook);

module.exports = router;