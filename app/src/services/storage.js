import * as SecureStore from 'expo-secure-store';

export const getItem = async (key) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error getting ${key} from secure store:`, error);
    return null;
  }
};

export const setItem = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Error setting ${key} in secure store:`, error);
  }
};

export const removeItem = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Error removing ${key} from secure store:`, error);
  }
};
