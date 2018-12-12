import { MapBound } from './map-bound';
import { CanvasBound } from './canvas-bound';
import { WindVector } from './wind-vector';
import { LatLng } from './lat-lng';
import { XyVector } from './xy-vector';


export function canvasToMap (xy: XyVector, mapBound: MapBound, canvasBound: CanvasBound): LatLng {
    const ymin = mercatorY(mapBound.south);
    const ymax = mercatorY(mapBound.north);
    const xFactor = canvasBound.width / ( mapBound.width);
    const yFactor = canvasBound.height / ( ymax - ymin );

    const latRad = Math.atan((<any>Math).sinh(xy.y / yFactor + ymin));
    const lngRad = xy.x / xFactor + mapBound.west;

    return new LatLng(rad2deg(latRad), rad2deg(lngRad))
}

export function mercatorY (φ: number): number {
    return Math.log( Math.tan( φ / 2 + Math.PI / 4 ) );
}

/**
 * Project a point on the map
 * @param λ Longitude
 * @param φ Latitude
 * @return [x, y]
 */
export function mapToCanvas (latLng: LatLng, mapBound: MapBound, canvasBound: CanvasBound): XyVector {
    const ymin = mercatorY(mapBound.south);
    const ymax = mercatorY(mapBound.north);
    const xFactor = canvasBound.width / ( mapBound.width);
    const yFactor = canvasBound.height / ( ymax - ymin );

    let y = mercatorY(deg2rad(latLng.lat) );
    const x = (deg2rad(latLng.lng) - mapBound.west) * xFactor;
    y = (y - ymin) * yFactor;
    return new XyVector(x, y);
}

function deg2rad (deg: number): number {
    return deg * Math.PI / 180;
}

function rad2deg (rad: number): number {
    return rad * 180 / Math.PI;
}

/**
 *
 * @param λ Longitude
 * @param φ Latitude
 * @param x
 * @param y
 * @return []
 */
function distortion (latLng: LatLng, xy: XyVector, mapBound: MapBound, canvasBound: CanvasBound): number[] {
        const τ = 2 * Math.PI;
        const H = Math.pow(10, -5.2);
        const hλ = latLng.lng < 0 ? H : -H;
        const hφ = latLng.lat < 0 ? H : -H;

        const pλ = mapToCanvas(new LatLng(latLng.lat, latLng.lng + hλ), mapBound, canvasBound);
        const pφ = mapToCanvas(new LatLng(latLng.lat + hφ, latLng.lng), mapBound, canvasBound);

        // Meridian scale factor (see Snyder, equation 4-3), where R = 1. This handles issue where length of 1º λ
        // changes depending on φ. Without this, there is a pinching effect at the poles.
        const k = Math.cos(latLng.lat / 360 * τ);
        return [
            (pλ.x - xy.x) / hλ / k,
            (pλ.y - xy.y) / hλ / k,
            (pφ.x - xy.x) / hφ,
            (pφ.y - xy.y) / hφ
        ];
    }

    /**
     * Calculate distortion of the wind vector caused by the shape of the projection at point (x, y). The wind
     * vector is modified in place and returned by this function.
     * @param λ
     * @param φ
     * @param x
     * @param y
     * @param scale scale factor
     * @param wind [u, v]
     * @return []
     */
function distort (latLng: LatLng, xy: XyVector, scale: number, wind: WindVector, mapBound: MapBound, canvasBound: CanvasBound): WindVector {
    const u = wind.u * scale;
    const v = wind.v * scale;
    const d = distortion(latLng, xy, mapBound, canvasBound);

    // Scale distortion vectors by u and v, then add.
    wind.u = d[0] * u + d[2] * v;
    wind.v = d[1] * u + d[3] * v;
    return wind;
}

export function distortXy(xy: XyVector, wind: WindVector, mapBound: MapBound, canvasBound: CanvasBound): WindVector {
    const latLng = canvasToMap (xy, mapBound, canvasBound);
    return distort (latLng, xy, 1, wind, mapBound, canvasBound)
}