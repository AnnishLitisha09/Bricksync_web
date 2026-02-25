const { User } = require("../models");

/* 🔹 Get All Employees (Users with Role 2) */
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await User.findAll({
            where: { isDeleted: false, userRole: 2 },
            attributes: ['userid', 'name', 'staffRole']
        });

        // Map to match the expected frontend structure (employee_id, employee_name, staff_role)
        const mappedEmployees = employees.map(emp => ({
            employee_id: emp.userid,
            employee_name: emp.name,
            staff_role: emp.staffRole
                ? emp.staffRole.charAt(0).toUpperCase() + emp.staffRole.slice(1).toLowerCase()
                : null
        }));

        res.json({ data: mappedEmployees });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* 🔹 Create Employee */
exports.createEmployee = async (req, res) => {
    try {
        const employee = await Employee.create(req.body);
        res.status(201).json(employee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
