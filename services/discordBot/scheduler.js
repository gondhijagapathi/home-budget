const cron = require('node-cron');
const db = require('../../models/dbConnection');
const { sendMessage } = require('./bot');
const { generateFinancialReport, checkDataAvailability } = require('./financialAdvisor');

async function checkAndRunMonthlyAssessment() {
    console.log('[Scheduler] Checking if monthly assessment is due...');
    const now = new Date();

    // Calculate the "last closed cycle"
    // If today is Feb 14, current cycle is Jan 26 - Feb 25 (not closed).
    // Last closed cycle was Dec 26 - Jan 25.

    // Logic: 
    // If today >= 26th, the cycle that just finished ended on the 25th of THIS month.
    // If today < 26th, the cycle that just finished ended on the 25th of LAST month.

    let cycleStartDate, cycleEndDate;

    if (now.getDate() >= 26) {
        // Cycle ended on the 25th of THIS month
        // Start: 26th of LAST month
        // End: 25th of THIS month
        cycleStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 26);
        cycleEndDate = new Date(now.getFullYear(), now.getMonth(), 25);
    } else {
        // Cycle ended on the 25th of LAST month
        // Start: 26th of 2 months ago
        // End: 25th of LAST month
        cycleStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 26);
        cycleEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 25);
    }

    // Format dates for DB (YYYY-MM-DD)
    const startDateStr = cycleStartDate.toISOString().slice(0, 10);
    const endDateStr = cycleEndDate.toISOString().slice(0, 10);

    console.log(`[Scheduler] Targeting cycle: ${startDateStr} to ${endDateStr}`);

    try {
        // 1. Check if we already sent a report for this cycle
        const existingDetails = await db(
            'SELECT reportId, status FROM cycle_reports WHERE cycleStartDate = ? AND cycleEndDate = ? AND status = "SUCCESS"',
            [startDateStr, endDateStr]
        );

        if (existingDetails.length > 0) {
            console.log(`[Scheduler] Report for cycle ${startDateStr} to ${endDateStr} already sent.`);
            return;
        }

        // 2. Check if data is complete
        // We need data for the 25th (or later) to consider the cycle "complete" regarding data ingestion.
        // User requested: "only run it has complete data either it has data 25th and assesment for that month didnt run yet, or we have data for 26 or future dates"

        const isDataReady = await checkDataAvailability(cycleStartDate, cycleEndDate);

        if (!isDataReady) {
            console.log(`[Scheduler] Data not complete for cycle ${startDateStr} to ${endDateStr}. Waiting for data...`);
            return;
        }

        // 3. Generate Report
        console.log('[Scheduler] Generating monthly assessment...');
        const report = await generateFinancialReport(cycleStartDate, cycleEndDate);

        if (report) {
            await sendMessage(report);

            // 4. Log success
            await db(
                `INSERT INTO cycle_reports (cycleStartDate, cycleEndDate, status) VALUES (?, ?, 'SUCCESS')`,
                [startDateStr, endDateStr]
            );
            console.log('[Scheduler] Monthly assessment sent and logged.');
        }

    } catch (error) {
        console.error('[Scheduler] Error in monthly assessment check:', error);
    }
}

function initScheduler() {
    // Schedule to run every day at 9:00 AM
    cron.schedule('0 9 * * *', () => {
        checkAndRunMonthlyAssessment();
    });

    // Also run a check on startup
    setTimeout(() => {
        checkAndRunMonthlyAssessment();
    }, 5000);
}

module.exports = {
    initScheduler,
    checkAndRunMonthlyAssessment
};
