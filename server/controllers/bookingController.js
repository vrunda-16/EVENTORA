const Booking = require('../models/Bookings');
const OTP = require('../models/OTP');
const Event = require('../models/Event');
const {sendOTPEmail, sendBookingEmail} = require('../utils/email');

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendBookingOTP = async (req, res) => {
    const opt = generateOtp();
    await OTP.findOneAndDelete({ email: req.user.email, action: 'booking_verification' });
    await OTP.create({ email: req.user.email, otp: opt, action: 'booking_verification' });
    await sendOTPEmail(req.user.email, opt, 'event_booking');
}

const bookEvent = async (req, res) => {
    const { eventId, otp } = req.body;
    
    const otpRecord = await OTP.findOne({ email: req.user.email, otp, action: 'booking_verification' });
    if(!otpRecord) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const event = await Event.findById(eventId);
    if(!event) {
        return res.status(404).json({ message: 'Event not found' });
    }

    if(event.totalSeats <= 0) {
        return res.status(400).json({ message: 'No seats available' });
    }

    const existingBooking = await Booking.findOne({ user: req.user._id, event: eventId });
    if(existingBooking) {
        return res.status(400).json({ message: 'You have already booked this event' });
    }

    const booking = await Booking.create({
        userId: req.user._id,
        eventId,
        status: 'pending',
        paymentStatus:'non_paid',
        amount: event.ticketPrice
    });

    await OTP.deleteMany({ email: req.user.email, action: 'event_booking' });
    res.status(201).json({message: 'Booking successful, please proceed to payment', bookingId: booking._id});
};

const confirmBooking = async (req, res) => {
    const paymentStatus = req.body.paymentStatus;
    if(!['paid', 'non_paid'].includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' });
    }

    const booking = await Booking.findById(req.params.id).populate('eventId');
    if(!booking) {
        return  res.status(404).json({error: 'Booking not found'});
    }

    if(booking.status !== 'confirmed') {
        return res.status(400).json({ error: 'Booking is already confirmed' });
    }

    const event = await Event.findById(booking.eventId);
    if(event.totalSeats <= 0) {
        return res.status(400).json({ error: 'No seats available' });
    }

    booking.status = 'confirmed';
    if(paymentStatus) {
        booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    event.totalSeats -= 1;
    await event.save();

    //admin confirm booking and send email to user
    await sendBookingEmail(req.user.email, event.title, booking._id);

    res.json({ message: 'Booking confirmed'});
};
const getMyBookings = async (req, res) => {
    const bookings = await Booking.find({ userId: req.user._id }).populate('eventId');
    res.json(bookings);
}

const cancelBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate('eventId');
    if(!booking) {
        return res.status(404).json({ error: 'Booking not found' });
    }

    if(booking.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    booking.status = 'cancelled';
    await booking.save();
    
    if(booking.status === 'cancelled') {
        const event = await Event.findById(booking.eventId);
        event.totalSeats += 1;
        await event.save();
    }

    await booking.remove();
    res.json({ message: 'Booking cancelled' });

};

module.exports = {
    bookEvent,
    sendBookingOTP,
    getMyBookings,
    confirmBooking,
    cancelBooking
};

