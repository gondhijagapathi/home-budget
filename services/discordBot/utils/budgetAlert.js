const db = require('../../../models/dbConnection');

/**
 * Checks if adding an expense exceeds the budget and returns an alert message if so.
 * @param {string} categoryId 
 * @param {number} newAmount 
 * @param {string|Date} dateOfSpending 
 * @returns {Promise<string|null>} Alert message or null
 */
async function checkBudget(categoryId, newAmount, dateOfSpending = new Date()) {
    try {
        const date = new Date(dateOfSpending);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const monthStr = `${year}-${month}`;

        // 1. Get Category Name
        const catRes = await db('SELECT categoryName FROM category WHERE categoryId = ?', [categoryId]);
        if (catRes.length === 0) return null;
        const categoryName = catRes[0].categoryName;

        // 2. Get Budget
        // Try specific month first, then default
        const budgets = await db('SELECT amount, month FROM budget WHERE categoryId = ? AND (month = ? OR month IS NULL)', [categoryId, monthStr]);

        let budgetLimit = 0;
        const monthBudget = budgets.find(b => b.month === monthStr);
        const defaultBudget = budgets.find(b => b.month === null);

        if (monthBudget) {
            budgetLimit = parseFloat(monthBudget.amount);
        } else if (defaultBudget) {
            budgetLimit = parseFloat(defaultBudget.amount);
        }

        if (budgetLimit <= 0) return null; // No budget set

        // 3. Get Total Spend for Month (Existing + New)
        // Note: The new expense IS ALREADY in the DB when this is called from the controller?
        // If called POST-INSERT, we just query everything.
        // Let's assume this is called AFTER insert.

        const startOfMonth = `${year}-${month}-01`;
        const endOfMonth = new Date(year, month, 0).toISOString().slice(0, 10); // Last day

        const spendRes = await db(`
            SELECT SUM(amount) as total 
            FROM spendings 
            WHERE categoryId = ? 
            AND dateOfSpending >= ? AND dateOfSpending <= ?
        `, [categoryId, startOfMonth, endOfMonth]);

        const totalSpent = (spendRes[0].total || 0);
        // If the transaction wasn't committed yet (unlikely with MySQL default autocommit), we might need to add newAmount manually.
        // But Controller usually awaits the insert. So totalSpent includes newAmount.

        // 4. Check Thresholds
        const ratio = totalSpent / budgetLimit;

        if (ratio >= 1.0) {
            return `🚨 **BUDGET ALERT**: You have exceeded your **${categoryName}** budget!\nSpent: ₹${totalSpent} / ₹${budgetLimit}`;
        } else if (ratio >= 0.9) {
            return `⚠️ **NEAR BUDGET**: You are at **${Math.round(ratio * 100)}%** of your **${categoryName}** budget.\nSpent: ₹${totalSpent} / ₹${budgetLimit}`;
        }

        return null;

    } catch (error) {
        console.error('[BudgetAlert] Error checking budget:', error);
        return null;
    }
}

module.exports = { checkBudget };
