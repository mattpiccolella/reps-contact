#!/bin/bash

npm install
export DEBUG=AddYourRepresentatives:*
nodemon -e js,html
