#!/usr/bin/node
const {ILI9341} = require(__dirname+"/utils/ili9341.js");
const display = new ILI9341();
display.init();
display.clear();