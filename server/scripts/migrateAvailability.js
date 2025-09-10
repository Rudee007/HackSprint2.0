// Add this at the VERY TOP
const path = require('path');

// Load .env from explicit path
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env')
});

// Debug environment loading
console.log('🔍 Script running from:', __dirname);
console.log('🔍 Looking for .env at:', path.join(__dirname, '..', '.env'));
console.log('🔍 All environment variables loaded:');
Object.keys(process.env).filter(key => key.startsWith('MONGODB')).forEach(key => {
  console.log(`  ${key}:`, process.env[key]);
});

// Exit if no MONGODB_URI
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found!');
  console.log('💡 Please check your .env file exists at:', path.join(__dirname, '..', '.env'));
  process.exit(1);
}

const mongoose = require('mongoose');

// Your models - import AFTER dotenv is loaded
const Therapist = require('../src/models/Therapist');
const Availability = require('../src/models/Availability');

async function migrateTherapistAvailability() {
  try {
    console.log('🔄 Starting availability migration...');
    
    // Find all therapists with embedded availability
    const therapists = await Therapist.find({
      'availability': { $exists: true }
    });
    
    console.log(`📋 Found ${therapists.length} therapists with availability data`);
    
    let migratedCount = 0;
    
    for (const therapist of therapists) {
      try {
        const availabilityData = {
          providerId: therapist._id,
          
          // Convert workingDays to lowercase
          workingDays: therapist.availability.workingDays?.map(day => day.toLowerCase()) || 
                      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          
          // Copy working hours
          workingHours: therapist.availability.workingHours || {
            start: '09:00',
            end: '17:00'
          },
          
          // Default breaks (add lunch break)
          breaks: [
            {
              start: '13:00',
              end: '14:00',
              description: 'Lunch Break',
              recurring: true
            }
          ],
          
          // Default holidays
          holidays: [],
          
          // Set session durations based on specialization
          sessionDurations: {
            consultation: 30,
            abhyanga: therapist.availability.sessionDuration || 60,
            panchakarma: 60,
            shirodhara: 40
          },
          
          // Set buffer times
          bufferTimes: {
            consultation: 10,
            abhyanga: 15,
            panchakarma: 15,
            shirodhara: 15
          },
          
          // Default timezone
          timezone: 'Asia/Kolkata'
        };
        
        // Upsert availability document
        await Availability.findOneAndUpdate(
          { providerId: therapist._id },
          availabilityData,
          { 
            new: true, 
            upsert: true,
            setDefaultsOnInsert: true
          }
        );
        
        console.log(`✅ Migrated availability for therapist: ${therapist._id}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to migrate therapist ${therapist._id}:`, error.message);
      }
    }
    
    console.log(`🎉 Migration completed! Migrated ${migratedCount}/${therapists.length} therapists`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Main execution
async function main() {
  try {
    console.log('📡 Connecting to MongoDB...');
    console.log('🔗 URI:', process.env.MONGODB_URI);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Run migration
    await migrateTherapistAvailability();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('📡 MongoDB connection closed');
    }
    process.exit(0);
  }
}

// Run the migration
main();
