import { useEffect, useRef } from "react";
import createImageIdsAndCacheMetaData from "./lib/createImageIdsAndCacheMetaData";
import { RenderingEngine, Enums, volumeLoader, cornerstoneStreamingImageVolumeLoader } from "@cornerstonejs/core";
import { init as csRenderInit } from "@cornerstonejs/core";
import { init as csToolsInit } from "@cornerstonejs/tools";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";

volumeLoader.registerUnknownVolumeLoader(cornerstoneStreamingImageVolumeLoader);

function App() {
  const axialRef = useRef<HTMLDivElement>(null);
  const sagittalRef = useRef<HTMLDivElement>(null);
  const running = useRef(false);

  useEffect(() => {
    const setup = async () => {
      if (running.current) {
        return;
      }
      running.current = true;

      await csRenderInit();
      await csToolsInit();
      dicomImageLoaderInit({ maxWebWorkers: 1 });

      // Get Cornerstone imageIds and fetch metadata into RAM
      const imageIds = await createImageIdsAndCacheMetaData({
        StudyInstanceUID:
          "1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463",
        SeriesInstanceUID:
          "1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561",
        wadoRsRoot: "https://d3t6nz73ql33tx.cloudfront.net/dicomweb",
      });

      // Instantiate a rendering engine
      const renderingEngineId = "myRenderingEngine";
      const renderingEngine = new RenderingEngine(renderingEngineId);

      const volumeId = "myVolume";

      // Define a volume in memory
      const volume = await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds,
      });

      const viewportId1 = "CT_AXIAL";
      const viewportId2 = "CT_SAGITTAL";

      const viewportInput = [
        {
          viewportId: viewportId1,
          element: axialRef.current,
          type: Enums.ViewportType.ORTHOGRAPHIC,
          defaultOptions: {
            orientation: Enums.OrientationAxis.AXIAL,
          },
        },
        {
          viewportId: viewportId2,
          element: sagittalRef.current,
          type: Enums.ViewportType.ORTHOGRAPHIC,
          defaultOptions: {
            orientation: Enums.OrientationAxis.SAGITTAL,
          },
        },
      ];

      renderingEngine.setViewports(viewportInput);

      volume.load();

      setVolumesForViewports(
        renderingEngine,
        [{ volumeId }],
        [viewportId1, viewportId2]
      );
    };

    setup();
  }, [axialRef, sagittalRef, running]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div
        ref={axialRef}
        style={{
          width: "500px",
          height: "500px",
          backgroundColor: "#000",
        }}
      ></div>
      <div
        ref={sagittalRef}
        style={{
          width: "500px",
          height: "500px",
          backgroundColor: "#000",
        }}
      ></div>
    </div>
  );
}

export default App;