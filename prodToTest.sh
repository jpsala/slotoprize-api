#!/bin/sh
rm -f backup.sql
# add -d to mysqdump to backup only metadata
mysqldump -d -u jpsala --password=lani0363 wopidom > backup.sql
#sed -i '1 i\SET autocommit=0;SET GLOBAL log_bin_trust_function_creators = 1;SET unique_checks=0;SET foreign_key_checks=0;' backup.sql
#echo "SET foreign_key_checks=0;SET unique_checks=0;COMMIT;" >> backup.sql

mysqladmin drop wopitest -f -u root -plani0363 -f
mysqladmin create --default-character-set=utf8 wopitest -u root --password=lani0363 -f
mysql wopitest -u root --password=lani0363<backup.sql



# mysqldump meta --single-transaction -R -u root --password=lani0363 > backup.sql
