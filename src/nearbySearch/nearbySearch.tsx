import { Dispatch, useEffect, useRef, useState } from "react";
// import Switch from "react-switch";
import { debounce } from "lodash";
import { Modal, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import "./nearbySearch.css";
import logo from "../geolocation.svg";

type Props = {
  map: google.maps.Map;
};

type PlaceLocation = {
  lat: () => number;
  lng: () => number;
};

type PlaceType = "store" | "drugstore" | "food" | "clothing_store";

export function NearbySearch({ map }: Props) {
  const [address, setAddress] = useState<string>("");
  const [storeName, setStoreName] = useState<string>("");
  // const [switchOn, switchOff] = useState<boolean>(true);
  const [location, setlocation] = useState<PlaceLocation>(undefined as any);
  const [predictions, setPredictions] = useState<google.maps.GeocoderResult[]>(
    undefined as any
  );
  const [show, setShow] = useState<boolean>(false);
  const [show1, setShow1] = useState<boolean>(false);
  const [btnvalue, setbtnValue] = useState<PlaceType>("store");
  const [results, setResults] = useState<google.maps.places.PlaceResult[]>(
    undefined as any
  );
  const [
    placeDetails,
    setPlaceDetails,
  ] = useState<google.maps.places.PlaceResult>(undefined as any);
  const [markerss, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isClick, setClick] = useState(false);
  const [sorted, setSorted] = useState<google.maps.places.PlaceResult[]>(undefined as any);

  useEffect(() => {
    if (sorted) {
      console.log('sorted: ', sorted);
    }
  }, [sorted])

  useEffect(() => {
    if (results) {
      d1();
    }
  }, [results])

  useEffect(() => {
    if (isClick && location) {
      searchByText(location, btnvalue, true);
      setClick(false);
    }
  }, [btnvalue, isClick]);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleClose1 = () => setShow1(false);
  const handleShow1 = () => setShow1(true);

  const searchByAddressWithDebounce = debounce((value) => {
    findPlaceByAdress(map, value, setlocation, setPredictions);
  }, 1000);

  const searchByText = (
    placeLocation: PlaceLocation,
    type?: PlaceType,
    defaultRequest?: boolean
  ) => {
    const location = { lat: placeLocation.lat(), lng: placeLocation.lng() };
    const callback = (
      results: google.maps.places.PlaceResult[] | null,
      status: google.maps.places.PlacesServiceStatus
    ) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setResults(results);

        const mrks: google.maps.Marker[] = [];
        for (let i = 0; i < results.length; i++) {
          const marker = new google.maps.Marker({
            map: map,
            position: results[i].geometry?.location,
          });
          mrks.push(marker);
        }
        setMarkers(mrks);
      }
    };

    const request = {
      location,
      radius: 2000,
      query: defaultRequest ? "" : storeName,
      type: type ?? "store",
    };

    const service = new google.maps.places.PlacesService(map);
    service.textSearch(request, callback);
  };

  const getDetails = (
    result: google.maps.places.PlaceResult,
    map: google.maps.Map
  ) => {
    const placeId = result.place_id;
    const request = placeId && {
      placeId,
      fields: ["All"],
    };

    const service = new google.maps.places.PlacesService(map);

    request &&
      service.getDetails(request, (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.geometry &&
          place.geometry.location
        ) {
          setPlaceDetails({ ...place });
          handleShow1();
        }
      });
  };

  const selectSearchByType = () => {
    clearMarkers(markerss);
    setTimeout(setClick, 0, true);
  };

  let infoWindow: google.maps.InfoWindow = new google.maps.InfoWindow();

  const getLocation = () => {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          const geocoder = new google.maps.Geocoder();

          geocoder.geocode({ location: pos }, function (results, status) {
            if (status === "OK" && results) {
              //setPredictions(results);
              setlocation({ lat: () => pos.lat, lng: () => pos.lng });
              setAddress(results[0].formatted_address);
              createMarker(map, results[0], markerss, setMarkers);
              // setlocation(item.geometry.location);
              // setAddress(item.formatted_address);
            } else {
              alert(
                "Geocode was not successful for the following reason: " +
                  status +
                  ", results length: " +
                  results?.length
              );
            }
          });

          infoWindow.setPosition(pos);
          infoWindow.setContent("Location found.");
          infoWindow.open(map);
          map.setCenter(pos);
        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter()!);
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter()!);
    }
  };

  function handleLocationError(
    browserHasGeolocation: boolean,
    infoWindow: google.maps.InfoWindow,
    pos: google.maps.LatLng
  ) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
      browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation."
    );
    infoWindow.open(map);
  }

  const d1 = () => {
    const m1 = results.map( place => place.geometry?.location );
    //let m2: google.maps.LatLng[] = undefined as any;

    // if (m1 !== undefined) {
    //   m2 = m1 !== undefined && m1.filter(loc => {
    //     if (loc !== null && loc !== undefined) {
    //       return loc;     
    //     }
    //   });  
    // }
    computeDistance({origin: [address], destination: [...m1 as any], results, setSorted })
  }
  

  const inputRef = useRef<HTMLInputElement>(undefined as any);

  return (
    <>
      <div
        className="btn-toolbar w-75 mb-2"
        role="toolbar"
        aria-label="Toolbar with button groups"
      >
        <p className="text pt-3">
          Enter search address, shop name
          <br />
          and press enter:
        </p>
        <div className="input-group w-100">
          <input
            className="form-control"
            type="text"
            placeholder="address"
            onChange={({ target: { value } }) => setAddress(value)}
            value={address}
            onKeyDown={({ key }) => {
              if (key === "Enter") {
                searchByAddressWithDebounce(address);
                setShow(true);
              }
            }}
            aria-label="Input group"
            aria-describedby="btnGroupAddon"
            list="datalistOptions"
            ref={inputRef}
          />
          <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>Select the place</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {predictions &&
                predictions.map((item, index) => (
                  <div
                    className="modal-item"
                    onClick={() => {
                      createMarker(map, item, markerss, setMarkers);
                      setlocation(item.geometry.location);
                      setAddress(item.formatted_address);
                      handleClose();
                    }}
                    key={index}
                  >
                    {item.formatted_address}
                  </div>
                ))}
            </Modal.Body>
          </Modal>
          <div className="input-group-append">
            <button
              className="btn btn-outline-secondary"
              style={{ padding: 0 }}
              type="button"
              onClick={getLocation}
            >
              <div className="app">
                <img
                  src={logo}
                  style={{ height: "35px", width: "40px" }}
                  alt="React Logo"
                />
              </div>
            </button>
          </div>
        </div>
      </div>
      <input
        className="form-control w-75 mb-2"
        type="text"
        placeholder="name of shop ..."
        aria-label="readonly-input2"
        onChange={({ target: { value } }) => setStoreName(value)}
        value={storeName}
        onKeyDown={({ key }) => {
          if (key === "Enter") {
            clearMarkers(markerss);
            searchByText(location, btnvalue);
          }
        }}
      ></input>
      <p className="text pt-3">
        Or only address and choose from the proposed <br />
        options:
      </p>
      {/* <div className="options w-75 d-flex justify-content-start">
        <Switch onChange={(checked) => switchOff(checked)} checked={switchOn} />
        <div className="text-wrap" style={{ paddingLeft: "10px" }}>
          <span>Delivery today?</span>
        </div>
      </div> */}
      <div className="store-type pt-2 w-75 d-flex justify-content-between">
        <div
          className="btn-group w-100"
          role="group"
          aria-label="Basic outlined example"
        >
          <ToggleButtonGroup
            name="select-options"
            type="radio"
            value={btnvalue}
            onChange={(e) => setbtnValue(e)}
          >
            <ToggleButton
              variant="outline-primary"
              value={"store"}
              onClick={selectSearchByType}
            >
              store
            </ToggleButton>
            <ToggleButton
              variant="outline-primary"
              value={"drugstore"}
              onClick={selectSearchByType}
            >
              drug store
            </ToggleButton>
            <ToggleButton
              variant="outline-primary"
              value={"clothing_store"}
              onClick={selectSearchByType}
            >
              clothing store
            </ToggleButton>
            <ToggleButton
              variant="outline-primary"
              value={"food"}
              onClick={selectSearchByType}
            >
              food
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
      <div>
        {/* <button 
          onClick={() => 
            computeDistance({origin: ["Greenwich, England"], destination: ["Stockholm, Sweden"], results, setSorted })}
        >
          press Me
        </button> */}
      </div>
      <div
        className="place-info-container w-75 h-50 mt-4"
        style={{ overflowY: "scroll" }}
      >
        <ul>
          {results &&
            results.map((item, index) => (
              <li
                key={index}
                className="place-detail-li"
                onClick={() => getDetails(item, map)}
              >
                {item.formatted_address}
              </li>
            ))}
        </ul>
      </div>
      <Modal show={show1} onHide={handleClose1}>
        <Modal.Header closeButton>
          <Modal.Title>Place details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <pre className="modal-item2">
            {JSON.stringify({ ...placeDetails }, null, 2)}
          </pre>
        </Modal.Body>
      </Modal>
    </>
  );
}

