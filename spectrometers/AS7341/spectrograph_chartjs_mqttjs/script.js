/*
  Spectrograph
  Written for serial input from AS7341, but could be adapted
  for other spectrometers, and for other transport mechanisms.

  Assumes a set of comma-separated values.

  uses the mqtt.js client. and chart.js. 
  For more on chart.js, see https://www.chartjs.org/
  For more on the mqtt.js client library: https://github.com/mqttjs/MQTT.js/
  The client is set up to send to any MQTT broker (https://next.shiftr.io/try),
 
  created 29 Dec 2022
  modified 18 Feb 2025
  by Tom Igoe
*/

// All these brokers work with this code. 
// Uncomment the one you want to use. 

////// emqx. Works in both basic WS and TLS WS:
// const broker = 'wss://broker.emqx.io:8084/mqtt'
// const broker = 'ws://broker.emqx.io:8083/mqtt'

//////// shiftr.io desktop client. 
// Fill in your desktop IP address for localhost:
// const broker = 'ws://localhost:1884';     

//////// shiftr.io, requires username and password 
// (see options variable below):
const broker = 'wss://public.cloud.shiftr.io';

//////// test.mosquitto.org, uses no username and password:
// const broker = 'wss://test.mosquitto.org:8081';

// MQTT client:
let client;

// connection options:
let options = {
  // Clean session
  clean: true,
  // connect timeout in ms:
  connectTimeout: 10000,
  // Authentication
  // add a random number for a unique client ID:
  clientId: 'mqttJsClient-' + Math.floor(Math.random() * 1000000),
  // add these in for public.cloud.shiftr.io:
  username: 'public',
  password: 'public'
}
// topic to subscribe to when you connect:
let topic = 'spectrometer';

// whether the client should be publishing or not:
let publishing = true;

// HTML divs for messages
let localDiv;
let timestampDiv;
// canvas for the chart and its context:
let canvas, ctx;

// fill in wavelengths of your spectrometer here:
let wavelengths = [415, 445, 480, 515, 555, 590, 630, 680, 910, 'clear'];
let numBands = 10;

// array to put the readings from the sensors into:
let readings = new Array();

// instance of the chart:
let chart;

// data object for the chart:
const data = {
  labels: wavelengths,
  datasets: [{
    label: 'AS7341 Spectrometer',
    data: new Array(),
    backgroundColor: new Array()
  }]
};

const config = {
  type: 'bar',
  data: data,
  options: {
    responsive: true,
    plugins: {
      // this gets rid of the box by the data label:
      legend: {
        labels: {
          boxWidth: 0
        }
      }
    },
    // change the animation from one reading to the next:
    animation: {
      duration: 200 // in ms
    }
  }
};

function setup() {
  // attempt to connect:
  client = mqtt.connect(broker, options);
  // set listeners:
  client.on('connect', onConnect);
  client.on('close', onDisconnect);
  client.on('message', onMessage);
  client.on('error', onError);

  // create a div for local messages:
  localDiv = document.getElementById("localDiv");
  localDiv.innerHTML = 'Waiting for client connection';
  localDiv.style.position = { "top": 20, "left": 10 };
  // set up a canvas for the chart:
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  // instantiate the chart:
  chart = new Chart(
    ctx,   // context: this sketch
    config // config from the global variables
  );
  // push each wavelength onto the chart's
  // background color and borderColor:
  for (w of wavelengths) {
    // if the band name  in the visible spectrum, calculate its color:
    if (w > 400 && w < 700) {
      chart.data.datasets[0].backgroundColor.push(wavelengthToColor(w));
    }
    else {
      if (w > 900) { // for near IR, use deep red:
        chart.data.datasets[0].backgroundColor.push('#770000');
      } else { // for 'clear', use black as its color:
        chart.data.datasets[0].backgroundColor.push('#000000');
      }
    }
  }
  // make a text div for the timestamp of each reading:
  timestampDiv = document.getElementById("timestampDiv");
  timestampDiv.innerHTML = 'last reading at: ';
  timestampDiv.style.position = { "top": window.innerWidth - 300, "left": 10 };
}

function loop() {
  // update the chart:
  chart.update();
}

// handler for mqtt connect event:
function onConnect() {
  localDiv.innerHTML = 'client is connected';
  client.subscribe(topic);
}

// handler for mqtt disconnect event:
function onDisconnect(error) {
    localDiv.innerHTML = 'onConnectionLost:' + error;
}

// handler for mqtt error event:
function onError(error) {
  // update localDiv text:
  localDiv.innerHTML = error;
}

// handler for mqtt subscribe event:
function onSubscribe(response, error) {
  if (!error) {
    // update localDiv text:
    localDiv.innerHTML = 'Subscribed to broker.';
  } else {
    // update localDiv text with the error:
    localDiv.innerHTML = error;
  }
}

// handler for mqtt message received event:
function onMessage(topic, payload, packet) {
  // Split the message into an array:
  let message = payload.toString();
  let readings = message.split(',');
  // if you have all the readings, put them in the chart:
  if (readings.length >= numBands) {
    chart.data.datasets[0].data = readings;
    // update the timestamp:
    timestampDiv. innerHTML = 'last reading at: ' + new Date().toLocaleString();
  }
}

// takes wavelength in nm and returns an rgba value
// adapted from https://scienceprimer.com/javascript-code-convert-light-wavelength-color
function wavelengthToColor(wavelength) {
  var r, g, b, alpha, colorSpace,
    wl = wavelength,
    gamma = 1;
  // UV to indigo:
  if (wl >= 380 && wl < 440) {
    R = -1 * (wl - 440) / (440 - 380);
    G = 0;
    B = 1;
    // indigo to blue:
  } else if (wl >= 440 && wl < 490) {
    R = 0;
    G = (wl - 440) / (490 - 440);
    B = 1;
    // blue to green:
  } else if (wl >= 490 && wl < 510) {
    R = 0;
    G = 1;
    B = -1 * (wl - 510) / (510 - 490);
    // green to yellow:
  } else if (wl >= 510 && wl < 580) {
    R = (wl - 510) / (580 - 510);
    G = 1;
    B = 0;
    // yellow to orange:
  } else if (wl >= 580 && wl < 645) {
    R = 1;
    G = -1 * (wl - 645) / (645 - 580);
    B = 0.0;
    // orange to red:
  } else if (wl >= 645 && wl <= 780) {
    R = 1;
    G = 0;
    B = 0;
    // IR:
  } else {
    R = 0;
    G = 0;
    B = 0;
  }

  // intensity is lower at the edges of the visible spectrum.
  if (wl > 780 || wl < 380) {
    alpha = 0;
  } else if (wl > 700) {
    alpha = (780 - wl) / (780 - 700);
  } else if (wl < 420) {
    alpha = (wl - 380) / (420 - 380);
  } else {
    alpha = 1;
  }
  // combine it all:
  colorSpace = "rgba(" + (R * 100) + "%," + (G * 100) + "%," + (B * 100) + "%, " + alpha + ")";
  return colorSpace;
}

// on page load, call the setup function:
document.addEventListener('DOMContentLoaded', setup);
// run a loop every 2 seconds:
setInterval(loop, 2000);