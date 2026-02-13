const db = require('../models/dbConnection');

exports.deleteLatestAssessment = async (req, res) => {
    try {
        // Delete the most recent WEEKLY_ASSESSMENT
        // This allows the scheduler to recreate it if it runs again
        const result = await db(
            "DELETE FROM report_logs WHERE reportType = 'WEEKLY_ASSESSMENT' ORDER BY timestamp DESC LIMIT 1"
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No weekly assessment found to delete." });
        }

        res.json({ message: "Latest weekly assessment log deleted successfully. You can now trigger the bot to regenerate it." });
    } catch (error) {
        console.error("Error deleting latest assessment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.deleteAssessmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db("DELETE FROM report_logs WHERE logId = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Assessment not found." });
        }

        res.json({ message: "Assessment deleted successfully." });
    } catch (error) {
        console.error("Error deleting assessment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
