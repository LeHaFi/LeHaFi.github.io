//gloale Variablen
var video, canvas, canvasContext, streamVideo, buttonOverlay, infoMeasurement, valueMeasurement, errorScreenItem, ErrortextItem ;
var fps = 24;
var dataWindowLength = 2; //in sekunden. Zeitfesnter, der Datenspeicherung
var cameraOk  = false; //Kamerazugriff erlaubt?
var browserCompatible = 1; // -1 = Browser nicht kompatibel // -2 = faslche Bildorinentierung //-3 = unbekannt 1=OK


//gloable Bildwert Variablen der Handykamera
var graySum = 0;
var dataArray = [];
var dataArrayH = [];
var dataArrayV = [];
var dataArrayAvarage =[];
var beatArray = []; 
var fingerOnCamera = false;
var valueStable = false;
var readyToMeasure = false;
var measurementRunning = false;
var measurementRun= false;
var peakSensingWidth = 3;
var fakeBeat = [-0.7,0,0,0,0.5,1,2,3,5,2,-0.5,0,0,0,0,0,0,0.6]; 
var fakeBeatIndex = 0;

//Gloable Plot Variablen
var chart, dps, xVal, yVal;

//globale Rechenvariablen
var lastPeak = 0;
var lastBeat = 0;
var beatMeasurements = [];
var beatMeasurementsConti = [];
var measurementTime = 10; //sekunden
var passedCyles = 0;

//globale anzeigeVariablen
var measuredBeat = 0;
var passedMeasureTime = 0;
var heightPlot = 39;
var orientation = 0;
var opacityInput = 1; //Opacity des Plots


//Funktionen
setup();
browserCheck();

mainLoop(); //Starte Loop durch rekursiver Aufruf der gesamten HTML Seite 


