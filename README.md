# Mobile heart BPM measurment

This repo contains a small project that hosts a js und css driven website that can measure your heartrate using only your camera and depending on the phone model also the flashlight.

## Usage
Open the [mobile website](LeHaFi.github.io) with your phone and allow camera access. After starting the measurement you need to place your finger lightly on the camera. If the flashlight is not turned on it is necessary to be in bright ambient light. It is essential to move as little as possible while the measurement is running. The best practice is to rest you hand on a table. The measurement takes a while so patients is important.

## How it works
The flashlight or ambient light shines through the finger. When your heard beats the local blood pressure increases and more blood is in between the light source and the phone camera. This results in a slight decrease of brightness.

A simple algorithm converts the RGB image into a hsv image. In the hsv image space it is simple to filter for red pixel (h component) and determine their brightness (v component).

A peak detection algorithm detects the individual heartbeats and calculates the average bpm.


## Screenshot
![Screenshot](/Screenshot.png?raw=true "Screenshot")
