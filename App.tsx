import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <HomeScreen />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
