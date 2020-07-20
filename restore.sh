#!/bin/sh
now=$(date -d "today" +"%Y%m%d-%H%M")
file="$1"
base="$2"

#[ -f "$file" ] || (echo "$FILE NOT FOUND" && exit 1)
[ -f "$file" ] || { echo "$file NOT FOUND" ; exit 1 ;}

echo drop
mysqladmin drop $2 -u root -plani0363 -f

echo create
mysqladmin create --default-character-set=utf8 $2 -u root --password=lani0363 -f

sed -i '1 i\SET autocommit=0;SET GLOBAL log_bin_trust_function_creators = 1;SET unique_checks=0;SET foreign_key_checks=0;' $file
echo "SET foreign_key_checks=0;SET unique_checks=0;COMMIT;" >> $file
echo import
mysql $2 -u root --password=lani0363<$1
