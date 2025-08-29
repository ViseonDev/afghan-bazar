import io from 'socket.io-client';
import { getItem } from './storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  async connect() {
    try {
      const token = await AsyncStorage.getItem('token');
      const API_URL =
        process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

      if (!token) {
        console.log('No token found, cannot connect to socket');
        return;
      }

      this.socket = io(API_URL, {
        auth: {
          token: token,
        },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Connected to socket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Handle incoming messages
      this.socket.on('new-message', (message) => {
        console.log('New message received:', message);
        this.notifyListeners('new-message', message);
      });

      return this.socket;
    } catch (error) {
      console.error('Error connecting to socket:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Join a specific chat room
  joinChat(storeId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-chat', storeId);
      console.log(`Joined chat for store: ${storeId}`);
    }
  }

  // Leave a specific chat room
  leaveChat(storeId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave-chat', storeId);
      console.log(`Left chat for store: ${storeId}`);
    }
  }

  // Send a message
  sendMessage(storeId, message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send-message', {
        storeId,
        message,
      });
      console.log(`Message sent to store ${storeId}:`, message);
    } else {
      console.error('Socket not connected, cannot send message');
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Notify all listeners for an event
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in socket listener:', error);
        }
      });
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