if(document.getElementById("overlay") === null) {
	div = document.createElement("div");
	div.setAttribute('id', 'overlay');
	div.setAttribute('className', 'overlayBG');
	div.setAttribute('class', 'overlayBG');
	document.getElementsByTagName("body")[0].appendChild(div);

} 
else{
	document.getElementsByTagName("body")[0].removeChild(document.
	getElementById("overlay"));
}

	//Events:

	//Wenn sich der Bildschirm dreht	
	var supportsOrientationChange = "onorientationchange" in window,
	orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

	
	window.addEventListener(orientationEvent, function() {
		orientation =  window.orientation;
		if(orientation != 0){ //wenn nicht in portrait mode
			browserCompatible = -2;
		}else{
		browserCompatible = 1;
		}
	}, false);

	function mainLoop(){

		htmlTextFill();
		this.setTimeout(mainLoop, 1/fps * 1000);  //rekursiv /0.5sek

	}

	function browserCheck(){
		if(!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ) { //Handy?
			browserCompatible = -1;
			}else{
			if (!hasGetUserMedia()) { // Kamera?
				browserCompatible = -1;
			} else {
				orientation =  window.orientation;

				if(orientation != 0){ //Portrait Mode?
					browserCompatible = -2;
				}else{
				browserCompatible = 1;
				}
			}
		}
	}

	//Einstellungen laden und HTML Elemente übernehmen
	function setup(){
		video = document.getElementById('video'); //Videoobjekt der Seite
		canvas = document.getElementById('Canvas_Item');
		buttonOverlay = document.getElementById('Button_measurement');
		infoMeasurement = document.getElementById('infoMeasurement');
		valueMeasurement = document.getElementById('valueMeasurement');
		errorScreenItem = document.getElementById('Error_Item');
		ErrortextItem =document.getElementById('Errortext_Item'); 

		canvasContext = canvas.getContext('2d');
		arrayPrep();
	}	

	//Zugriff auf die Kamera vorbereiten und Video Setup
	function cameraSetup()
	{
		// Get access to the camera!
		if('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
			// Not adding `{ audio: true }` since we only want video now
			navigator.mediaDevices.getUserMedia({
				//Kamera Constrains:
				video: 
				{
					width: {ideal: 50},
					height: {ideal: 50},
					facingMode: ['environment']
				}
			}).then(function(stream) {
				streamVideo = stream;
				cameraOk = true;
				video.srcObject = stream;
				video.play();

				var track = stream.getVideoTracks()[0];
				//Taschenlampe einschalten
				const imageCapture = new ImageCapture(track)
				const photoCapabilities = imageCapture.getPhotoCapabilities().then(() => {
					track.applyConstraints({
						advanced: [{torch: true}]
					});
				});
			});
		}
	}

		//Kamera sauber beenden
	function cameraStop()
	{
		var track = streamVideo.getVideoTracks()[0];
		const imageCapture = new ImageCapture(track)
		const photoCapabilities = imageCapture.getPhotoCapabilities().then(() => {
			track.applyConstraints({
				advanced: [{torch: false}]
			});
		});
		video.pause();
	}

	//Funktion zur Darstellung des HTML Inhalts
	function htmlTextFill ()
	{
		passedMeasureTime = measurementTime - passedCyles * 1/fps;
		var passedMeasurePro = 100 - Math.floor((passedMeasureTime/measurementTime)*100);
		
		//Overlay um auf Fehler hinzuweisen
		if(browserCompatible != 1)
		{
			errorScreenItem.style.zIndex = "3";
			ErrortextItem.innerHTML= "Fehler";
			if(browserCompatible == -1){
				ErrortextItem.innerHTML= "Browser nicht kompatibel";
			}
			if(browserCompatible == -2){
				ErrortextItem.innerHTML= "Bitte Smartphone aufrecht drehen";
			}

			}else
			{
				errorScreenItem.style.zIndex = "0";
			}

			if(measurementRunning)
			{
				buttonOverlay.style.opacity = 0;	
				if(cameraOk){
					if(fingerOnCamera){
						if(valueStable){
							infoMeasurement.innerHTML = "Messung läuft. Bitte Warten:";
							valueMeasurement.innerHTML =  passedMeasurePro+" %";
						}else
						{
							infoMeasurement.innerHTML = "Finger ruhiger halten";
							valueMeasurement.innerHTML =  passedMeasurePro+" %";
						}				
					}else
					{
						infoMeasurement.innerHTML = "Finger auf Kamera legen";
						valueMeasurement.innerHTML =  passedMeasurePro+" %";
					}
				}else
				{ 
					infoMeasurement.innerHTML = "Kamerazugriff erlauben";
				}
			}else
			{
				buttonOverlay.style.opacity = 1;	
				animationLoop();
				// Animation im Hintergrund
				infoMeasurement.innerHTML = "Zum Messen bitte den Finger ruhig auf Kamera und Taschenlampe legen";
				valueMeasurement.innerHTML =  "";
				if(measurementRun)
				{
					infoMeasurement.innerHTML = "Gemessener Puls:";
					valueMeasurement.innerHTML = measuredBeat+"bpm";
			}
		}
	}

	function animationLoop(){

		fakeBeatIndex++;
		if(fakeBeatIndex > fakeBeat.length - 1)fakeBeatIndex = 0;

		arrayLength = dataArray.unshift(fakeBeat[fakeBeatIndex]);
		if(arrayLength > fps * dataWindowLength){ //array voll
			dataArray.pop();
		}
		peakSensing(dataArray);
		plotSimpleGraph();
		opacityInput = 0.3;
	}

	//Berechnung Bildwerte
	function imageCalculation() {
		w = canvas.width,
		h = canvas.height;
		canvasContext.drawImage(video, 0, 0, w, h);

		var apx = canvasContext.getImageData(0, 0, w, h);
		var data = apx.data;

		graySum = 0;
		VSum = 0;
		for(var i = 0; i < data.length; i+=4)
		{
			var r = data[i],
			g = data[i+1],
			b = data[i+2],
			gray = (r+g+b)/3;
			graySum = graySum + gray;

			VSum = VSum + rgbToHsv(data[i], data[i+1], data[i+2])[2];
		}

		var arrayLength = dataArray.unshift(graySum/(canvas.width*canvas.height));

		if(arrayLength > fps * dataWindowLength){ //array voll
			dataArray.pop();
		}

		var arrayLengthV = dataArrayV.unshift(VSum/(canvas.width*canvas.height));

		if(arrayLengthV > fps * dataWindowLength){ //array voll
			dataArrayV.pop();
		}

		//HSV H für Tonerkennung
		var redSum = 0;
		var redSpread = 0.06;
		var redTh = 0.3;
		for(var i = 0; i < data.length; i+=4)
		{
			//Pixel Rötlich?
			if((rgbToHsv(data[i], data[i+1], data[i+2])[0]>1-redSpread/2)||
			(rgbToHsv(data[i], data[i+1], data[i+2])[0]< redSpread/2))
			redSum++;
		}

		var arrayLengthH = dataArrayH.unshift(redSum/(canvas.width*canvas.height));

		if(arrayLengthH > fps * dataWindowLength){ //array voll
			dataArrayH.pop();
		}

		if (redSum/(canvas.width*canvas.height) > redTh) fingerOnCamera = true;
		else fingerOnCamera = false;

		valueStable = valueStableTest(dataArray, 20);
	}

	function peakSensing(inputArray){

		if(readyToMeasure){

			var arrayLength = 0;


			//Überprüfung von Stelle 3
			//Da Sähezahnform: 2 nach links und 4 nach rechts
			if(inputArray[3]>inputArray[1] &&
				inputArray[3]>inputArray[2] &&
				inputArray[3]>inputArray[4] &&
				inputArray[3]>inputArray[5] &&
				inputArray[3]>inputArray[6] &&
				inputArray[3]>inputArray[7] &&
				inputArray[3]>(dataArrayAvarage[3])&& (lastPeak<=0))
			{
				arrayLength = beatArray.unshift(1);
				lastPeak = (60/150)*fps/(2.5); //2.5 ist korrekturfktor
			}else{
			arrayLength = beatArray.unshift(0);
			lastPeak--;
			}

			//Speicher der Beats in array
			if(arrayLength > inputArray.length- peakSensingWidth ) {
				beatArray.pop();
			}

		}else{
		beatArray = arrayZero(beatArray);
		}

	}


	//true wenn die werte des übergeben arrays nicht weiter als der spread(prozent) auseinander sind
	function valueStableTest(inputArray, spread){

		var biggest = 0;
		var smallest = 10000000;
		var output = false;
		//größten/kleinsten wert rausfinden:
		for(var i = 0; i < inputArray.length; i++){
			if(inputArray[i]>biggest) biggest = inputArray[i] ;
			if(inputArray[i]<smallest) smallest = inputArray[i] ;
		}

		if((((biggest- smallest)/biggest)*100)< spread) output = true;


		return output;

	}

	function plotSimpleGraph(){

		var traceData = {
			line: {
				color: 'rgb(255, 255, 255)',
				width: 4,
				shape: "spline",
			},
			y: delayArray(dataArray, peakSensingWidth),
			//y: dataArray,
			type: 'scatter',
			opacity: opacityInput,
		};

		var traceBeats = {
			line: {
				color: 'rgb(0, 0, 0)',
				width: 4,
				shape: "spline",
			},
			y: beatArray,
			yaxis: 'y2',
			type: 'scatter',
			opacity: opacityInput,

		};

		var traceAvarage = {
			line: {
				color: 'rgb(0, 0, 255)',
				width: 3,
				shape: "spline",
			},
			y: dataArrayAvarage,
			yaxis: 'y1',
			type: 'scatter',
			opacity: opacityInput,

		};

		var plotdata = [traceData, traceBeats];
		var layout = {

			showlegend : false,
			paper_bgcolor : '#fa4924',
			plot_bgcolor : '#ff4920',
			height : ((window.innerHeight/100)*heightPlot),
			position: 'absolute',

			margin: {
				l: 0,
				r: 0,
				b: 0,
				t: 0,
				pad: 0
			},
			xaxis: {
				autorange: true,
				showgrid: false,
				zeroline: false,
				showline: false,
				autotick: true,
				ticks: '',
				showticklabels: false
			},
			yaxis: {
				autorange: true,
				showgrid: false,
				zeroline: false,
				showline: false,
				autotick: true,
				ticks: '',
				showticklabels: false
			},
			yaxis2 : {
				overlaying: 'y',
				side: 'right',
				autorange: false,
				showgrid: false,
				zeroline: false,
				showline: false,
				autotick: true,
				ticks: '',
				showticklabels: false,
				range: [0, 2]
			}
		};

		var ctx = Plotly.newPlot('Plot_Item', plotdata, layout, {displayModeBar : true, staticPlot: true,  responsive: true});

	}

	function beatAvarageCalculationContinius(measurementRunning){
		var output = 0;
		var beatSum = 0;

		if(measurementRunning){
			output = 0;	
		}else{
		//extreme Werte entfernen:
		arraySort(beatMeasurementsConti);
		//brechnung Anzahl extrema (die höchsten und die niedrigsten 20% werden entfernt 
		var numberOfExtreme = Math.floor(beatMeasurementsConti.length*0.2) ; // GANZZAHLIG
		var originalLength = beatMeasurementsConti.length;
		//Entfernen der Werte aus Array
		while(beatMeasurementsConti.length > originalLength - numberOfExtreme*2 ){
			//console.log(beatMeasurementsConti.length);
			beatMeasurementsConti.pop(); //vom anfang löschen
			beatMeasurementsConti.shift(); //vom ende löschen		
		}
		console.log(beatMeasurementsConti);
		while(beatMeasurementsConti.length > 0){
			beatSum = beatSum + beatMeasurementsConti.pop(); //Array leeren und Summe berechnen
		}

		output =Math.floor(beatSum / (originalLength - numberOfExtreme*2)); //Berechnung durschnitt ohne extrema

		}
		return output;

	}


	function calcAvarageArray(filterWidth){

		var arrayLength = dataArrayAvarage.unshift(avarageInArray(dataArray.slice(0,filterWidth)));

		if(arrayLength > dataArray.length - peakSensingWidth){ //array voll
			dataArrayAvarage.pop();
		}

	}

	function beatRateCalculatio(){
		if(readyToMeasure){
			var arrayLength = 0;
			if (beatArray[0] == 1){
				if(lastBeat != 0){
					var pulse = 60/(new Date().getTime() - lastBeat) *1000;
					//console.log(pulse);
					if(pulse> 35 && pulse < 190){ //Nicht sinvolle Werte verwerfen
						arrayLength =beatMeasurements.unshift(pulse);
						beatMeasurementsConti.unshift(pulse); //Alle Werte
					}
				}
				lastBeat = new Date().getTime(); //Speicher Millisekunden

				if(arrayLength > 12){ //array voll
					beatMeasurements.pop();
				}

			}

		}

	}

	function measurement(){

		imageCalculation();
		peakSensing(dataArray);
		measurementRunning = true;


		//Finger ist auf Kamera und Wert schwankt nicht mehr stark
		if(fingerOnCamera && valueStable && cameraOk)readyToMeasure= true;
		else readyToMeasure = false;

		if(passedCyles == 0){ //Beginn Messung
			cameraSetup();
			passedCyles++;	
			opacityInput = 1;
		}

		plotSimpleGraph();

		if(readyToMeasure){

			passedCyles++;
			beatRateCalculatio();
			calcAvarageArray(25);
			measuredBeat = beatAvarageCalculationContinius(true);
		}

		if(passedCyles+1 > fps * measurementTime){
			measurementRun = true;
			passedCyles = 0;
			measuredBeat = beatAvarageCalculationContinius(false);
			passedMeasureTime = 0;
			measurementRunning = false;
			cameraStop();	
			return; //Messung zuende
		}
		else
		{
			if(passedCyles-1 < fps * measurementTime) this.setTimeout(measurement, 1/fps * 1000); //wiederholung //rekusiev
		}
	}

	function rgbToHsv(r, g, b) {

		r /= 255, g /= 255, b /= 255;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, v = max;

		var d = max - min;
		s = max == 0 ? 0 : d / max;

		if (max == min) {
			h = 0; // achromatic
		} else {
			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}

			h /= 6;
		}

		return [ h, s, v ];
	}


	function delayArray(inputArray, delay){
		var output = []
		for(var i = delay; i < inputArray.length ; i++){
			output[i] = inputArray[i+delay];
		}
		return output;
	}

	function arrayPrep(){

		for(var i = 0; i < fps * dataWindowLength; i++){
			dataArray.unshift(fakeBeat[i%fakeBeat.length]);
		}
		for(var i = 0; i < (fps * dataWindowLength) - peakSensingWidth; i++){
			beatArray.unshift(0);
		}

		for(var i = 0; i < (fps * dataWindowLength) - peakSensingWidth; i++){
			dataArrayAvarage.unshift(0);
		}


	}

	function arrayZero(inputArray){
	
		output = [];
		for(var i = 0; i < inputArray.length; i++){
			output.unshift(0);
		}
		return output;
	}

	function arraySort(inputArray){

		inputArray.sort(function(a, b) {
			return a - b;
		});

	}

	function avarageInArray(inputArray){

		var sum =0;
		for(var i = 0; i < inputArray.length-1; i++){
			sum = sum+ inputArray[i];
		}
		output =sum/(inputArray.length-1);

		return output ;
	}

	function hasGetUserMedia(){
		// Note: Opera builds are unprefixed.
		return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia || navigator.msGetUserMedia);
	}