function findPlaceByAdress(
  map: google.maps.Map,
  value: string,
  setLocation: Dispatch<React.SetStateAction<PlaceLocation>>,
  setPredictions: Dispatch<React.SetStateAction<any>>
) {
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ address: value }, function (results, status) {
    if (status === "OK" && results) {
      setPredictions(results);
    } else {
      alert(
        "Geocode was not successful for the following reason: " +
          status +
          ", results length: " +
          results?.length
      );
    }
  });
}

function createMarker(
  map: google.maps.Map,
  result: google.maps.GeocoderResult | null,
  markers: google.maps.Marker[],
  setMarkers: Dispatch<React.SetStateAction<google.maps.Marker[]>>
) {
  if (result) {
    map.setCenter(result.geometry.location);
    map.setZoom(15);

    const marker = new google.maps.Marker({
      map: map,
      position: result.geometry.location,
    });

    setMarkers([...markers, marker]);
  }
}

function setMapOnAll(
  map: google.maps.Map | null,
  markers: google.maps.Marker[]
) {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers(markers: google.maps.Marker[]) {
  setMapOnAll(null, markers);
}

// Shows  markers currently in the array.
function showMarkers(map: google.maps.Map, markers: google.maps.Marker[]) {
  setMapOnAll(map, markers);
}

type Place = (string | google.maps.LatLng)[];

type computeDistanceArgs = {
  origin: Place; 
  destination: Place;
  filteredPlaces?: any;
  results?: google.maps.places.PlaceResult[], 
  setSorted?: any
}

function computeDistance({ origin, destination, results, setSorted }: computeDistanceArgs) {
  // const origin1 = new google.maps.LatLng(55.930385, -3.118425);
  // const origin2 = "Greenwich, England";
  // const destinationA = "Stockholm, Sweden";
  // const destinationB = new google.maps.LatLng(50.087692, 14.42115);
  const callback = (response: google.maps.DistanceMatrixResponse | null, status: any) => {
    // See Parsing the Results for
    // the basics of a callback function.
    if (status !== "OK") {
      alert("Error was: " + status);
    } else {
      console.log(results);
      // const objWithIndex = response?.rows[0].elements.reduce((prev, curr, index) => [ ...prev, {[index]: curr }], []);
      const objWithIndex = response?.rows[0].elements.map((distance,index)=>({distance, address: response?.destinationAddresses[index]}));

      const sortedd = objWithIndex?.sort((a, b) => a.distance.distance.value - b.distance.distance.value);
      console.log('sorted: ', sortedd);
      
      let newArr: google.maps.places.PlaceResult[] = [];

      results && sortedd?.forEach((element, index) => {
        for (let i = 0; i < results.length; i++) {
          // debugger;
          if (results[i].formatted_address === element.address) {
            newArr.push(results[i]);
            break;
          }       
        }
      });

      setSorted(newArr);
      // const filterdRows = response.rows[0].elements.sort((a: any, b: any) => a.distance.value - b.distance.value);
      //console.log('filterdRows: ', filterdRows);
      
      //filteredPlaces(response);
    }
  }
  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [...origin],
      destinations: [...destination],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false,
    },
    callback
  );
}
