const util = require('util');
const mysql = require('mysql');

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('[DB] Missing required environment variables:', missingVars.join(', '));
    console.error('[DB] Please check your .env file');
    // Don't exit in production - let the app start and fail gracefully on first query
    if (process.env.NODE_ENV === 'development') {
        console.warn('[DB] Continuing in development mode, but queries will fail until DB is configured');
    }
}

const pool = mysql.createPool({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
    port     : process.env.DB_PORT || 3306,
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
});

// Test connection on startup
pool.getConnection((err, connection) => {
    if (err) {
        console.error('[DB] Failed to connect to database:', err.message);
        console.error('[DB] Check your DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, and DB_PORT settings');
        if (process.env.NODE_ENV === 'development') {
            console.warn('[DB] App will continue, but database queries will fail');
        }
    } else {
        console.log('[DB] Successfully connected to database');
        connection.release();
    }
});

// Promisify for Node.js async/await.
const originalQuery = util.promisify(pool.query).bind(pool);

const MAX_QUERY_LOG_LENGTH = 80;
const MAX_PARAMS_LOG = 3;

function getQuerySummary(sql) {
    const trimmed = (typeof sql === 'string' ? sql : '').trim();
    const type = trimmed.slice(0, 6).toUpperCase();
    if (type.startsWith('SELECT')) return 'SELECT';
    if (type.startsWith('INSERT')) return 'INSERT';
    if (type.startsWith('UPDATE')) return 'UPDATE';
    if (type.startsWith('DELETE')) return 'DELETE';
    return 'QUERY';
}

function truncateQuery(sql) {
    const s = (typeof sql === 'string' ? sql : '').replace(/\s+/g, ' ').trim();
    if (s.length <= MAX_QUERY_LOG_LENGTH) return s;
    return s.slice(0, MAX_QUERY_LOG_LENGTH) + '...';
}

function formatParams(params) {
    if (!params || params.length === 0) return '';
    if (params.length <= MAX_PARAMS_LOG) return JSON.stringify(params);
    return `[${params.length} params]`;
}

module.exports = async function(...args) {
    const query = args[0];
    const params = args.slice(1);
    const summary = getQuerySummary(query);
    const paramsStr = formatParams(params);

    console.log(`[DB] ${summary}`, paramsStr ? `(${paramsStr})` : '');
    try {
        const results = await originalQuery(...args);
        const rowInfo = results.affectedRows != null
            ? `${results.affectedRows} rows affected`
            : `${Array.isArray(results) ? results.length : 0} rows`;
        console.log(`[DB] ${summary} OK – ${rowInfo}`);
        return results;
    } catch (error) {
        console.error(`[DB] ${summary} ERROR:`, error.message);
        console.error(`[DB] SQL:`, truncateQuery(query), params.length ? formatParams(params) : '');
        throw error;
    }
};

