const { Notification } = require("../models");

exports.getAllNotifications = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const queryOptions = {
            order: [['createdAt', 'DESC']]
        };

        if (page) {
            queryOptions.limit = limit;
            queryOptions.offset = (page - 1) * limit;
            const { count, rows } = await Notification.findAndCountAll(queryOptions);
            return res.json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit),
                },
            });
        }

        const notifications = await Notification.findAll(queryOptions);
        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.count({ where: { isRead: false } });
        res.json({ success: true, count });
    } catch (error) {
        console.error("Get Unread Count Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }
        await notification.update({ isRead: true });
        res.json({ success: true, message: "Marked as read" });
    } catch (error) {
        console.error("Mark As Read Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update({ isRead: true }, { where: { isRead: false } });
        res.json({ success: true, message: "All marked as read" });
    } catch (error) {
        console.error("Mark All As Read Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
