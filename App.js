import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import * as Location from 'expo-location';

const locations = require('./locations.json');

export default class App extends React.Component {
  state = {
    latitude: null,
    longitude: null,
    desLatitude: null,
    desLongitude: null,
    coords: [],
    distance: null,
    time: null,
  };

  async componentDidMount() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('Permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      this.setState({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (locations && locations.length > 0) {
        const [sampleLocation] = locations;
        this.setState(
          {
            desLatitude: sampleLocation.coords.latitude,
            desLongitude: sampleLocation.coords.longitude,
          },
          this.mergeCoords
        );
      }
    } catch (error) {
      console.log('Error:', error);
    }
  }

  mergeCoords = () => {
    const { latitude, longitude, desLatitude, desLongitude } = this.state;

    const hasStartAndEnd = latitude != null && desLatitude != null;
    if (hasStartAndEnd) {
      const concatStart = `${latitude},${longitude}`;
      const concatEnd = `${desLatitude},${desLongitude}`;
      this.getDirections(concatStart, concatEnd);
    }
  };

  async getDirections(startLoc, desLoc) {
    try {
      const apiKey = 'AIzaSyDcELAMQ7jNEno3GYitHGQza2O8wuye-Ok';
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${desLoc}&key=${apiKey}`
      );

      const respJson = await resp.json();

      if (!respJson.routes || respJson.routes.length === 0) {
        console.log('No routes found:', respJson);
        return;
      }

      const response = respJson.routes[0];

      if (!response.legs || response.legs.length === 0) {
        console.log('No legs found in the route');
        return;
      }

      const distanceTime = response.legs[0];
      const distance = distanceTime.distance.text;
      const time = distanceTime.duration.text;

      const points = polyline.decode(response.overview_polyline.points);
      const coords = points.map((point) => ({
        latitude: point[0],
        longitude: point[1],
      }));

      this.setState({ coords, distance, time });
    } catch (error) {
      console.log('Error: ', error);
    }
  }

  render() {
    const { latitude, longitude, coords } = this.state;

    if (latitude !== null && longitude !== null) {
      return (
        <MapView
          showsUserLocation
          style={{ flex: 1 }}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Polyline
            strokeWidth={2}
            strokeColor="red"
            coordinates={coords}
          />
        </MapView>
      );
    }

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>We need your permission!</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
