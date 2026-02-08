import { format, differenceInDays } from 'date-fns';

/**
 * Separates transactions into expenses, investments and asset building.
 * @param {Array} allSpendData - List of all spending transactions.
 * @returns {Object} { expenses, investments, assetBuilding }
 */
export const separateTransactions = (allSpendData) => {
    // Normalizing category check to handle potential typos ("Assert" vs "Asset") in DB and case sensitivity
    const normalize = (str) => str ? str.trim().toLowerCase() : '';

    const isAssetBuilding = (name) => {
        const n = normalize(name);
        return n == 'asset building';
    };

    const isInvestment = (name) => normalize(name) === 'investments';

    const expenses = allSpendData.filter(item => !isInvestment(item.categoryName) && !isAssetBuilding(item.categoryName));
    const investments = allSpendData.filter(item => isInvestment(item.categoryName));
    const assetBuilding = allSpendData.filter(item => isAssetBuilding(item.categoryName));

    return { expenses, investments, assetBuilding };
};

/**
 * Calculates KPIs for the report.
 * @param {Array} spendings - Expense transactions (Excl Inv & Asset Building).
 * @param {Array} investments - Investment transactions.
 * @param {Array} assetBuilding - Asset Building transactions.
 * @param {Array} incomes - Income transactions.
 * @param {Object} dateRange - { from: Date, to: Date }
 * @returns {Object} KPI values
 */
export const calculateKPIs = (spendings, investments, assetBuilding, incomes, dateRange) => {
    const totalSpend = spendings.reduce((acc, item) => acc + item.amount, 0);
    const totalInvestments = investments.reduce((acc, item) => acc + item.amount, 0);
    const totalAssetBuilding = assetBuilding.reduce((acc, item) => acc + item.amount, 0);
    const totalIncome = incomes.reduce((acc, item) => acc + item.amount, 0);

    // Net Savings: Income - (Expenses + Asset Building)
    // As per request, Asset Building is removed from Net Savings (i.e. treated as an expense in this context)
    const netSavings = totalIncome - totalSpend - totalAssetBuilding;

    // Cash Available: Income - (Expenses + Investments + Asset Building)
    const cashAvailable = totalIncome - (totalSpend + totalInvestments + totalAssetBuilding);

    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;

    const daysDiff = dateRange?.from && dateRange?.to
        ? Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1)
        : 1;
    const avgDailySpend = totalSpend / daysDiff;

    return {
        totalSpend,
        totalInvestments,
        totalAssetBuilding,
        totalIncome,
        netSavings,
        cashAvailable,
        savingsRate,
        avgDailySpend
    };
};

/**
 * Processes data for Chart.js / Highcharts.
 * @param {Array} expenses - Filtered Expense transactions (for Pie/Bar).
 * @param {Array} allSpendings - All transactions including Inv & Asset Building (for Line Chart).
 * @param {Array} incomes - Income transactions.
 * @returns {Object} Structured data for charts { pieData, barData, lineData }
 */
export const processChartData = (expenses, allSpendings, incomes) => {
    // 1. Pie Chart (Category Breakdown) - Uses Filtered Expenses
    const categoryMap = {};
    expenses.forEach(item => {
        categoryMap[item.categoryName] = (categoryMap[item.categoryName] || 0) + item.amount;
    });
    const pieData = Object.entries(categoryMap).map(([name, y]) => ({ name, y }));

    // 2. Bar Chart (Subcategories) - Uses Filtered Expenses
    const subCategoryMap = {};
    expenses.forEach(item => {
        subCategoryMap[item.subCategoryName] = (subCategoryMap[item.subCategoryName] || 0) + item.amount;
    });
    const sortedSubCats = Object.entries(subCategoryMap).sort((a, b) => b[1] - a[1]); // All Subcategories
    const subCategoryBarData = {
        categories: sortedSubCats.map(i => i[0]),
        data: sortedSubCats.map(i => i[1])
    };

    // 3. Bar Chart (Categories) - Uses Filtered Expenses
    // We already have categoryMap from Pie chart step, re-use it or sort it for Bar chart
    const sortedCats = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const categoryBarData = {
        categories: sortedCats.map(i => i[0]),
        data: sortedCats.map(i => i[1])
    };

    // 3. Line Chart (Cash Flow: Income vs Spending) - Uses ALL Spendings (Inv + Asset Building included)
    const spendingMap = {};
    allSpendings.forEach(item => {
        const day = item.dateOfSpending?.split(' ')[0] || 'Unknown';
        spendingMap[day] = (spendingMap[day] || 0) + item.amount;
    });

    const incomeMap = {};
    incomes.forEach(item => {
        const day = item.dateOfIncome?.split(' ')[0] || 'Unknown';
        incomeMap[day] = (incomeMap[day] || 0) + item.amount;
    });

    // Union of all dates
    const allDates = new Set([...Object.keys(spendingMap), ...Object.keys(incomeMap)]);
    const sortedDates = Array.from(allDates).sort();

    // Calculate Cumulative Totals
    let runningSpending = 0;
    let runningIncome = 0;

    const cumulativeSpending = [];
    const cumulativeIncome = [];

    sortedDates.forEach(date => {
        runningSpending += (spendingMap[date] || 0);
        runningIncome += (incomeMap[date] || 0);
        cumulativeSpending.push(runningSpending);
        cumulativeIncome.push(runningIncome);
    });

    const lineData = {
        dates: sortedDates.map(d => format(new Date(d), 'MMM dd')),
        spending: cumulativeSpending,
        income: cumulativeIncome
    };

    return { pieData, subCategoryBarData, categoryBarData, lineData };
};

/**
 * Processes data for Sankey Chart (Financial Flow).
 * @param {Array} expenses - List of expenses.
 * @param {Array} incomes - List of incomes.
 * @returns {Array} List of [from, to, weight] tuples.
 */
export const processSankeyData = (expenses, incomes) => {
    const links = [];

    // 1. Income -> Wallet
    const incomeMap = {};
    let totalIncome = 0;

    incomes.forEach(item => {
        // Use a generic name if source is missing
        const source = item.source || item.sourceName || 'Income';
        incomeMap[source] = (incomeMap[source] || 0) + item.amount;
        totalIncome += item.amount;
    });

    Object.entries(incomeMap).forEach(([source, amount]) => {
        links.push([source, 'My Wallet', amount]);
    });

    // 2. Wallet -> Expenses (by Category)
    const expenseMap = {};
    let totalExit = 0;

    expenses.forEach(item => {
        expenseMap[item.categoryName] = (expenseMap[item.categoryName] || 0) + item.amount;
        totalExit += item.amount;
    });

    Object.entries(expenseMap).forEach(([category, amount]) => {
        links.push(['My Wallet', category, amount]);
    });

    // 3. Wallet -> Savings
    // Derived: Savings = Total Income - Total Expenses
    if (totalIncome > totalExit) {
        const savings = totalIncome - totalExit;
        links.push(['My Wallet', 'Savings', savings]);
    }

    return links;
};
