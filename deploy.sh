#!/bin/bash

git pull origin master
sudo /usr/local/bin/docker-compose pull
sudo /usr/local/bin/docker-compose up -d --build
