//MediaList
import { StyleSheet } from 'react-native';
import Manhwa from '../ManhwaFetch';


export default function HomeMedia() {
  return (<Manhwa />);

};

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#faf5f5ff',
    color: '#f9f4f4ff',
    justifyContent: 'center',
  }

});
