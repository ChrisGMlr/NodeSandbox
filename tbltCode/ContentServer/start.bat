@echo off
if not exist node_modules (
	call npm install
)

node index.js %1
