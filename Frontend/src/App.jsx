import React, { useState, useEffect } from 'react';
import MapWrapper from './Components/MapComponent';
import axios from 'axios';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { motion } from 'framer-motion';



function App() {
  const [position, setPosition] = useState([51.505, -0.09]);
  const [zoom, setZoom] = useState(13);
  const [markers, setMarkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [distance, setDistance] = useState(null);
  const [route, setRoute] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = React.useRef(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = false;

      recognition.current.onresult = async (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          setRecognizedText(transcript);
          setSearchTerm(transcript);
          console.log("The Query is : " + transcript);
          await sendCommandToAPI(transcript);
        }
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error detected: ', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.error('Speech Recognition API not supported in this browser.');
      setError('Speech Recognition API not supported in this browser.');
    }

    // Get current location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setPosition([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          console.error('Error getting current location:', err);
          setError('Unable to retrieve current location.');
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setError('Geolocation is not supported by this browser.');
    }

    // Cleanup on unmount
    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, []);

  const startRecognition = () => {
    if (recognition.current && !isListening) {
      recognition.current.start();
      setIsListening(true);
      setError(null);
    }
  };

  const stopRecognition = () => {
    if (recognition.current && isListening) {
      console.log("Stopping Recognition");
      recognition.current.stop();
      setIsListening(false);
    }
  };

  const sendCommandToAPI = async (command) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Qury is : " + command);
      const response = await fetch('http://localhost:5000/ask-query/', { command });
      console.log("Response from API is : " + response.data);
      handleAPIResponse(response.data);
    } catch (error) {
      console.error('API request error: ', error);
      setError('Failed to process the command. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAPIResponse = (response) => {
    switch (response.action) {
      case 'find_location':
        handleFindLocation(response.details.location);
        break;
      case 'find_distance':
        handleFindDistance(response.details.place1, response.details.place2);
        break;
      case 'distance_from_current':
        handleDistanceFromCurrent(response.details.place2);
        break;
      case 'read_details':
        handleReadDetails(response.details.location);
        break;
      case 'zoom':
        handleZoom(response.details.location, response.details.zoom);
        break;
      default:
        console.log("Unknown action:", response.action);
        setError(response.message || "I'm not sure how to help with that.");
    }
  };

  const handleFindLocation = async (location) => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          format: 'json',
          q: location,
        },
      });
      if (response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        const details = [
          `Latitude: ${lat}`,
          `Longitude: ${lon}`,
          `Display Name: ${display_name}`,
        ];
        setPosition([parseFloat(lat), parseFloat(lon)]);
        setMarkers([
          {
            position: [parseFloat(lat), parseFloat(lon)],
            text: display_name,
            details,
          },
        ]);
        setZoom(13);
      } else {
        setError(`Location "${location}" not found.`);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setError('Failed to find the location.');
    }
  };

  const handleFindDistance = async (place1, place2) => {
    try {
      const [response1, response2] = await Promise.all([
        axios.get(`https://nominatim.openstreetmap.org/search`, {
          params: { format: 'json', q: place1 },
        }),
        axios.get(`https://nominatim.openstreetmap.org/search`, {
          params: { format: 'json', q: place2 },
        }),
      ]);

      if (response1.data.length > 0 && response2.data.length > 0) {
        const lat1 = parseFloat(response1.data[0].lat);
        const lon1 = parseFloat(response1.data[0].lon);
        const lat2 = parseFloat(response2.data[0].lat);
        const lon2 = parseFloat(response2.data[0].lon);

        setMarkers([
          {
            position: [lat1, lon1],
            text: response1.data[0].display_name,
            details: [`Latitude: ${lat1}`, `Longitude: ${lon1}`],
          },
          {
            position: [lat2, lon2],
            text: response2.data[0].display_name,
            details: [`Latitude: ${lat2}`, `Longitude: ${lon2}`],
          },
        ]);

        setPosition([(lat1 + lat2) / 2, (lon1 + lon2) / 2]);
        setZoom(5); // Adjust zoom to show both locations
        const calculatedDistance = calculateDistance(lat1, lon1, lat2, lon2);
        setDistance(calculatedDistance);
        setRoute([[lat1, lon1], [lat2, lon2]]);
      } else {
        setError('One or both locations not found.');
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      setError('Failed to calculate distance.');
    }
  };

  const handleDistanceFromCurrent = async (place2) => {
    if (currentLocation) {
      try {
        const response2 = await axios.get(`https://nominatim.openstreetmap.org/search`, {
          params: { format: 'json', q: place2 },
        });
        if (response2.data.length > 0) {
          const lat2 = parseFloat(response2.data[0].lat);
          const lon2 = parseFloat(response2.data[0].lon);

          setMarkers((prevMarkers) => [
            ...prevMarkers,
            {
              position: [lat2, lon2],
              text: response2.data[0].display_name,
              details: [`Latitude: ${lat2}`, `Longitude: ${lon2}`],
            },
          ]);

          setPosition([
            (currentLocation.lat + lat2) / 2,
            (currentLocation.lon + lon2) / 2,
          ]);
          setZoom(5); // Adjust zoom to show both locations
          const calculatedDistance = calculateDistance(
            currentLocation.lat,
            currentLocation.lon,
            lat2,
            lon2
          );
          setDistance(calculatedDistance);
          setRoute([
            [currentLocation.lat, currentLocation.lon],
            [lat2, lon2],
          ]);
        } else {
          setError(`Location "${place2}" not found.`);
        }
      } catch (error) {
        console.error('Error calculating distance from current location:', error);
        setError('Failed to calculate distance from current location.');
      }
    } else {
      setError('Current location is not available.');
    }
  };

  const handleReadDetails = async (location) => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: { format: 'json', q: location },
      });
      if (response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        const details = [
          `Latitude: ${lat}`,
          `Longitude: ${lon}`,
          `Display Name: ${display_name}`,
        ];
        setMarkers([
          {
            position: [parseFloat(lat), parseFloat(lon)],
            text: display_name,
            details,
          },
        ]);
      } else {
        setError(`Details for "${location}" not found.`);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      setError('Failed to fetch details.');
    }
  };

  const handleZoom = (location, zoomLevel) => {
    // Determine the new zoom level
    let newZoom = zoom;
    if (zoomLevel.toLowerCase() === 'in') {
      newZoom = Math.min(zoom + 2, 18); // Max zoom level
    } else if (zoomLevel.toLowerCase() === 'out') {
      newZoom = Math.max(zoom - 2, 1); // Min zoom level
    }

    // Optionally, center the map on the location
    handleFindLocation(location);
    setZoom(newZoom);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2); // Distance in km with two decimal places
  };

  const handleSearch = () => {
    if (recognizedText.trim() !== '') {
      console.log("Qury is : " + recognizedText.trim());
      sendCommandToAPI(recognizedText.trim());
    }
  };

  return (
    <div className="flex flex-col items-center p-6 h-screen bg-gray-100">
      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center justify-center">
          <input
            className="border p-3 w-full rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 ease-in-out"
            type="text"
            value={recognizedText}
            onChange={(e)=>{
              setRecognizedText(e.target.value);
              console.log(recognition);
            }}
            placeholder="Speech recognized here..."
          />
        </div>
        <button
          className="bg-purple-500 text-white p-3 rounded-lg w-full mt-3 flex items-center justify-center shadow-md hover:bg-purple-600 transition duration-300 ease-in-out"
          onClick={handleSearch}
          disabled={isLoading || !searchTerm.trim()}
        >
          {isLoading ? 'Processing...' : 'Search'}
        </button>
        <motion.button
          className={`bg-purple-500 text-white p-3 rounded-lg w-full mt-3 flex items-center justify-center shadow-md hover:bg-purple-600 transition duration-300 ease-in-out ${
            isListening ? 'bg-red-500' : ''
          }`}
          onClick={isListening ? stopRecognition : startRecognition}
          whileHover={{ scale: 1.05 }}
          disabled={isLoading}
        >
          {isListening ? (
            <>
              <FaStop className="mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <FaMicrophone className="mr-2" />
              Start Recording
            </>
          )}
        </motion.button>
        {error && (
          <div className="mt-3 text-red-500">
            {error}
          </div>
        )}
        {distance && (
          <div className="mt-3 text-green-500">
            Distance: {distance} km
          </div>
        )}
      </div>
      <div className="flex-1 w-full">
        <MapWrapper position={position} zoom={zoom} markers={markers} route={route} />
      </div>
    </div>
  );
}

export default App;
