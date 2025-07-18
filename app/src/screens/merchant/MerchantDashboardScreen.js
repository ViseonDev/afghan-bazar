import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Card, Button, IconButton, Chip, FAB, ProgressBar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { storesAPI, productsAPI, usersAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function MerchantDashboardScreen() {
  const navigation = useNavigation();
  const { t, formatDate } = useLanguage();
  const { user } = useAuth();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [selectedPeriod])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load merchant dashboard data
      const response = await usersAPI.getMerchantDashboard({
        period: selectedPeriod,
      });
      
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert(t('common.error'), t('merchant.errorLoadingDashboard'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleCreateStore = () => {
    navigation.navigate('CreateStore');
  };

  const handleCreateProduct = () => {
    navigation.navigate('CreateProduct');
  };

  const handleManageStores = () => {
    navigation.navigate('ManageStores');
  };

  const handleManageProducts = () => {
    navigation.navigate('ManageProducts');
  };

  const handleViewOrders = () => {
    navigation.navigate('Orders');
  };

  const handleViewAnalytics = () => {
    navigation.navigate('Analytics');
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statContent}>
        <View style={styles.statIcon}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </Card.Content>
    </Card>
  );

  const QuickAction = ({ title, icon, onPress, color }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderChart = () => {
    if (!dashboardData?.analytics?.salesData) return null;

    const chartData = {
      labels: dashboardData.analytics.salesData.map(item => item.date),
      datasets: [{
        data: dashboardData.analytics.salesData.map(item => item.sales),
        color: (opacity = 1) => `rgba(${theme.colors.primary}, ${opacity})`,
        strokeWidth: 2,
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={width - 32}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(${theme.colors.primary}, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(${theme.colors.text}, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: theme.colors.primary,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  if (loading && !dashboardData) {
    return (
      <View style={styles.loadingContainer}>
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
        <Text style={styles.headerTitle}>{t('merchant.dashboard')}</Text>
        <IconButton
          icon="refresh"
          size={24}
          onPress={handleRefresh}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text style={styles.welcomeText}>
              {t('merchant.welcome', { name: user.name })}
            </Text>
            <Text style={styles.welcomeSubtext}>
              {t('merchant.dashboardDescription')}
            </Text>
          </Card.Content>
        </Card>

        {/* Period Filter */}
        <View style={styles.periodFilter}>
          {['week', 'month', 'year'].map(period => (
            <Chip
              key={period}
              mode={selectedPeriod === period ? 'flat' : 'outlined'}
              selected={selectedPeriod === period}
              onPress={() => setSelectedPeriod(period)}
              style={styles.periodChip}
            >
              {t(`merchant.period.${period}`)}
            </Chip>
          ))}
        </View>

        {/* Stats Overview */}
        {dashboardData && (
          <View style={styles.statsContainer}>
            <StatCard
              title={t('merchant.totalStores')}
              value={dashboardData.stats.storeCount}
              icon="storefront"
              color={theme.colors.primary}
              subtitle={t('merchant.active')}
            />
            <StatCard
              title={t('merchant.totalProducts')}
              value={dashboardData.stats.productCount}
              icon="package"
              color={theme.colors.accent}
              subtitle={t('merchant.listed')}
            />
            <StatCard
              title={t('merchant.totalViews')}
              value={dashboardData.stats.viewCount}
              icon="eye"
              color={theme.colors.secondary}
              subtitle={t('merchant.thisWeek')}
            />
            <StatCard
              title={t('merchant.totalMessages')}
              value={dashboardData.stats.messageCount}
              icon="chatbubble"
              color={theme.colors.tertiary}
              subtitle={t('merchant.unread')}
            />
          </View>
        )}

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('merchant.quickActions')}</Text>
            <View style={styles.quickActionsGrid}>
              <QuickAction
                title={t('merchant.createStore')}
                icon="storefront"
                onPress={handleCreateStore}
                color={theme.colors.primary}
              />
              <QuickAction
                title={t('merchant.addProduct')}
                icon="add-circle"
                onPress={handleCreateProduct}
                color={theme.colors.accent}
              />
              <QuickAction
                title={t('merchant.manageStores')}
                icon="settings"
                onPress={handleManageStores}
                color={theme.colors.secondary}
              />
              <QuickAction
                title={t('merchant.manageProducts')}
                icon="list"
                onPress={handleManageProducts}
                color={theme.colors.tertiary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Performance Chart */}
        {dashboardData?.analytics && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('merchant.performanceChart')}</Text>
              {renderChart()}
            </Card.Content>
          </Card>
        )}

        {/* Recent Activity */}
        {dashboardData?.recentActivity && (
          <Card style={styles.activityCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('merchant.recentActivity')}</Text>
              {dashboardData.recentActivity.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons 
                      name={activity.type === 'view' ? 'eye' : activity.type === 'message' ? 'chatbubble' : 'person'} 
                      size={16} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{activity.description}</Text>
                    <Text style={styles.activityTime}>
                      {formatDate(activity.timestamp, 'short')}
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Business Tips */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('merchant.businessTips')}</Text>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color={theme.colors.accent} />
              <Text style={styles.tipText}>
                {t('merchant.tip1')}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color={theme.colors.accent} />
              <Text style={styles.tipText}>
                {t('merchant.tip2')}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color={theme.colors.accent} />
              <Text style={styles.tipText}>
                {t('merchant.tip3')}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          Alert.alert(
            t('merchant.quickCreate'),
            t('merchant.chooseCreateOption'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('merchant.createStore'), onPress: handleCreateStore },
              { text: t('merchant.addProduct'), onPress: handleCreateProduct },
            ]
          );
        }}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.text,
  },
  welcomeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  periodFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  periodChip: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statTitle: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: theme.colors.placeholder,
  },
  quickActionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activityCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  tipsCard: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});