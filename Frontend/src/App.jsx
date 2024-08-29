import React, { useState } from 'react';
import MapWrapper from './Components/MapComponent';
import axios from 'axios';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { motion } from 'framer-motion';

function App() {
  const [position, setPosition] = useState([51.505, -0.09]);
  const [zoom, setZoom] = useState(13);
  const [markers, setMarkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [place1, setPlace1] = useState('');
  const [place2, setPlace2] = useState('');
  const [distance, setDistance] = useState(null);
  const [route, setRoute] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Initialize speech recognition
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const lastResult = event.results[event.results.length - 1];
    if (lastResult.isFinal) {
      const transcript = lastResult[0].transcript;
      setRecognizedText(transcript);
      setSearchTerm(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error detected: ', event.error);
  };

  const startRecognition = () => {
    recognition.start();
    setIsListening(true);
  };

  const stopRecognition = () => {
    recognition.stop();
    setIsListening(false);
  };

  const sendCommandToAPI = async (command) => {
    try {
      const response = await axios.post('YOUR_API_ENDPOINT_HERE', { command });
      handleAPIResponse(response.data);
    } catch (error) {
      console.error('API request error: ', error);
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
    }
  };

  const handleFindLocation = async (location) => {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`);
    if (response.data.length > 0) {
      const { lat, lon, display_name } = response.data[0];
      const details = [
        `Latitude: ${lat}`,
        `Longitude: ${lon}`,
        `Display Name: ${display_name}`
      ];
      setPosition([parseFloat(lat), parseFloat(lon)]);
      setMarkers([{ position: [parseFloat(lat), parseFloat(lon)], text: display_name, details }]);
    }
  };

  const handleFindDistance = async (place1, place2) => {
    const response1 = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${place1}`);
    const response2 = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${place2}`);
    if (response1.data.length > 0 && response2.data.length > 0) {
      const lat1 = parseFloat(response1.data[0].lat);
      const lon1 = parseFloat(response1.data[0].lon);
      const lat2 = parseFloat(response2.data[0].lat);
      const lon2 = parseFloat(response2.data[0].lon);
      setMarkers([
        { position: [lat1, lon1], text: response1.data[0].display_name, details: [`Latitude: ${lat1}`, `Longitude: ${lon1}`] },
        { position: [lat2, lon2], text: response2.data[0].display_name, details: [`Latitude: ${lat2}`, `Longitude: ${lon2}`] }
      ]);
      setPosition([(lat1 + lat2) / 2, (lon1 + lon2) / 2]);
      setZoom(13);
      const calculatedDistance = calculateDistance(lat1, lon1, lat2, lon2);
      setDistance(calculatedDistance);
      setRoute([[lat1, lon1], [lat2, lon2]]);
    }
  };

  const handleDistanceFromCurrent = async (place2) => {
    if (currentLocation) {
      const response2 = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${place2}`);
      if (response2.data.length > 0) {
        const lat2 = parseFloat(response2.data[0].lat);
        const lon2 = parseFloat(response2.data[0].lon);
        setMarkers(prevMarkers => [
          ...prevMarkers,
          { position: [lat2, lon2], text: response2.data[0].display_name, details: [`Latitude: ${lat2}`, `Longitude: ${lon2}`] }
        ]);
        setPosition([(currentLocation.lat + lat2) / 2, (currentLocation.lon + lon2) / 2]);
        setZoom(13);
        const calculatedDistance = calculateDistance(currentLocation.lat, currentLocation.lon, lat2, lon2);
        setDistance(calculatedDistance);
        setRoute([[currentLocation.lat, currentLocation.lon], [lat2, lon2]]);
      }
    }
  };

  const handleReadDetails = async (location) => {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`);
    if (response.data.length > 0) {
      const { lat, lon, display_name } = response.data[0];
      const details = [
        `Latitude: ${lat}`,
        `Longitude: ${lon}`,
        `Display Name: ${display_name}`
      ];
      setMarkers([{ position: [parseFloat(lat), parseFloat(lon)], text: display_name, details }]);
    }
  };

  const handleZoom = (location, zoomLevel) => {
    sendCommandToAPI(`Zoom ${zoomLevel} on ${location}`);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="flex flex-col items-center p-6 h-screen bg-gray-100">
      <div className="w-full max-w-lg mb-6">
        <div className='flex items-center justify-center'>
        <input
          className="border p-3 w-full rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 ease-in-out"
          type="text"
          value={recognizedText}
          onChange={(e) => setRecognizedText(e.target.value)}
          placeholder="Speech recognized here..."
          readOnly
        />
        <button className="bg-purple-500 text-white p-3 rounded-lg w-full mt-3 flex items-center justify-center shadow-md hover:bg-purple-600 transition duration-300 ease-in-out">Search</button>
        </div>
        <motion.button
          className={`bg-purple-500 text-white p-3 rounded-lg w-full mt-3 flex items-center justify-center shadow-md hover:bg-purple-600 transition duration-300 ease-in-out ${isListening ? 'bg-red-500' : ''}`}
          onClick={isListening ? stopRecognition : startRecognition}
          whileHover={{ scale: 1.05 }}
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
      </div>
      <div className="flex-1 w-full">
        <MapWrapper position={position} zoom={zoom} markers={markers} route={route} />
      </div>
    </div>
  );
}

export default App;
