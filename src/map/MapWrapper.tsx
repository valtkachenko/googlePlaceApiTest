import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { styles } from "./map.styles.json";

type Props = {
  loader?: any;
  setMap: Dispatch<SetStateAction<google.maps.Map>>
};

// // @ts-ignore google.maps.plugins
// let map: google.maps.Map;

export function GoogleMapContainer({ loader, setMap }: Props) {

  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current) {
      const map = new google.maps.Map(mapRef.current, {
        zoom: 12,
        center: {
          lat: 55.735222,
          lng: 12.508245,
        },
        styles,
      });

      setMap(map);
    }
  }, [mapRef]);

  return (
    <div style={{ width: "100%", height: "50vh" }}>
      <div
        className="GoogleMapContainer"
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
