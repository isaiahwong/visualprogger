#!/usr/bin/env bash
./wait-for-it.sh mongo:27017 -- mongorestore --host mongo -d visualprogger ./dump