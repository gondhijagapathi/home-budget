const db = require('./dbConnection');

const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    personId VARCHAR(255) NOT NULL,
    userName VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    lastActive DATETIME,
    createdAt DATETIME,
    PRIMARY KEY (personId),
    UNIQUE KEY (userName)
)`;

const createCategoryTable = `
CREATE TABLE IF NOT EXISTS category (
    categoryId VARCHAR(200) NOT NULL,
    categoryName VARCHAR(200) NOT NULL,
    PRIMARY KEY (categoryId),
    UNIQUE KEY (categoryName)
)`;

const createSubCategoryTable = `
CREATE TABLE IF NOT EXISTS subCategory (
    subCategoryId VARCHAR(200) NOT NULL,
    subCategoryName VARCHAR(200) NOT NULL,
    categoryId VARCHAR(200) NOT NULL,
    PRIMARY KEY (subCategoryId),
    UNIQUE KEY (subCategoryName),
    KEY (categoryId)
)`;

const createSpendingsTable = `
CREATE TABLE IF NOT EXISTS spendings (
    spendingId VARCHAR(200) NOT NULL,
    categoryId VARCHAR(200),
    subCategoryId VARCHAR(200),
    userId VARCHAR(200),
    amount INT,
    dateOfSpending DATETIME,
    PRIMARY KEY (spendingId),
    KEY (categoryId),
    KEY (subCategoryId),
    KEY (userId)
)`;

const createIncomeSourceTable = `
CREATE TABLE IF NOT EXISTS incomeSource (
    incomeSourceId VARCHAR(200) NOT NULL,
    sourceName VARCHAR(200) NOT NULL,
    PRIMARY KEY (incomeSourceId),
    UNIQUE KEY (sourceName)
)`;

const createIncomeTable = `
CREATE TABLE IF NOT EXISTS income (
    incomeId VARCHAR(200) NOT NULL,
    incomeSourceId VARCHAR(200) NOT NULL,
    userId VARCHAR(200) NOT NULL,
    amount INT,
    dateOfIncome DATETIME,
    description TEXT,
    PRIMARY KEY (incomeId),
    KEY (incomeSourceId),
    KEY (userId)
)`;

const definedTables = [
    { name: 'users', query: createUsersTable },
    { name: 'category', query: createCategoryTable },
    { name: 'subCategory', query: createSubCategoryTable },
    { name: 'spendings', query: createSpendingsTable },
    { name: 'incomeSource', query: createIncomeSourceTable },
    { name: 'income', query: createIncomeTable },
    {
        name: 'ai_insights', query: `
        CREATE TABLE IF NOT EXISTS ai_insights (
            insightId VARCHAR(200) NOT NULL,
            userId VARCHAR(200),
            dateOfInsight DATE NOT NULL,
            content TEXT,
            createdAt DATETIME,
            PRIMARY KEY (insightId),
            KEY (userId),
            KEY (dateOfInsight)
        )`
    },
    {
        name: 'gemini_usage', query: `
        CREATE TABLE IF NOT EXISTS gemini_usage (
            usageId VARCHAR(200) NOT NULL,
            model VARCHAR(100),
            inputTokens INT,
            outputTokens INT,
            totalTokens INT,
            purpose VARCHAR(255),
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (usageId),
            KEY (timestamp)
        )`
    }
];

const triggersExact = [
    {
        name: 'users_trigger',
        drop: 'DROP TRIGGER IF EXISTS users_trigger',
        create: `CREATE TRIGGER users_trigger BEFORE INSERT ON users FOR EACH ROW BEGIN IF NEW.personId IS NULL OR NEW.personId = '' THEN SET NEW.personId = UUID(); END IF; END`
    },
    {
        name: 'category_trigger',
        drop: 'DROP TRIGGER IF EXISTS category_trigger',
        create: `CREATE TRIGGER category_trigger BEFORE INSERT ON category FOR EACH ROW BEGIN IF NEW.categoryId IS NULL OR NEW.categoryId = '' THEN SET NEW.categoryId = UUID(); END IF; END`
    },
    {
        name: 'subCategory_triggers',
        drop: 'DROP TRIGGER IF EXISTS subCategory_triggers',
        create: `CREATE TRIGGER subCategory_triggers BEFORE INSERT ON subCategory FOR EACH ROW BEGIN IF NEW.subCategoryId IS NULL OR NEW.subCategoryId = '' THEN SET NEW.subCategoryId = UUID(); END IF; END`
    },
    {
        name: 'spending_trigger',
        drop: 'DROP TRIGGER IF EXISTS spending_trigger',
        create: `CREATE TRIGGER spending_trigger BEFORE INSERT ON spendings FOR EACH ROW BEGIN IF NEW.spendingId IS NULL OR NEW.spendingId = '' THEN SET NEW.spendingId = UUID(); END IF; END`
    },
    {
        name: 'incomeSource_trigger',
        drop: 'DROP TRIGGER IF EXISTS incomeSource_trigger',
        create: `CREATE TRIGGER incomeSource_trigger BEFORE INSERT ON incomeSource FOR EACH ROW BEGIN IF NEW.incomeSourceId IS NULL OR NEW.incomeSourceId = '' THEN SET NEW.incomeSourceId = UUID(); END IF; END`
    },
    {
        name: 'income_trigger',
        drop: 'DROP TRIGGER IF EXISTS income_trigger',
        create: `CREATE TRIGGER income_trigger BEFORE INSERT ON income FOR EACH ROW BEGIN IF NEW.incomeId IS NULL OR NEW.incomeId = '' THEN SET NEW.incomeId = UUID(); END IF; END`
    },
    {
        name: 'ai_insights_trigger',
        drop: 'DROP TRIGGER IF EXISTS ai_insights_trigger',
        create: `CREATE TRIGGER ai_insights_trigger BEFORE INSERT ON ai_insights FOR EACH ROW BEGIN IF NEW.insightId IS NULL OR NEW.insightId = '' THEN SET NEW.insightId = UUID(); END IF; END`
    },
    {
        name: 'gemini_usage_trigger',
        drop: 'DROP TRIGGER IF EXISTS gemini_usage_trigger',
        create: `CREATE TRIGGER gemini_usage_trigger BEFORE INSERT ON gemini_usage FOR EACH ROW BEGIN IF NEW.usageId IS NULL OR NEW.usageId = '' THEN SET NEW.usageId = UUID(); END IF; END`
    }
];



async function initSchema() {
    try {
        console.log('[Schema-Init] Checking database schema...');

        // --- TABLES ---
        // Get existing tables to log whether they are new or existing
        const existingTablesRes = await db('SHOW TABLES');
        // Result is like [ { "Tables_in_homedb": "category" }, ... ]
        // We use Object.values(row)[0] to be database-name agnostic
        const existingTableNames = new Set(existingTablesRes.map(row => Object.values(row)[0]));

        for (const table of definedTables) {
            if (existingTableNames.has(table.name)) {
                console.log(`[Schema-Init] Table already exists: ${table.name}`);
            } else {
                await db(table.query);
                console.log(`[Schema-Init] Created table: ${table.name}`);
            }
        }

        console.log('[Schema-Init] Tables check complete.');

        // --- TRIGGERS ---
        // Always Drop and Recreate triggers to ensure latest logic
        for (const trigger of triggersExact) {
            await db(trigger.drop);
            await db(trigger.create);
            console.log(`[Schema-Init] Updated trigger: ${trigger.name}`);
        }

        console.log('[Schema-Init] Schema initialization complete.');
    } catch (error) {
        console.error('[Schema-Init] Fatal Error initializing schema:', error);
        throw error; // Propagate error to stop server
    }
}

module.exports = initSchema;
