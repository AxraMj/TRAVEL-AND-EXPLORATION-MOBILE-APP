import ProfileScreen from '../screens/creator/ProfileScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      {/* ... other screens ... */}
      <Stack.Screen 
        name="CreatorHome" 
        component={CreatorHomeScreen} 
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerShown: false // or true if you want a header
        }}
      />
      {/* ... other screens ... */}
    </Stack.Navigator>
  );
} 