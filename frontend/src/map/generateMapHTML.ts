/**
 * HTML для WebView с Яндекс.Картами: маркеры и опционально автомобильный маршрут по дорогам
 * (multiRouter) с учётом пробок и слоём «Пробки».
 */

export type MapPoint = {
  id: string;
  lat: number;
  lon: number;
  /** Уже локализованная строка для hint и балуна */
  name: string;
};

export type GenerateMapHtmlOptions = {
  points: MapPoint[];
  /** Автомобильный маршрут по дорогам между точками по порядку (Яндекс.Маршрутизация + пробки) */
  useDrivingRoute?: boolean;
};

export function generateMapHTML({ points, useDrivingRoute }: GenerateMapHtmlOptions): string {
  const safePoints = points.map((p) => ({
    id: p.id,
    lat: p.lat,
    lon: p.lon,
    name: p.name,
  }));

  const drivingFlag = Boolean(useDrivingRoute && safePoints.length >= 2);

  return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: black; }
        #map { width: 100%; height: 100%; }
        .dark-mode-map .ymaps-2-1-79-map {
            filter: invert(100%) hue-rotate(180deg) contrast(90%) !important;
        }
        .dark-mode-map ymaps[class*="-image"] {
            filter: invert(100%) hue-rotate(180deg) !important;
        }
    </style>
    <script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=" type="text/javascript"></script>
    <script>
        let myMap;

        ymaps.ready(init);

        function init() {
            const pointsData = ${JSON.stringify(safePoints)};
            const useDriving = ${drivingFlag};

            myMap = new ymaps.Map("map", {
                center: pointsData.length ? [pointsData[0].lat, pointsData[0].lon] : [48.7423, 44.5370],
                zoom: 12,
            });

            document.getElementById('map').classList.add('dark-mode-map');

            try {
                var traffic = new ymaps.control.TrafficControl({ state: { trafficShown: true } });
                myMap.controls.add(traffic, { float: 'right' });
            } catch (e) {}

            if (useDriving && pointsData.length >= 2) {
                var referencePoints = pointsData.map(function (p) { return [p.lat, p.lon]; });
                var multiRoute = new ymaps.multiRouter.MultiRoute({
                    referencePoints: referencePoints,
                    params: {
                        routingMode: 'auto',
                        results: 1,
                        avoidTrafficJams: true
                    }
                }, {
                    boundsAutoApply: true,
                    wayPointVisible: false,
                    routeActiveStrokeWidth: 6,
                    routeActiveStrokeColor: '#FFD700'
                });
                myMap.geoObjects.add(multiRoute);
            }

            pointsData.forEach(function (monument) {
                var placemark = new ymaps.Placemark([monument.lat, monument.lon], {
                    hintContent: monument.name,
                    balloonContent: monument.name
                }, {
                    preset: 'islands#yellowIcon'
                });

                placemark.events.add('click', function () {
                    myMap.setCenter([monument.lat, monument.lon], 15, { checkZoomRange: true, duration: 500 });
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'MARKER_CLICK',
                        id: monument.id
                    }));
                });

                myMap.geoObjects.add(placemark);
            });

            if (!useDriving && pointsData.length > 0) {
                try {
                    var bounds = myMap.geoObjects.getBounds();
                    if (bounds) {
                        myMap.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
                    }
                } catch (e) {}
            }
        }

        function toggleLayer(isSatellite) {
            if (myMap) {
                myMap.setType(isSatellite ? 'yandex#hybrid' : 'yandex#map');
                if (isSatellite) {
                    document.getElementById('map').classList.remove('dark-mode-map');
                } else {
                    document.getElementById('map').classList.add('dark-mode-map');
                }
            }
        }
    </script>
</head>
<body>
    <div id="map"></div>
</body>
</html>
`;
}
