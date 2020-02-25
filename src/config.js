module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || "development",
    DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://dunder_mifflin@localhost/travelog",
    TEST_DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://dunder_mifflin@localhost/travelog-test",
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY: process.env.JWT_EXPIRY,
    API_KEY: process.env.API_KEY
};
