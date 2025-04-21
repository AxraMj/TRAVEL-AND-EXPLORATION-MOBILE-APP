import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { searchAPI } from '../../services/api';

const MentionInput = ({ value, onChangeText, placeholder, style }) => {
  const [mentionData, setMentionData] = useState({
    keyword: '',
    isSearching: false,
    searchResults: [],
    cursorPosition: 0,
  });

  useEffect(() => {
    const words = value.split(' ');
    const lastWord = words[words.length - 1];
    const isSearching = lastWord.startsWith('@');
    const keyword = isSearching ? lastWord.slice(1) : '';

    setMentionData(prev => ({
      ...prev,
      keyword,
      isSearching,
    }));

    if (isSearching && keyword.length > 0) {
      searchUsers(keyword);
    } else if (!isSearching || keyword.length === 0) {
      setMentionData(prev => ({
        ...prev,
        searchResults: []
      }));
    }
  }, [value]);

  const searchUsers = async (keyword) => {
    try {
      const response = await searchAPI.searchUsers(keyword);
      setMentionData(prev => ({
        ...prev,
        searchResults: response || []
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      setMentionData(prev => ({
        ...prev,
        searchResults: []
      }));
    }
  };

  const handleMentionSelect = (username) => {
    const words = value.split(' ');
    words[words.length - 1] = `@${username}`;
    const newText = words.join(' ') + ' ';

    setMentionData(prev => ({
      ...prev,
      keyword: '',
      isSearching: false,
      searchResults: [],
    }));

    onChangeText(newText);
  };

  const renderMentionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.mentionItem}
      onPress={() => handleMentionSelect(item.username)}
    >
      <Text style={styles.mentionText}>@{item.username}</Text>
      <Text style={styles.mentionName}>{item.fullName}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={[styles.input, style]}
        multiline
        placeholderTextColor="rgba(255,255,255,0.5)"
      />
      {mentionData.isSearching && mentionData.searchResults.length > 0 && (
        <View style={styles.mentionList}>
          <FlatList
            data={mentionData.searchResults}
            renderItem={renderMentionItem}
            keyExtractor={(item) => item._id}
            keyboardShouldPersistTaps="always"
            maxHeight={200}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    color: '#ffffff',
    fontSize: 16,
    padding: 8,
  },
  mentionList: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    maxHeight: 200,
    backgroundColor: '#232526',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 4,
  },
  mentionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  mentionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  mentionName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
});

export default MentionInput; 