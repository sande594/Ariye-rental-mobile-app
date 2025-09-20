import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="vehicles" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="users" />
    </Stack>
  );
}