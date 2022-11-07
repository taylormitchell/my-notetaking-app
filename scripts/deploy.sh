create dist.zip
source ./scripts/create-dist.sh
zip -r dist.zip dist
scp dist.zip $DROPLET_USER@$DROPLET_IP:~/dist.zip
rm dist.zip
rm -rf dist
ssh $DROPLET_USER@$DROPLET_IP \
    "unzip dist.zip && "\
    "rm dist.zip && "\
    "rm -rf code/my-notetaking-app && "\
    "mv dist code/my-notetaking-app && "\
    "cd code/my-notetaking-app && "\
    "PATH=/home/$DROPLET_USER/.nvm/versions/node/v17.7.1/bin:$PATH && "\
    "npm install --omit=dev && "\
    "pm2 restart my-notetaking-app"