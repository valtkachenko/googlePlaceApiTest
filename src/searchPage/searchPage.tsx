import React, { Dispatch, useEffect, useRef, useState } from "react";
// import Switch from "react-switch";
import { debounce } from "lodash";
import {
  Dropdown,
  FormControl,
  ListGroup,
  Modal,
  ToggleButton,
  ToggleButtonGroup,
} from "react-bootstrap";
import "./searchPage.css";
import logo from "../geolocation.svg";
import placesTypes from "./placesTypes";

type Props = {
  map: google.maps.Map;
};

type PlaceLocation = {
  lat: () => number;
  lng: () => number;
};

type FormatedDetails = {
  name: string;
  formatted_address: string;
  international_phone_number: string;
  open_now: string | boolean;
  weekday_text: string | string[];
  rating: string | number;
  place_id: string;
  business_status: string;
  photos: google.maps.places.PlacePhoto[];
};

interface GetDetails {
  (
    result: google.maps.places.PlaceResult,
    map: google.maps.Map,
    index?: number,
    service?: google.maps.places.PlacesService
  ): Promise<any>; //google.maps.places.PlaceResult | null;
}

type PlaceType = any; //"store" | "drugstore" | "food" | "clothing_store";

export function SearchPage({ map }: Props) {
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
  const [results, setResults] = useState<
    (google.maps.places.PlaceResult & { icon: string | undefined } & {
      openHours?: { hours: string | undefined; minutes: string | undefined };
    } & {
      distance?: number | undefined;
    })[]
  >(undefined as any);
  const [
    placeDetails,
    setPlaceDetails,
  ] = useState<google.maps.places.PlaceResult>(undefined as any);
  const [
    formatedPlaceDetails,
    setFormatedlaceDetails,
  ] = useState<FormatedDetails>(undefined as any);
  const [markerss, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isClick, setClick] = useState(false);
  const [sorted, setSorted] = useState<google.maps.places.PlaceResult[]>(
    undefined as any
  );

  const DAY_OF_WEEK = new Date().getDay();

  useEffect(() => {
    if (formatedPlaceDetails) {
      return handleShow1();
    }
    if (placeDetails) {
      setFormatedlaceDetails(formatDetails(placeDetails));
    }
  }, [placeDetails, formatedPlaceDetails]);

  useEffect(() => {
    if (sorted) {
      // console.log("sorted: ", sorted);
    }
  }, [sorted]);

  useEffect(() => {
    if (results) {
      d1();
    }
  }, [results]);

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
    if (!placeLocation?.lat()) {
      return;
    }
    const location = { lat: placeLocation.lat(), lng: placeLocation.lng() };
    const callback = async (
      results: google.maps.places.PlaceResult[] | null,
      status: google.maps.places.PlacesServiceStatus
    ) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // const icon = place.photos && place.photos[0].getUrl({ maxWidth: 35, maxHeight: 35 });
        // const resultsWithPhoto = results.map((element) => ({
        //   ...element,
        //   icon:
        //     element.photos &&
        //     element.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 }),
        // }));
        // console.log('places: ', resultsWithPhoto);

        // const moreDetailedRes = results.reduce<MoreDetailedRes>(
        //   (prev, current) => {
        //     const details = getDetails(current, map);
        //     const detailsWithPhoto = details && {
        //       ...details,
        //       icon:
        //         details?.photos &&
        //         details.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 }),
        //     };
        //     return details !== null ? [...prev, detailsWithPhoto] : prev;
        //   },
        //   []
        // );
        // const lk: (google.maps.places.PlaceResult &
        //   {
        //     icon: string | undefined;
        //   }
        // )[] = moreDetailedRes.filter(el => el !== null);
        const service = new google.maps.places.PlacesService(map);
        //console.log('result ', results);

        const moreDetailedRes = await Promise.allSettled(
          results.map(async (place, index) => {
            const details = await getDetails(place, map, index, service);

            if (details) {
              const detailsWithPhoto = {
                ...details,
                icon:
                  details?.photos &&
                  details.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 }),
              };
              return detailsWithPhoto;
            }
            return Promise.resolve();
          })
        );

        const resovedDetails: (google.maps.places.PlaceResult & {
          icon: string | undefined;
        })[] = moreDetailedRes.reduce((prev: any, current) => {
          if (current.status === "fulfilled") {
            return [...prev, current.value];
          }

          return prev;
        }, []);
        //console.log('resovedDetails: ', resovedDetails);
        const resovedDetailsWithOpenHours = resovedDetails.map((item) => {
          if (item?.opening_hours?.periods) {
            let h = item?.opening_hours?.periods[DAY_OF_WEEK]?.close?.hours;
            let m = item?.opening_hours?.periods[DAY_OF_WEEK]?.close?.minutes;

            let formatH;
            let formatM;

            if ((h || h === 0) && (m || m === 0)) {
              formatH = String(h)
                ? "" + (String(h).length === 1 ? "0" + h : h)
                : undefined;
              formatM = String(m)
                ? String(m).length === 1
                  ? "0" + m
                  : String(m)
                : undefined;
            }
            // console.log('minutes ', formatM, ' ', typeof formatM);
            // console.log('hours ', formatH, ' ', typeof formatH);

            return {
              ...item,
              openHours: {
                hours: formatH,
                minutes: formatM,
              },
            };
          }
          return item;
        });

        const detailsWithDistance = resovedDetailsWithOpenHours.map((place) => {
          const destinationLat = place.geometry?.location?.lat();
          const destinationLng = place.geometry?.location?.lng();

          if (destinationLat && destinationLng) {
            return {
              ...place,
              distance: getDistanceBetweenTwo(
                location.lat,
                location.lng,
                destinationLat,
                destinationLng
              ),
            };
          }
          return { ...place, distance: undefined };
        });

        const sortedDWD = detailsWithDistance.sort((place1, place2) => {
          if (place1?.distance && place2?.distance) {
            return place1.distance - place2.distance;
          }
          return 0;
        });

        setResults(sortedDWD);

        const mrks: google.maps.Marker[] = [];
        for (let i = 0; i < resovedDetails.length; i++) {
          const marker = new google.maps.Marker({
            map: map,
            position: resovedDetails[i].geometry?.location,
          });
          mrks.push(marker);
        }
        setMarkers(mrks);
      }
    };

    const request = {
      location,
      radius: 10000,
      query: defaultRequest ? "" : storeName,
      type: type ?? "store",
    };

    const service = new google.maps.places.PlacesService(map);
    service.textSearch(request, callback);
  };

  const getDetails: GetDetails = (
    result: google.maps.places.PlaceResult,
    map: google.maps.Map,
    index = 1,
    service
  ) => {
    return new Promise((res, rej) => {
      const placeId = result.place_id;
      const request = placeId && {
        placeId,
        fields: ["All"],
      };

      if (request && service) {
        setTimeout(
          () =>
            service.getDetails(request, async (place, status) => {
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                place &&
                place.geometry &&
                place.geometry.location
              ) {
                res(place);
              }
              rej(status);
            }),
          index * 500
        );
      }
    });
  };

  const formatDetails = (details: google.maps.places.PlaceResult) => {
    return {
      name: details?.name ?? "",
      formatted_address: details?.formatted_address ?? "",
      international_phone_number: details?.international_phone_number ?? "",
      open_now: details?.opening_hours?.isOpen() ?? "",
      weekday_text: details?.opening_hours?.weekday_text ?? "",
      rating: details?.rating ?? "",
      place_id: details?.place_id ?? "",
      business_status: details?.business_status ?? "",
      photos: details?.photos ?? [],
    };
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
    const m1 = results.map((place) => place.geometry?.location);
    //let m2: google.maps.LatLng[] = undefined as any;

    // if (m1 !== undefined) {
    //   m2 = m1 !== undefined && m1.filter(loc => {
    //     if (loc !== null && loc !== undefined) {
    //       return loc;
    //     }
    //   });
    // }
    computeDistance({
      origin: [address],
      destination: [...(m1 as any)],
      results,
      setSorted,
    });
  };

  const inputRef = useRef<HTMLInputElement>(undefined as any);

  // const CustomToggle = React.forwardRef<any, { onClick: () => void }>(({ children, onClick }, ref) => (
  //   // <a
  //   //   href=""
  //   //   ref={ref}
  //   //   onClick={(e) => {
  //   //     e.preventDefault();
  //   //     onClick(e);
  //   //   }}
  //   // >
  //   //   {children}
  //   //   &#x25bc;
  //   // </a>
  // ));

  // forwardRef again here!
  // Dropdown needs access to the DOM of the Menu to measure it
  type Props = {
    children: React.ReactNode;
    style: any;
    className: any;
    "aria-labelledby": any;
  };
  const CustomMenu = React.forwardRef<any, Props>(
    ({ children, style, className, "aria-labelledby": labeledBy }, ref) => {
      const [value, setValue] = useState("");

      return (
        <div
          ref={ref}
          style={style}
          className={className}
          aria-labelledby={labeledBy}
        >
          <FormControl
            autoFocus
            className="mx-3 my-2 w-auto"
            placeholder="Type to filter..."
            onChange={(e) => setValue(e.target.value)}
            value={value}
          />
          <ul className="list-unstyled">
            {React.Children.toArray(children).filter(
              (child) => !value // || child.props.children.toLowerCase().startsWith(value),
            )}
          </ul>
        </div>
      );
    }
  );

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
        {/* <div
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
        </div> */}
        <div className="place-type w-100">
          <Dropdown
            onSelect={(e) => {
              if (e) {
                setbtnValue(e);
                selectSearchByType();
              }
            }}
          >
            <Dropdown.Toggle
              variant="outline-info"
              id="dropdown-custom-components"
              className="w-100"
            >
              Select place type ...
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              {placesTypes.map((type) => (
                <Dropdown.Item eventKey={type}>{type}</Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        {/* <div>
        <ListGroup>
          {placesTypes.map( type => <ListGroup.Item>{type}</ListGroup.Item> )}
        </ListGroup>
        </div> */}
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
        {results &&
          results.map((item, index) => (
            <div
              key={index}
              className="place-detail-li container d-flex p-0"
              onClick={async () => {
                if (item) {
                  setPlaceDetails(item);
                  //setTimeout(formatDetails, 0, placeDetails);
                  //setTimeout(handleShow1, 1);
                  // handleShow1();
                }
              }}
            >
              <div className="row w-100">
                <div className="col-2 place-photo pr-2 w-100 h-100">
                  {item.icon && (
                    <img
                      className="place-icon"
                      src={item.icon}
                      alt="alter"
                    ></img>
                  )}
                </div>
                <p className="col-8 w-100 h-100">
                  <strong>{item.name}</strong>
                  <br />
                  {item.formatted_address}
                </p>
                <p className="col-2 d-flex d-flex align-items-start flex-column">
                  {(item?.openHours?.hours &&
                    "open until " +
                      item?.openHours?.hours +
                      ":" +
                      item?.openHours?.minutes) ||
                    "no schedule"}
                  <strong style={{ display: "block" }}>
                    {item.distance?.toFixed(2) + " km" || "-"}
                  </strong>
                </p>
              </div>
            </div>
          ))}
      </div>
      <Modal show={show1} onHide={handleClose1}>
        <Modal.Header closeButton>
          <Modal.Title>Place details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <pre className="modal-item2">
            {formatedPlaceDetails &&
              Object.entries(formatedPlaceDetails).map((entry, index) => {
                const [key, value] = entry;
                if (key === "photos") {
                  return;
                }
                return <p key={index}>{key + ": " + String(value)}</p>;
              })}
          </pre>
          <div>
            photos:
            {formatedPlaceDetails &&
              formatedPlaceDetails.photos.map((el) => {
                return (
                  <img
                    src={el.getUrl({ maxWidth: 400, maxHeight: 400 })}
                    style={{
                      height: "100px",
                      width: "100px",
                      paddingLeft: "5px",
                    }}
                    alt="React Logo"
                  />
                );
              })}
          </div>
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
      console.log(
        "location: ",
        results[0].geometry.location.lat(),
        results[0].geometry.location.lng()
      );

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
  results?: google.maps.places.PlaceResult[];
  setSorted?: any;
};

function computeDistance({
  origin,
  destination,
  results,
  setSorted,
}: computeDistanceArgs) {
  // const origin1 = new google.maps.LatLng(55.930385, -3.118425);
  // const origin2 = "Greenwich, England";
  // const destinationA = "Stockholm, Sweden";
  // const destinationB = new google.maps.LatLng(50.087692, 14.42115);
  const callback = (
    response: google.maps.DistanceMatrixResponse | null,
    status: any
  ) => {
    // See Parsing the Results for
    // the basics of a callback function.
    if (status !== "OK") {
      alert("Error was: " + status);
    } else {
      // console.log(results);
      // const objWithIndex = response?.rows[0].elements.reduce((prev, curr, index) => [ ...prev, {[index]: curr }], []);
      const objWithIndex = response?.rows[0].elements.map(
        (distance, index) => ({
          distance,
          address: response?.destinationAddresses[index],
        })
      );

      const sortedd = objWithIndex?.sort(
        (a, b) => a.distance.distance.value - b.distance.distance.value
      );
      // console.log("sorted: ", sortedd);

      let newArr: google.maps.places.PlaceResult[] = [];

      results &&
        sortedd?.forEach((element, index) => {
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
  };
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

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function getDistanceBetweenTwo(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadiusKm = 6371;

  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}
