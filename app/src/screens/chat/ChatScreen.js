import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { TextInput, IconButton, ActivityIndicator } from 'react-native-paper';
import {
  GiftedChat,
  Bubble,
  Send,
  InputToolbar,
} from 'react-native-gifted-chat';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import socketService from '../../services/socketService';

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { user } = useAuth();

  const { storeId, storeName } = route.params;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    loadMessages();
    setupSocketListeners();

    return () => {
      // Leave chat room when component unmounts
      socketService.leaveChat(storeId);
      socketService.off('new-message', handleNewMessage);
    };
  }, [storeId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getMessages(storeId, { limit: 50 });

      if (response.success) {
        // Transform messages for GiftedChat format
        const transformedMessages = response.data.map((msg) => ({
          _id: msg._id,
          text: msg.message,
          createdAt: new Date(msg.timestamp),
          user: {
            _id: msg.senderId._id,
            name: msg.senderId.name,
            avatar: undefined, // Could add user avatar here
          },
          sent: true,
          received: msg.isDelivered,
          pending: false,
        }));

        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert(t('common.error'), t('chat.errorLoadingMessages'));
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Connect to socket if not already connected
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Join the chat room
    socketService.joinChat(storeId);

    // Listen for new messages
    socketService.on('new-message', handleNewMessage);
  };

  const handleNewMessage = (message) => {
    // Only add message if it's for this chat
    if (message.storeId === storeId) {
      const newMessage = {
        _id: message._id,
        text: message.message,
        createdAt: new Date(message.timestamp),
        user: {
          _id: message.senderId,
          name: message.senderName || 'Unknown',
          avatar: undefined,
        },
        sent: true,
        received: true,
        pending: false,
      };

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [newMessage]),
      );

      // Mark message as read if it's not from current user
      if (message.senderId !== user._id) {
        markMessageAsRead(message._id);
      }
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await chatAPI.markAsRead(messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const onSend = async (newMessages = []) => {
    const message = newMessages[0];

    try {
      // Optimistically add message to UI
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, newMessages),
      );

      // Send message via API
      const response = await chatAPI.sendMessage(storeId, {
        message: message.text,
        messageType: 'text',
      });

      if (response.success) {
        // Send message via socket for real-time delivery
        socketService.sendMessage(storeId, message.text);
      } else {
        // Remove message from UI if send failed
        setMessages((previousMessages) =>
          previousMessages.filter((msg) => msg._id !== message._id),
        );
        Alert.alert(t('common.error'), t('chat.errorSendingMessage'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove message from UI if send failed
      setMessages((previousMessages) =>
        previousMessages.filter((msg) => msg._id !== message._id),
      );
      Alert.alert(t('common.error'), t('chat.errorSendingMessage'));
    }
  };

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: theme.colors.primary,
          },
          left: {
            backgroundColor: theme.colors.surface,
          },
        }}
        textStyle={{
          right: {
            color: '#fff',
          },
          left: {
            color: theme.colors.text,
          },
        }}
      />
    );
  };

  const renderSend = (props) => {
    return (
      <Send {...props}>
        <View style={styles.sendButton}>
          <Ionicons name="send" size={24} color={theme.colors.primary} />
        </View>
      </Send>
    );
  };

  const renderInputToolbar = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={styles.inputPrimary}
      />
    );
  };

  const renderCustomView = () => {
    if (typing) {
      return (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{t('chat.typing')}</Text>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.storeName}>{storeName}</Text>
          <Text style={styles.onlineStatus}>
            {isOnline ? t('chat.online') : t('chat.offline')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('StoreDetail', { id: storeId })}
        >
          <Ionicons
            name="information-circle"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: user._id,
            name: user.name,
            avatar: undefined,
          }}
          renderBubble={renderBubble}
          renderSend={renderSend}
          renderInputToolbar={renderInputToolbar}
          renderCustomView={renderCustomView}
          placeholder={t('chat.typeMessage')}
          scrollToBottom
          scrollToBottomComponent={() => (
            <Ionicons
              name="chevron-down"
              size={24}
              color={theme.colors.primary}
            />
          )}
          infiniteScroll
          alwaysShowSend
          showUserAvatar={false}
          dateFormat="MMM DD, YYYY"
          timeFormat="HH:mm"
          messagesContainerStyle={styles.messagesContainer}
          bottomOffset={Platform.OS === 'ios' ? 0 : 0}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.small,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  onlineStatus: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  headerButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    backgroundColor: theme.colors.background,
  },
  inputToolbar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inputPrimary: {
    alignItems: 'center',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  typingText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.text,
  },
});
