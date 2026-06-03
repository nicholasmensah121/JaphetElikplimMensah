const Contact = require('../models/Contact');

// Contact Controller
// Handles contact form submissions

// Submit contact form
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, newsletter } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, subject, message)',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();
    const normalizedSubject = String(subject).trim();
    const normalizedMessage = String(message).trim();
    const normalizedPhone = phone ? String(phone).trim() : '';

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate phone if provided
    if (normalizedPhone) {
      const cleanedPhone = normalizedPhone.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^[\+]?[0-9]{7,15}$/;
      if (!phoneRegex.test(cleanedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number',
        });
      }
    }

    // Validate message length
    if (normalizedMessage.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long',
      });
    }

    const contact = await Contact.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      subject: normalizedSubject,
      message: normalizedMessage,
      newsletter: Boolean(newsletter),
    });

    return res.status(201).json({
      success: true,
      message: 'Your message has been received successfully. We will get back to you soon!',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

// Get all contact messages (admin only)
exports.getAllContactMessages = async (req, res, next) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Contact messages retrieved',
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// Get contact message by ID (admin only)
exports.getContactMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await Contact.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Contact message retrieved',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

// Delete contact message (admin only)
exports.deleteContactMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedMessage = await Contact.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
