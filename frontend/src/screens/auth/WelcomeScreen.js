import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Dimensions,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345', '#232526']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        <View style={styles.overlay}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>TRAVO</Text>
            <Text style={styles.subtitle}>
              Explore. Create. Connect.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('AccountType')}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                I already have an account
              </Text>
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
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  logo: {
    width: width * 0.4,
    height: height * 0.15,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: -height * 0.1,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 10,
    letterSpacing: 1,
  },
  buttonContainer: {
    padding: 20,
    gap: 15,
  },
  button: {
    backgroundColor: '#414345',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#ffffff',
  },
}); 