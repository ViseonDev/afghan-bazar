import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Card, Badge, Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import socketService from '../../services/socketService';

export default function ConversationsScreen() {
  const navigation = useNavigation();
  const { t, formatDate } = useLanguage();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadConversations();
        setupSocketListeners();
      }

      return () => {
        // Cleanup socket listeners when screen loses focus
        socketService.off('new-message', handleNewMessage);
      };
    }, [user]),
  );

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversations();

      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupSocketListeners = () => {
    // Connect to socket if not already connected
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Listen for new messages
    socketService.on('new-message', handleNewMessage);
  };

  const handleNewMessage = (message) => {
    // Update the conversations list with the new message
    setConversations((prevConversations) => {
      const updatedConversations = [...prevConversations];
      const conversationIndex = updatedConversations.findIndex(
        (conv) => conv._id === message.storeId,
      );

      if (conversationIndex !== -1) {
        // Update existing conversation
        updatedConversations[conversationIndex] = {
          ...updatedConversations[conversationIndex],
          lastMessage: message.message,
          lastTimestamp: message.timestamp,
          lastSenderId: message.senderId,
          unreadCount:
            message.recipientId === user._id
              ? updatedConversations[conversationIndex].unreadCount + 1
              : updatedConversations[conversationIndex].unreadCount,
        };

        // Move to top
        const updatedConversation = updatedConversations.splice(
          conversationIndex,
          1,
        )[0];
        updatedConversations.unshift(updatedConversation);
      }

      return updatedConversations;
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleConversationPress = (conversation) => {
    navigation.navigate('Chat', {
      storeId: conversation._id,
      storeName: conversation.store.name,
    });
  };

  const filteredConversations = conversations.filter((conversation) =>
    conversation.store.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const ConversationItem = ({ item }) => {
    const isFromCurrentUser = item.lastSenderId === user._id;
    const hasUnreadMessages = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          hasUnreadMessages && styles.unreadConversation,
        ]}
        onPress={() => handleConversationPress(item)}
      >
        <Image
          source={{ uri: item.store.coverImage || item.store.images?.[0] }}
          style={styles.storeImage}
          defaultSource={require('../../../assets/placeholder.png')}
        />

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.storeName, hasUnreadMessages && styles.unreadText]}
            >
              {item.store.name}
            </Text>
            <Text style={styles.timestamp}>
              {formatDate(item.lastTimestamp, 'short')}
            </Text>
          </View>

          <View style={styles.messagePreview}>
            <Text
              style={[
                styles.lastMessage,
                hasUnreadMessages && styles.unreadText,
              ]}
              numberOfLines={1}
            >
              {isFromCurrentUser ? `${t('common.you')}: ` : ''}
              {item.lastMessage}
            </Text>

            {hasUnreadMessages && (
              <Badge visible={true} style={styles.unreadBadge} size={20}>
                {item.unreadCount}
              </Badge>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles" size={64} color={theme.colors.placeholder} />
      <Text style={styles.emptyText}>{t('chat.noConversations')}</Text>
      <Text style={styles.emptySubtext}>{t('chat.startConversation')}</Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>{t('chat.conversations')}</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('chat.searchConversations')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={({ item }) => <ConversationItem item={item} />}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          filteredConversations.length === 0 ? styles.emptyList : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    elevation: 2,
    ...theme.shadows.small,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    ...theme.shadows.small,
  },
  unreadConversation: {
    backgroundColor: theme.colors.primary + '10',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  storeImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.neutral[100],
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  unreadText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.placeholder,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 8,
    textAlign: 'center',
  },
});
