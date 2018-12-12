import * as Plotly from 'plotly.js';
import { MapBound } from './map-bound';
import { CanvasBound } from './canvas-bound';
import { WindVector } from './wind-vector';
import { XyVector } from './xy-vector';
import { distortXy } from './geometry';

const main = function() {

    const mapBound = new MapBound(85, 180, -85, -180);
    const canvasBound = new CanvasBound(0, 0, 180, 360);

    const xData: Plotly.Datum[] = [];
    const yData: Plotly.Datum[] = [];
    const zUData: Plotly.Datum[] = [];
    const zVData: Plotly.Datum[] = [];


    for (let y = canvasBound.yMin; y<canvasBound.yMax; y+=2) {
        for (let x = canvasBound.xMin; x<canvasBound.xMax; x+=2) {
            const wind = distortXy(new XyVector(x, y), new WindVector(10, 10), mapBound, canvasBound);
            xData.push(x);
            yData.push(y);
            zUData.push(wind.u);
            zVData.push(wind.v);
        }
    }

    const traces: Partial<Plotly.PlotData>[] = [
        <any>{
            x: xData,
            y: yData,
            z: zUData,
            mode: "markers",
            type: "mesh3d",
            name: 'Wind U'
        },
        <any>{
            x: xData,
            y: yData,
            z: zVData,
            mode: "markers",
            type: "mesh3d",
            name: 'Wind V'
        }
    ];

    const layout: Partial<Plotly.Layout> = {
        title: 'Distortion',
        autosize: false,
        width: 1000,
        height: 800,
        margin: {
            l: 65,
            r: 50,
            b: 65,
            t: 90,
        }
    };

    Plotly.plot('myDiv', traces, layout);

}

main();