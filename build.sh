#!/bin/sh

cd web
npm run build
rm -r ../src/universal/web
cp -r build/ ../src/universal/web/
cd ..
sbt stage
