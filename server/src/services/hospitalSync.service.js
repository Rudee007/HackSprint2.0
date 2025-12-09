const axios = require('axios');

class SyncPatientsFromHospital {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
    }

    async fetchHospitalData() {
        try {
            const response = await axios.get(this.apiEndpoint);
            return response.data;
        } catch (error) {
            console.error('Error fetching hospital data:', error.message);
            throw new Error('Failed to fetch hospital data');
        }
    }

    async syncHospitalData(databaseService) {
        try {
            const hospitalData = await this.fetchHospitalData();
            for (const hospital of hospitalData) {
                await databaseService.upsertHospital(hospital);
            }
            console.log('Hospital data synced successfully');
        } catch (error) {
            console.error('Error syncing hospital data:', error.message);
            throw new Error('Failed to sync hospital data');
        }
    }
}

module.exports = SyncPatientsFromHospital;