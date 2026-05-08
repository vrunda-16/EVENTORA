const Event = require('../models/Event');

// Get All Events
exports.getAllEvents = async (req, res) => {
    try {

        const filters = {};
        if (req.query.category) {
            filters.category = req.query.category;
        }
        if (req.query.ticketPrice) {
            filters.ticketPrice = req.query.ticketPrice;
        }

        const events = await Event.find(filters);
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create New Event (Admin Only)
exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, totalSeats, ticketPrice, imageUrl } = req.body;
        const event = await Event.create({
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            availableSeats: totalSeats,
            ticketPrice: ticketPrice || 0,
            imageUrl: imageUrl || '',
            createdBy: req.user.id
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Update Event (Admin Only)
exports.updateEvent = async (req, res) => {
        try {
            const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!event) return res.status(404).json({ message: 'Event not found' });
            res.json(event);
        } catch (error) {
            res.status(500).json({ message: 'Server Error', error: error.message });
        }
};

// exports.updateEvent = async (req, res) => {
//     const { title, description, date, location, category, totalSeats, ticketPrice, imageUrl } = req.body;
//     try {
//         const event = await Event.findByIdAndUpdate(req.params.id, {
//             title,
//             description,
//             date,
//             location,
//             category,
//             totalSeats,
//             ticketPrice,
//             imageUrl
//         }, { new: true });
//         if (!event) {
//             return res.status(404).json({ message: 'Event not found' });
//         }
//         res.json(event);
//     }
//     catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

// Delete Event (Admin Only)
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

