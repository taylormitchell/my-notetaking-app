scp $DROPLET_USER@$DROPLET_IP:~/data/my-notetaking-app/db.sqlite ./src/data/db.sqlite
# pull data with unix timestamp suffix
# scp $DROPLET_USER@$DROPLET_IP:~/data/my-notetaking-app/db.sqlite ~/Downloads/db.sqlite.$(date +%s)