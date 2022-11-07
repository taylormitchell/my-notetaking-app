rm -rf dist
rsync -rv --exclude=node_modules --exclude=client --exclude='.env*' --exclude=package-lock.json src/* dist
rsync -rv src/client/build dist/client
envsubst < src/.env.prod > dist/.env