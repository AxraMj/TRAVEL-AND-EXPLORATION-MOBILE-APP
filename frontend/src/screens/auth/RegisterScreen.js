import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation, route }) {
  const accountType = route.params?.type || 'explorer';
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    let newErrors = {};
    
    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm Password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (validateForm()) {
      navigation.navigate('ProfileSetup', {
        accountType,
        userData: formData
      });
    } else {
      // Alert.alert('Please fix the errors in the form');
    }
  };

  const handleBack = () => {
    navigation.dispatch({
      type: 'RESET',
      payload: {
        routes: [{ name: 'AccountType' }],
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

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              as {accountType.charAt(0).toUpperCase() + accountType.slice(1)}
            </Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  value={formData.fullName}
                  onChangeText={(text) => {
                    setFormData({...formData, fullName: text});
                    if (errors.fullName) {
                      setErrors({...errors, fullName: null});
                    }
                  }}
                  autoCapitalize="words"
                />
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>
              
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData({...formData, email: text});
                    if (errors.email) {
                      setErrors({...errors, email: null});
                    }
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
              
              <View style={styles.inputWrapper}>
                <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={formData.password}
                    onChangeText={(text) => {
                      setFormData({...formData, password: text});
                      if (errors.password) {
                        setErrors({...errors, password: null});
                      }
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    style={styles.visibilityIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={24} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              <View style={styles.inputWrapper}>
                <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm Password"
                    placeholderTextColor="#999"
                    value={formData.confirmPassword}
                    onChangeText={(text) => {
                      setFormData({...formData, confirmPassword: text});
                      if (errors.confirmPassword) {
                        setErrors({...errors, confirmPassword: null});
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.visibilityIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={24} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.button}
                onPress={handleRegister}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>

              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By registering, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms & Conditions</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 100,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
    opacity: 0.8,
  },
  inputContainer: {
    gap: 15,
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 16,
  },
  buttonContainer: {
    gap: 20,
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
  termsContainer: {
    alignItems: 'center',
  },
  termsText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  inputWrapper: {
    gap: 5,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginLeft: 5,
  },
  passwordContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
  },
  visibilityIcon: {
    padding: 10,
    marginRight: 5,
  },
}); 