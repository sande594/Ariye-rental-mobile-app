import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface Favorite {
  id: string;
  vehicle_id: string;
  created_at: string;
  vehicles: {
    id: string;
    name: string;
    type: string;
    brand: string;
    model: string;
    year: number;
    price_per_day: number;
    passenger_capacity: number;
    fuel_type: string;
    transmission: string;
    image_url: string;
    location: string;
    available: boolean;
    rating: number;
    total_reviews: number;
  };
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          vehicles (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Failed to remove from favorites');
    }
  };

  const FavoriteCard = ({ favorite }: { favorite: Favorite }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => router.push(`/vehicle/${favorite.vehicles.id}`)}
    >
      <Image source={{ uri: favorite.vehicles.image_url }} style={styles.vehicleImage} />
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => removeFavorite(favorite.id)}
      >
        <Ionicons name="heart" size={20} color="#ff6b35" />
      </TouchableOpacity>
      
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>{favorite.vehicles.name}</Text>
        <Text style={styles.vehicleType}>
          {favorite.vehicles.type} • {favorite.vehicles.location}
        </Text>
        
        <View style={styles.vehicleDetails}>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#ffc107" />
            <Text style={styles.ratingText}>{favorite.vehicles.rating.toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({favorite.vehicles.total_reviews})</Text>
          </View>
          <Text style={styles.price}>${favorite.vehicles.price_per_day}/day</Text>
        </View>
        
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="people-outline" size={14} color="#666" />
            <Text style={styles.featureText}>{favorite.vehicles.passenger_capacity} seats</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="car-outline" size={14} color="#666" />
            <Text style={styles.featureText}>{favorite.vehicles.transmission}</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="flash-outline" size={14} color="#666" />
            <Text style={styles.featureText}>{favorite.vehicles.fuel_type}</Text>
          </View>
        </View>
        
        {!favorite.vehicles.available && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>Currently Unavailable</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Favorites</Text>
        <Text style={styles.subtitle}>
          {favorites.length} vehicle{favorites.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No favorites yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Save vehicles you like to easily find them later
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Text style={styles.browseButtonText}>Browse Vehicles</Text>
            </TouchableOpacity>
          </View>
        ) : (
          favorites.map((favorite) => (
            <FavoriteCard key={favorite.id} favorite={favorite} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  browseButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  favoriteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleInfo: {
    padding: 16,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  vehicleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff6b35',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  unavailableBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  unavailableText: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: '500',
  },
});