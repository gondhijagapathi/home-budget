const cron = require('node-cron');
const db = require('../../models/dbConnection');
const { sendMessage } = require('./bot');
const { generateFinancialReport } = require('./financialAdvisor');

// Helper to get ISO week number
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

async function checkAndRunWeeklyAssessment() {
    console.log('[Scheduler] Checking if weekly assessment is due...');
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();

    // Check if we already ran for this week
    // We look for 'WEEKLY_ASSESSMENT' type logs created in the last 7 days that match current week logic 
    // Simplified: Just order by date desc and see if the last one was this week.

    // Actually, let's just check if there is an entry for this week/year
    // Since SQL doesn't have a simple ISO week function that matches JS exactly everywhere, 
    // we'll rely on the application logic: "Did we run it this week?"
    // A simple heuristic: Did we run it in the current week window (Monday-Sunday)?

    // Retrieve the last assessment date
    const rows = await db(
        `SELECT timestamp FROM report_logs WHERE reportType = 'WEEKLY_ASSESSMENT' ORDER BY timestamp DESC LIMIT 1`
    );

    let shouldRun = true;
    if (rows.length > 0) {
        const lastRunDate = new Date(rows[0].timestamp);
        const lastRunWeek = getWeekNumber(lastRunDate);
        const lastRunYear = lastRunDate.getFullYear();

        if (lastRunYear === currentYear && lastRunWeek === currentWeek) {
            shouldRun = false;
            console.log(`[Scheduler] Weekly assessment already sent for Week ${currentWeek}, Year ${currentYear}.`);
        }
    }

    if (shouldRun) {
        console.log('[Scheduler] Generating weekly assessment...');
        const report = await generateFinancialReport();

        if (report) {
            await sendMessage(report);

            // Log to DB
            // We use report_logs now.
            // Columns: logId, reportType, timestamp
            await db(
                `INSERT INTO report_logs (reportType, timestamp) VALUES (?, NOW())`,
                ['WEEKLY_ASSESSMENT']
            );
            console.log('[Scheduler] Assessment sent and logged.');
        }
    }
}

function initScheduler() {
    // Schedule to run every Monday at 9:00 AM
    cron.schedule('0 9 * * 1', () => {
        checkAndRunWeeklyAssessment();
    });

    // Also run a check on startup, in case we missed the cron (e.g. server was down)
    // Delay slightly to ensure DB connection
    setTimeout(() => {
        checkAndRunWeeklyAssessment();
    }, 5000);
}

module.exports = {
    initScheduler,
    checkAndRunWeeklyAssessment // Export for manual triggering if needed
};
