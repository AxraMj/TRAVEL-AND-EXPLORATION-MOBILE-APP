export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email';
  return null;
};

export const validatePassword = (password, isConfirm = false, originalPassword = '') => {
  if (!password) return `${isConfirm ? 'Confirm password' : 'Password'} is required`;
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (password.length > 50) return 'Password must be less than 50 characters';
  
  if (!isConfirm) {
    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
      return 'Password must contain uppercase, lowercase, number and special character';
    }
  } else if (password !== originalPassword) {
    return 'Passwords do not match';
  }

  return null;
};

export const validateFullName = (name) => {
  if (!name) return 'Full name is required';
  if (name.length < 2) return 'Full name must be at least 2 characters';
  if (name.length > 50) return 'Full name must be less than 50 characters';
  if (!/^[a-zA-Z\s'-]+$/.test(name)) return 'Full name can only contain letters, spaces, hyphens and apostrophes';
  return null;
};

export const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 30) return 'Username must be less than 30 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers and underscores';
  return null;
};

export const validateProfileImage = (image) => {
  if (!image) return 'Profile image is required';
  return null;
};

export const validateForm = (formData, formType) => {
  const errors = {};

  switch (formType) {
    case 'login':
      {
        const emailError = validateEmail(formData.email);
        const passwordError = validatePassword(formData.password);
        
        if (emailError) errors.email = emailError;
        if (passwordError) errors.password = passwordError;
      }
      break;

    case 'register':
      {
        const fullNameError = validateFullName(formData.fullName);
        const emailError = validateEmail(formData.email);
        const passwordError = validatePassword(formData.password);
        const confirmPasswordError = validatePassword(formData.confirmPassword, true, formData.password);
        
        if (fullNameError) errors.fullName = fullNameError;
        if (emailError) errors.email = emailError;
        if (passwordError) errors.password = passwordError;
        if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
      }
      break;

    case 'profileSetup':
      {
        const imageError = validateProfileImage(formData.profileImage);
        if (imageError) errors.profileImage = imageError;

        if (formData.accountType === 'creator') {
          const usernameError = validateUsername(formData.username);
          if (usernameError) errors.username = usernameError;
        }
      }
      break;
  }

  return errors;
}; 