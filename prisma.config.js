module.exports = {
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'mongodb://localhost:27017/medication_forum',
        },
    },
};
