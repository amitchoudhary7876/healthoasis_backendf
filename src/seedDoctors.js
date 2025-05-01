const Doctor = require('./models/doctor');
const sequelize = require('./config/database');

async function seedDoctors() {
  try {
    // Connect to the database
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Check if there are any doctors in the database
    const doctorCount = await Doctor.count();
    console.log(`Found ${doctorCount} doctors in the database`);

    // If no doctors exist, seed some sample data
    if (doctorCount === 0) {
      console.log('No doctors found. Seeding sample doctor data...');
      
      const sampleDoctors = [
        {
          name: 'Dr. John Smith',
          specialization: 'Cardiology',
          email: 'john.smith@healthoasis.com',
          phone: '+1-555-123-4567',
          profile_image_url: 'https://placehold.co/300x400?text=Dr.+Smith',
          availability_status: 'available'
        },
        {
          name: 'Dr. Sarah Johnson',
          specialization: 'Neurology',
          email: 'sarah.johnson@healthoasis.com',
          phone: '+1-555-234-5678',
          profile_image_url: 'https://placehold.co/300x400?text=Dr.+Johnson',
          availability_status: 'available'
        },
        {
          name: 'Dr. Michael Chen',
          specialization: 'Pediatrics',
          email: 'michael.chen@healthoasis.com',
          phone: '+1-555-345-6789',
          profile_image_url: 'https://placehold.co/300x400?text=Dr.+Chen',
          availability_status: 'available'
        },
        {
          name: 'Dr. Emily Rodriguez',
          specialization: 'Dermatology',
          email: 'emily.rodriguez@healthoasis.com',
          phone: '+1-555-456-7890',
          profile_image_url: 'https://placehold.co/300x400?text=Dr.+Rodriguez',
          availability_status: 'available'
        }
      ];

      // Create the doctors in the database
      await Doctor.bulkCreate(sampleDoctors);
      console.log('Sample doctors created successfully!');
    } else {
      console.log('Doctors already exist in the database. No seeding needed.');
    }

    console.log('Doctor seeding process completed.');
  } catch (error) {
    console.error('Error seeding doctors:', error);
  } finally {
    // Close the database connection
    // await sequelize.close();
    // console.log('Database connection closed');
  }
}

// Run the seeding function
seedDoctors();
