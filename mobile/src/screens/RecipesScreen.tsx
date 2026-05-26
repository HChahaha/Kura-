import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RecipesScreen = () => {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    // TODO: Fetch recipes based on pantry items using Gemini API
  }, []);

  const renderRecipe = ({ item }: any) => (
    <View style={styles.recipeCard}>
      <Text style={styles.recipeName}>{item.name}</Text>
      <Text style={styles.recipeDetails}>
        ⏱️ {item.prepTime + item.cookTime} min • Serves {item.servings}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Add items to your pantry to see recipe suggestions</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContainer: {
    padding: 16,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  recipeDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default RecipesScreen;
