export class LatLng {
    public lat: number;
    public lng: number;

    constructor (lat?: number, lng?: number) {
        this.lat = lat || 0;
        this.lng = lng || 0;
    }
}