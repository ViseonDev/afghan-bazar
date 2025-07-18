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
import { Card, Button, IconButton, Chip, SegmentedButtons, DataTable } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, flagsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const { t, formatDate } = useLanguage();
  const { user } = useAuth();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedTab, setSelectedTab] = useState('overview');

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [selectedPeriod])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load admin dashboard data
      const response = await usersAPI.getAdminDashboard({
        period: selectedPeriod,
      });
      
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert(t('common.error'), t('admin.errorLoadingDashboard'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleUserManagement = () => {
    navigation.navigate('UserManagement');
  };

  const handleContentModeration = () => {
    navigation.navigate('ContentModeration');
  };

  const handleSystemSettings = () => {
    navigation.navigate('SystemSettings');
  };

  const handleReports = () => {
    navigation.navigate('Reports');
  };

  const handleFlaggedContent = () => {
    navigation.navigate('FlaggedContent');
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statContent}>
        <View style={styles.statIcon}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
          {trend && (
            <View style={styles.trendContainer}>
              <Ionicons 
                name={trend > 0 ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={trend > 0 ? theme.colors.primary : theme.colors.error} 
              />
              <Text style={[styles.trendText, { 
                color: trend > 0 ? theme.colors.primary : theme.colors.error 
              }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const QuickAction = ({ title, icon, onPress, color, badge }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderOverview = () => (
    <View>
      {/* Stats Overview */}
      {dashboardData && (
        <View style={styles.statsContainer}>
          <StatCard
            title={t('admin.totalUsers')}
            value={dashboardData.stats.userCount}
            icon="people"
            color={theme.colors.primary}
            subtitle={t('admin.registered')}
            trend={dashboardData.stats.userGrowth}
          />
          <StatCard
            title={t('admin.totalStores')}
            value={dashboardData.stats.storeCount}
            icon="storefront"
            color={theme.colors.accent}
            subtitle={t('admin.active')}
            trend={dashboardData.stats.storeGrowth}
          />
          <StatCard
            title={t('admin.totalProducts')}
            value={dashboardData.stats.productCount}
            icon="package"
            color={theme.colors.secondary}
            subtitle={t('admin.listed')}
            trend={dashboardData.stats.productGrowth}
          />
          <StatCard
            title={t('admin.flaggedContent')}
            value={dashboardData.stats.flagCount}
            icon="flag"
            color={theme.colors.error}
            subtitle={t('admin.needsReview')}
          />
        </View>
      )}

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>{t('admin.quickActions')}</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title={t('admin.userManagement')}
              icon="people"
              onPress={handleUserManagement}
              color={theme.colors.primary}
            />
            <QuickAction
              title={t('admin.contentModeration')}
              icon="shield-checkmark"
              onPress={handleContentModeration}
              color={theme.colors.accent}
              badge={dashboardData?.stats.flagCount || 0}
            />
            <QuickAction
              title={t('admin.systemSettings')}
              icon="settings"
              onPress={handleSystemSettings}
              color={theme.colors.secondary}
            />
            <QuickAction
              title={t('admin.reports')}
              icon="bar-chart"
              onPress={handleReports}
              color={theme.colors.tertiary}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      {dashboardData?.recentActivity && (
        <Card style={styles.activityCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('admin.recentActivity')}</Text>
            {dashboardData.recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={activity.type === 'user' ? 'person' : 
                          activity.type === 'store' ? 'storefront' : 
                          activity.type === 'product' ? 'package' : 'flag'} 
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
    </View>
  );

  const renderAnalytics = () => (
    <View>
      {dashboardData?.analytics && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('admin.platformGrowth')}</Text>
            <LineChart
              data={{
                labels: dashboardData.analytics.growthData.map(item => item.date),
                datasets: [
                  {
                    data: dashboardData.analytics.growthData.map(item => item.users),
                    color: (opacity = 1) => `rgba(${theme.colors.primary}, ${opacity})`,
                    strokeWidth: 2,
                  },
                  {
                    data: dashboardData.analytics.growthData.map(item => item.stores),
                    color: (opacity = 1) => `rgba(${theme.colors.accent}, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={width - 64}
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
              }}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {dashboardData?.analytics?.categoryDistribution && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('admin.categoryDistribution')}</Text>
            <PieChart
              data={dashboardData.analytics.categoryDistribution}
              width={width - 64}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                color: (opacity = 1) => `rgba(${theme.colors.primary}, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(${theme.colors.text}, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const renderUsers = () => (
    <View>
      {dashboardData?.users && (
        <Card style={styles.tableCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('admin.recentUsers')}</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>{t('admin.name')}</DataTable.Title>
                <DataTable.Title>{t('admin.email')}</DataTable.Title>
                <DataTable.Title>{t('admin.role')}</DataTable.Title>
                <DataTable.Title>{t('admin.joinDate')}</DataTable.Title>
              </DataTable.Header>

              {dashboardData.users.map((user, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell>{user.name}</DataTable.Cell>
                  <DataTable.Cell>{user.email}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip
                      mode="outlined"
                      compact
                      style={styles.roleChip}
                      textStyle={styles.roleChipText}
                    >
                      {user.role}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell>{formatDate(user.createdAt, 'short')}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const renderModeration = () => (
    <View>
      {dashboardData?.flaggedContent && (
        <Card style={styles.tableCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('admin.flaggedContent')}</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>{t('admin.content')}</DataTable.Title>
                <DataTable.Title>{t('admin.reason')}</DataTable.Title>
                <DataTable.Title>{t('admin.reporter')}</DataTable.Title>
                <DataTable.Title>{t('admin.date')}</DataTable.Title>
              </DataTable.Header>

              {dashboardData.flaggedContent.map((flag, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell>{flag.targetType}</DataTable.Cell>
                  <DataTable.Cell>{flag.reason}</DataTable.Cell>
                  <DataTable.Cell>{flag.reporterId.name}</DataTable.Cell>
                  <DataTable.Cell>{formatDate(flag.createdAt, 'short')}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'analytics':
        return renderAnalytics();
      case 'users':
        return renderUsers();
      case 'moderation':
        return renderModeration();
      default:
        return renderOverview();
    }
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
        <Text style={styles.headerTitle}>{t('admin.dashboard')}</Text>
        <IconButton
          icon="refresh"
          size={24}
          onPress={handleRefresh}
        />
      </View>

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
            {t(`admin.period.${period}`)}
          </Chip>
        ))}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          buttons={[
            { value: 'overview', label: t('admin.overview') },
            { value: 'analytics', label: t('admin.analytics') },
            { value: 'users', label: t('admin.users') },
            { value: 'moderation', label: t('admin.moderation') },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
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
  periodFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  periodChip: {
    flex: 1,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surface,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
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
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
  },
  quickActionsCard: {
    marginHorizontal: 16,
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
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  tableCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  roleChip: {
    height: 24,
  },
  roleChipText: {
    fontSize: 10,
  },
});