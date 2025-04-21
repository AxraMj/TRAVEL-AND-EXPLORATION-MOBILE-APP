import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function AccountTypeScreen({ navigation }) {
  const handleBack = () => {
    navigation.dispatch({
      type: 'RESET',
      payload: {
        routes: [{ name: 'Welcome' }],
        index: 0,
      },
      immediate: true
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345', '#232526']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        <TouchableOpacity 
          style={styles.backIcon}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={28} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Choose Account Type</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.accountButton}
              onPress={() => navigation.navigate('Register', { type: 'creator' })}
            >
              <Text style={styles.accountTitle}>Creator</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.accountButton}
              onPress={() => navigation.navigate('Register', { type: 'explorer' })}
            >
              <Text style={styles.accountTitle}>Explorer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  backIcon: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  accountButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: width * 0.4,
    height: width * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
}); 