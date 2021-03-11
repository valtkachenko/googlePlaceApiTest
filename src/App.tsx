import React, { useEffect, useRef, useState } from "react";
/* eslint-disable */
// import logo from './logo.svg';
/* eslint-enable */
import "./App.css";
// import { PlaceAutoComplete } from "./placeAutocomplete/place-autocomplete";
import { MapWrapper } from "./map/Map";
import { GoogleMapContainer } from "./map/MapWrapper";
// import { useContext } from "react";
import { NearbySearch } from './nearbySearch/nearbySearch';

const API_KEY = "AIzaSyANcvMS5wV7NRtWVGYYL9i9xTnyYlRg0Tg";

function App() {
  // const WithMapWrapper = MapWrapper(GoogleMapContainer, { apiKey: API_KEY });
  const [map, setMap] = useState<google.maps.Map>(undefined as any);

  return (
    <div className='container w-100 h-100 mt-4'>
      <div className='row h-100'>
        <div className="col-5 d-flex align-items-start flex-column">
          {map && <NearbySearch map={map} />}
        </div>
        <div className="col-7">
          <GoogleMapContainer setMap={setMap} />
        </div>
      </div>
    </div>
  );
}

export default App;
