import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import Test from './screens/Test';
import Search from './screens/Search';
import Main from './screens/Main';
import Autocomplete from './screens/Autocomplete';

const Stack = createStackNavigator();

function App(){
  return(
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: true }}> 
        <Stack.Screen name="Test" component={Test} />
        <Stack.Screen name="Search" component={Search} />
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="Autocomplete" component={Autocomplete} />
      </Stack.Navigator>
    </NavigationContainer>
  ) 
}

export default App;