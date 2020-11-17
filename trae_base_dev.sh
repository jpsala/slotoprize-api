#!/bin/sh
DEV=sloto-dev
host=$(hostname)
if [ $host = $DEV ]
then
        echo "Estoy en DEV, CUIDADO!!!!!!!"
        exit
fi
echo 'no estoy en dev...'


now=$(date -d "today" +"%Y%m%d-%H%M")
echo dump en slotoprizes.prod
ssh jpsala@dev.slotoprizes.tagadagames.com "sh /prg/api/dump.sh"
rm wopidom.dump 2>/dev/null
echo ################## volví del WOPI
mv wopidom.local.dump wopidom.local.$now.dump 2>/dev/null
mv wopidom.dump.bz2 wopidom.dump.$now.bz2 2>/dev/null
echo scp
scp -C  jpsala@dev.slotoprizes.tagadagames.com:/prg/api/wopidom.dump.bz2  .
echo bunzip2
bunzip2 wopidom.dump.bz2
echo drop
mysqladmin drop wopidom -u jpsala -plani0363 -f
echo create
mysqladmin create --default-character-set=utf8 wopidom -u jpsala --password=lani0363 -f
echo import
pv wopidom.dump |mysql wopidom -u jpsala --password=lani0363

