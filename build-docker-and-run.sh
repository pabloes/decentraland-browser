#!/bin/bash
echo "building image ..."
docker build --progress=plain -t dcl-browser-image .
echo "stopping previous container ..."
if [ $(docker ps -q -f name=dcl-browser-container) ]; then
  docker stop dcl-browser-container
else
  echo "Container dcl-browser-container is not running."
fi
echo "deleting previous container ..."
if [ $(docker container ls -a -q -f name=dcl-browser-container) ]; then
  docker rm dcl-browser-container
else
  echo "Container dcl-browser-container does not exist."
fi
echo "running container..."
docker run --env-file ./.docker.env --rm -d --name dcl-browser-container -p 3000:3000 dcl-browser-image
echo "showing container logs ..."
docker logs dcl-browser-container --follow