const db = require("../models");
const Attendance = db.Attendance;
const { Op } = require("sequelize");

/**
 * body format:
 * {
 *   userid: 2,
 *   records: [
 *     { date:"2026-02-16", forenoon:true, afternoon:false },
 *     ...
 *   ]
 * }
 */
exports.saveAttendance = async (req, res) => {
  try {
    const { userid, records } = req.body;

    const ops = records.map(async (r) => {
      const existing = await Attendance.findOne({
        where: { userid, date: r.date },
      });

      if (existing) {
        return existing.update({
          forenoon: r.forenoon,
          afternoon: r.afternoon,
        });
      }

      return Attendance.create({
        userid,
        date: r.date,
        forenoon: r.forenoon,
        afternoon: r.afternoon,
      });
    });

    await Promise.all(ops);

    res.json({ message: "Attendance saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getWeeklyAttendance = async (req, res) => {
  try {
    const { userid, start, end } = req.query;

    const data = await Attendance.findAll({
      where: {
        userid,
        date: {
          [Op.between]: [start, end],
        },
      },
      order: [["date", "ASC"]],
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMonthlyPresentCount = async (req, res) => {
  try {
    const { userid, year, month } = req.query;

    const start = `${year}-${month}-01`;
    const end = new Date(year, month, 0).toISOString().slice(0, 10);

    const records = await Attendance.findAll({
      where: {
        userid,
        date: { [Op.between]: [start, end] },
        [Op.or]: [
          { forenoon: true },
          { afternoon: true },
        ],
      },
    });

    res.json({ presentDays: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getYearlyPresentCount = async (req, res) => {
  try {
    const { userid, year } = req.query;

    const records = await Attendance.findAll({
      where: {
        userid,
        date: {
          [Op.between]: [
            `${year}-01-01`,
            `${year}-12-31`,
          ],
        },
        [Op.or]: [
          { forenoon: true },
          { afternoon: true },
        ],
      },
    });

    res.json({ presentDays: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Fetch all users who are drivers/staff (role 2 is usually driver/staff based on Topbar config)
    // Actually, let's fetch all users and then join with attendance for today
    const users = await db.User.findAll({
      where: {
        userRole: 2, // Driver role
        isDeleted: false
      },
      attributes: ['userid', 'name'],
      include: [{
        model: Attendance,
        where: { date: today },
        required: false
      }]
    });

    res.json(users);
  } catch (err) {
    console.error("Get Today Attendance Error:", err);
    res.status(500).json({ error: err.message });
  }
};
