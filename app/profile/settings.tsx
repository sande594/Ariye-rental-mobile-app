import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Setting {
  id: string;
  title: string;
  description?: string;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  icon: string;
  action?: () => void;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Setting[]>([
    {
      id: 'dark_mode',
      title: 'Dark Mode',
      description: 'Switch to dark theme',
      type: 'toggle',
      value: false,
      icon: 'moon-outline',
    },
    {
      id: 'location_services',
      title: 'Location Services',
      description: 'Allow app to access your location',
      type: 'toggle',
      value: true,
      icon: 'location-outline',
    },
    {
      id: 'auto_backup',
      title: 'Auto Backup',
      description: 'Automatically backup your data',
      type: 'toggle',
      value: true,
      icon: 'cloud-upload-outline',
    },
    {
      id: 'language',
      title: 'Language',
      description: 'English',
      type: 'navigation',
      icon: 'language-outline',
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      type: 'navigation',
      icon: 'shield-outline',
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      type: 'navigation',
      icon: 'document-text-outline',
    },
    {
      id: 'about',
      title: 'About',
      description: 'Version 1.0.0',
      type: 'navigation',
      icon: 'information-circle-outline',
    },
    {
      id: 'logout',
      title: 'Sign Out',
      type: 'action',
      icon: 'log-out-outline',
      action: () => handleSignOut(),
    },
    {
      id: 'delete_account',
      title: 'Delete Account',
      type: 'action',
      icon: 'trash-outline',
      action: () => handleDeleteAccount(),
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(setting => 
      setting.id === id && setting.type === 'toggle'
        ? { ...setting, value: !setting.value }
        : setting
    ));
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // Handle sign out logic here
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted.');
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handleNavigation = (id: string) => {
    switch (id) {
      case 'language':
        Alert.alert('Language', 'Language selection coming soon');
        break;
      case 'privacy':
        Alert.alert('Privacy Policy', 'Privacy policy content would be displayed here');
        break;
      case 'terms':
        Alert.alert('Terms of Service', 'Terms of service content would be displayed here');
        break;
      case 'about':
        Alert.alert('About', 'Aryeh Rentals v1.0.0\nBuilt with React Native & Expo');
        break;
    }
  };

  const renderSetting = (setting: Setting) => {
    return (
      <TouchableOpacity
        key={setting.id}
        style={[
          styles.settingCard,
          setting.id === 'delete_account' && styles.dangerCard,
        ]}
        onPress={() => {
          if (setting.type === 'toggle') {
            toggleSetting(setting.id);
          } else if (setting.type === 'navigation') {
            handleNavigation(setting.id);
          } else if (setting.action) {
            setting.action();
          }
        }}
      >
        <View style={styles.settingIcon}>
          <Ionicons 
            name={setting.icon as any} 
            size={24} 
            color={setting.id === 'delete_account' ? '#ff4444' : '#ff6b35'} 
          />
        </View>
        <View style={styles.settingInfo}>
          <Text style={[
            styles.settingTitle,
            setting.id === 'delete_account' && styles.dangerText,
          ]}>
            {setting.title}
          </Text>
          {setting.description && (
            <Text style={styles.settingDescription}>{setting.description}</Text>
          )}
        </View>
        {setting.type === 'toggle' && (
          <Switch
            value={setting.value}
            onValueChange={() => toggleSetting(setting.id)}
            trackColor={{ false: '#e9ecef', true: '#ff6b35' }}
            thumbColor={setting.value ? '#fff' : '#f4f3f4'}
          />
        )}
        {(setting.type === 'navigation' || setting.type === 'action') && (
          <Ionicons name="chevron-forward" size={20} color="#666" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        {settings.filter(s => ['dark_mode', 'location_services', 'auto_backup'].includes(s.id)).map(renderSetting)}

        <Text style={styles.sectionTitle}>General</Text>
        {settings.filter(s => ['language', 'privacy', 'terms', 'about'].includes(s.id)).map(renderSetting)}

        <Text style={styles.sectionTitle}>Account</Text>
        {settings.filter(s => ['logout', 'delete_account'].includes(s.id)).map(renderSetting)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 16,
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerCard: {
    borderColor: '#ffebee',
    borderWidth: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  dangerText: {
    color: '#ff4444',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
});