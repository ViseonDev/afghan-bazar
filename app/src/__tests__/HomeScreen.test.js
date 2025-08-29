import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test' } }),
}));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ t: (key) => key }),
}));

jest.mock('../services/api', () => ({
  productsAPI: { getProducts: jest.fn().mockResolvedValue({ success: true, data: [] }) },
  storesAPI: { getStores: jest.fn().mockResolvedValue({ success: true, data: [] }) },
  categoriesAPI: { getFeaturedCategories: jest.fn().mockResolvedValue({ success: true, data: [] }) },
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('react-native-gesture-handler', () => ({
  FlatList: ({ children }) => null,
}));

describe('HomeScreen', () => {
  it('renders search input', async () => {
    const { getByPlaceholderText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByPlaceholderText('home.searchPlaceholder')).toBeTruthy();
    });
  });
});
