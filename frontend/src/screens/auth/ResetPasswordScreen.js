import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/validation';

export default function ResetPasswordScreen({ navigation }) {
  const { resetPassword, verifyEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [error, setError] = useState('');

  const validateInputs = () => {
    if (!emailVerified) {
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        return false;
      }
      return true;
    } else {
      if (!newPassword || !confirmPassword) {
        setError('Please fill in all fields');
        return false;
      }
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      return true;
    }
  };

  const handleVerifyEmail = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      const response = await verifyEmail(email);
      if (response.status === 'success') {
        setEmailVerified(true);
        setError('');
      } else {
        setError('Email verification failed. Please try again.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Email verification failed. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      await resetPassword(email, newPassword);
      Alert.alert(
        'Success',
        'Password has been reset successfully. Please log in with your new password.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345', '#232526']}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.content}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                {emailVerified ? 'Enter your new password' : 'Enter your email to reset password'}
              </Text>

              <View style={styles.form}>
                {!emailVerified ? (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={handleVerifyEmail}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.buttonText}>Verify Email</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" />
                      <TextInput
                        style={styles.input}
                        placeholder="New Password"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      >
                        <Ionicons
                          name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="rgba(255,255,255,0.7)"
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm New Password"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="rgba(255,255,255,0.7)"
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={handleResetPassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.buttonText}>Reset Password</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 40,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    marginLeft: 10,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: '#414345',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
}); 