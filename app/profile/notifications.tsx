import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: string;
}

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'booking_updates',
      title: 'Booking Updates',
      description: 'Get notified about booking confirmations and changes',
      enabled: true,
      icon: 'calendar-outline',
    },
    {
      id: 'payment_alerts',
      title: 'Payment Alerts',
      description: 'Receive alerts for payment confirmations and issues',
      enabled: true,
      icon: 'card-outline',
    },
    {
      id: 'promotional',
      title: 'Promotional Offers',
      description: 'Get notified about special deals and discounts',
      enabled: false,
      icon: 'pricetag-outline',
    },
    {
      id: 'reminders',
      title: 'Trip Reminders',
      description: 'Receive reminders about upcoming trips',
      enabled: true,
      icon: 'alarm-outline',
    },
    {
      id: 'vehicle_updates',
      title: 'Vehicle Updates',
      description: 'Get notified about vehicle availability and changes',
      enabled: true,
      icon: 'car-outline',
    },
    {
      id: 'support',
      title: 'Support Messages',
      description: 'Receive messages from customer support',
      enabled: true,
      icon: 'help-circle-outline',
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(setting => 
      setting.id === id 
        ? { ...setting, enabled: !setting.enabled }
        : setting
    ));
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
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <Text style={styles.sectionDescription}>
          Choose which notifications you'd like to receive
        </Text>

        {settings.map((setting) => (
          <View key={setting.id} style={styles.settingCard}>
            <View style={styles.settingIcon}>
              <Ionicons name={setting.icon as any} size={24} color="#ff6b35" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{setting.title}</Text>
              <Text style={styles.settingDescription}>{setting.description}</Text>
            </View>
            <Switch
              value={setting.enabled}
              onValueChange={() => toggleSetting(setting.id)}
              trackColor={{ false: '#e9ecef', true: '#ff6b35' }}
              thumbColor={setting.enabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        ))}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#007bff" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About Notifications</Text>
            <Text style={styles.infoText}>
              You can change these settings anytime. Some notifications may be required 
              for important account and booking updates.
            </Text>
          </View>
        </View>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
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
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#0056b3',
    lineHeight: 20,
  },
});