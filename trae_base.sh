#!/bin/sh
LIVE=slotoprizes
host=$(hostname)
if [ $host = $LIVE ]
then
        echo "Estoy en el WOPI, CUIDADO!!!!!!!"
        exit
fi
echo 'no estoy en slotoprizes'


now=$(date -d "today" +"%Y%m%d-%H%M")
echo dump en slotoprizes
ssh jpsala@slotoprizes.tagadagames.com "sh /prg/api/dump.sh"
rm wopidom.dump 2>/dev/null
echo ################## volví del WOPI
mv wopidom.local.dump wopidom.local.$now.dump 2>/dev/null
mv wopidom.dump.bz2 wopidom.dump.$now.bz2 2>/dev/null
echo scp
scp -C  jpsala@slotoprizes.tagadagames.com:/prg/api/wopidom.dump.bz2  .
echo bunzip2
bunzip2 wopidom.dump.bz2
echo drop
#mysqladmin drop wopidom -u root -plani0363 -f
#echo create
#mysqladmin create --default-character-set=utf8 wopidom -u root --password=lani0363 -f
#echo import
#pv wopidom.dump |mysql wopidom -u root --password=lani0363

