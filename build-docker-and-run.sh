#!/bin/bash

# Build the Docker image
docker build -t dcl-browser .
docker stop dcl-browser-container
docker rm dcl-browser-container
# Run the container based on the built image
docker run --env-file .docker.env --rm -d --name dcl-browser-container -p 3000:3000 dcl-browser

docker logs dcl-browser-container --follow