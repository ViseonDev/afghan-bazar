const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const Store = require('../models/Store');
const { validateMessage, validatePagination } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/chat/:storeId
// @desc    Get chat messages for a store
// @access  Private
router.get('/:storeId', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const store = await Store.findById(req.params.storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }
    
    // Check if user is the store owner or a shopper who has chatted with the store
    const isStoreOwner = store.ownerId.toString() === req.user._id.toString();
    
    let query = { storeId: req.params.storeId };
    
    if (!isStoreOwner) {
      // If not store owner, only show messages where user is sender or recipient
      query.$or = [
        { senderId: req.user._id },
        { recipientId: req.user._id }
      ];
    }
    
    const messages = await ChatMessage.find(query)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await ChatMessage.countDocuments(query);
    
    // Mark messages as read if user is recipient
    if (messages.length > 0) {
      await ChatMessage.updateMany(
        {
          storeId: req.params.storeId,
          recipientId: req.user._id,
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );
    }
    
    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching chat messages'
    });
  }
});

// @route   POST /api/chat/:storeId
// @desc    Send a chat message
// @access  Private
router.post('/:storeId', validateMessage, async (req, res) => {
  try {
    const { message, messageType = 'text', attachments } = req.body;
    
    const store = await Store.findById(req.params.storeId).populate('ownerId');
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }
    
    // Determine recipient based on sender
    let recipientId;
    if (store.ownerId._id.toString() === req.user._id.toString()) {
      // Store owner is sending, need to find the shopper
      // For now, we'll use a simple approach - this would need more logic in a real app
      recipientId = req.body.recipientId;
      if (!recipientId) {
        return res.status(400).json({
          success: false,
          error: 'Recipient ID is required when store owner sends message'
        });
      }
    } else {
      // Shopper is sending to store owner
      recipientId = store.ownerId._id;
    }
    
    const chatMessage = new ChatMessage({
      storeId: req.params.storeId,
      senderId: req.user._id,
      recipientId,
      message,
      messageType,
      attachments,
      timestamp: new Date()
    });
    
    await chatMessage.save();
    
    // Populate sender and recipient info
    await chatMessage.populate('senderId', 'name email');
    await chatMessage.populate('recipientId', 'name email');
    
    logger.info(`Chat message sent in store ${req.params.storeId} by user ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: chatMessage
    });
  } catch (error) {
    logger.error('Send chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while sending message'
    });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get all conversations for the current user
// @access  Private
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all unique conversations for the user
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { recipientId: userId }
          ]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$storeId',
          lastMessage: { $first: '$message' },
          lastMessageType: { $first: '$messageType' },
          lastTimestamp: { $first: '$timestamp' },
          lastSenderId: { $first: '$senderId' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipientId', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: '_id',
          as: 'store'
        }
      },
      {
        $unwind: '$store'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastSenderId',
          foreignField: '_id',
          as: 'lastSender'
        }
      },
      {
        $unwind: '$lastSender'
      },
      {
        $sort: { lastTimestamp: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching conversations'
    });
  }
});

// @route   PUT /api/chat/:messageId/read
// @desc    Mark a message as read
// @access  Private
router.put('/:messageId/read', async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    // Only recipient can mark message as read
    if (message.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mark this message as read'
      });
    }
    
    message.isRead = true;
    message.readAt = new Date();
    await message.save();
    
    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    logger.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while marking message as read'
    });
  }
});

// @route   DELETE /api/chat/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/:messageId', async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    // Only sender can delete message
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }
    
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting message'
    });
  }
});

module.exports = router;