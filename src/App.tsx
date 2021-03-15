import { useState } from "react";
import "./App.css";
import { GoogleMapContainer } from "./map/MapWrapper";
import { SearchPage } from "./searchPage/searchPage";

function App() {
  const [map, setMap] = useState<google.maps.Map>(undefined as any);

  return (
    <div className='container w-100 h-100 mt-4'>
      <div className='row h-100'>
        <div className="col-5 d-flex align-items-start flex-column">
          {map && <SearchPage map={map} />}
        </div>
        <div className="col-7">
          <GoogleMapContainer setMap={setMap} />
        </div>
      </div>
    </div>
  );
}

export default App;
