@echo off
rem Double-click to preview the site at http://localhost:8080 (needs Node.js installed)
start "" http://localhost:8080
node "%~dp0serve.mjs"
