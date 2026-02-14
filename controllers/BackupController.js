const db = require('../models/dbConnection');
const util = require('util');

const BackupController = {
    getBackup: async function (req, res) {
        try {
            // Fetch data from all tables
            const tables = ['users', 'category', 'subCategory', 'spendings', 'incomeSource', 'income', 'cycle_reports', 'advisor_context', 'report_logs', 'gemini_usage', 'budget'];
            const backupData = {};

            for (const table of tables) {
                const data = await db(`SELECT * FROM ${table}`);
                backupData[table] = data;
            }

            const timestamp = new Date().toISOString();
            const filename = `home-budget-backup-${timestamp}.json`;

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.json(backupData);

        } catch (error) {
            console.error('[Backup] Error creating backup:', error);
            res.status(500).json({ error: 'Internal Server Error during backup' });
        }
    },

    restoreBackup: async function (req, res) {
        let connection;
        try {
            const backupData = req.body;

            if (!backupData || typeof backupData !== 'object') {
                return res.status(400).json({ error: 'Invalid backup data format' });
            }

            const tables = ['users', 'category', 'subCategory', 'spendings', 'incomeSource', 'income', 'cycle_reports', 'advisor_context', 'report_logs', 'gemini_usage', 'budget'];

            // Validate structure roughly
            for (const table of tables) {
                if (backupData[table] !== undefined && !Array.isArray(backupData[table])) {
                    return res.status(400).json({ error: `Invalid data for table ${table}` });
                }
            }

            // Get a dedicated connection from the pool
            connection = await new Promise((resolve, reject) => {
                db.pool.getConnection((err, conn) => {
                    if (err) reject(err);
                    else resolve(conn);
                });
            });

            // Promisify query for this connection
            const query = util.promisify(connection.query).bind(connection);

            // 1. Disable FK checks on this connection
            await query('SET FOREIGN_KEY_CHECKS = 0');

            try {
                // 2. Empty all tables (Use DELETE FROM to be strictly safer with FKs than TRUNCATE)
                // Order doesn't strictly matter with FK checks off, but let's do it.
                for (const table of tables) {
                    await query(`DELETE FROM ${table}`);
                }

                // 3. Insert data
                for (const table of tables) {
                    const rows = backupData[table];
                    if (rows && rows.length > 0) {
                        const columns = Object.keys(rows[0]);
                        const values = rows.map(row => columns.map(col => {
                            let val = row[col];
                            // Basic date string handling
                            if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
                                return new Date(val);
                            }
                            return val;
                        }));

                        const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES ?`;
                        await query(sql, [values]);
                    }
                }

                res.json({ message: 'Database restored successfully' });

            } catch (err) {
                console.error('[Backup] Transaction failed, state unknown:', err);
                throw err;
            } finally {
                // 4. Re-enable FK checks
                await query('SET FOREIGN_KEY_CHECKS = 1');
            }

        } catch (error) {
            console.error('[Backup] Error restoring backup:', error);
            res.status(500).json({ error: 'Internal Server Error during restore: ' + error.message });
        } finally {
            if (connection) connection.release();
        }
    }
};

module.exports = BackupController;
