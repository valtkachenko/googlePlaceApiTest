import { Loader } from "@googlemaps/js-api-loader";
import { Dispatch, FC, SetStateAction } from "react";

type LoaderTypes = {
  apiKey: string;
  version?: string;
  additionalOptions?: any;
};

type Props = {
  setMap: Dispatch<SetStateAction<google.maps.Map>>;
};

export function MapWrapper(WrappedComponent: FC<{ loader?: any, setMap: Dispatch<SetStateAction<google.maps.Map>> }>, loaderArg: LoaderTypes, props: Props) {
   const loader = new Loader({
    apiKey: loaderArg.apiKey,
    version: loaderArg.version ?? "weekly",
    ...loaderArg.additionalOptions,
  });

  const propswith = { ...props, loader, setMap: props.setMap };

  return () => <WrappedComponent { ...propswith } />;
}
